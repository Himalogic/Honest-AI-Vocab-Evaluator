<?php

function wiktionary_api_url(array $config): string
{
    return rtrim($config['wiktionary_api'] ?? 'https://en.wiktionary.org/w/api.php', '/');
}

function wiktionary_user_agent(array $config): string
{
    return $config['user_agent'] ?? 'HonestAIVocab/1.0 (+https://vocab.logosanalog.com)';
}

function wiktionary_page_url(string $word): string
{
    return 'https://en.wiktionary.org/wiki/' . rawurlencode($word) . '#English';
}

function wiktionary_http_get(array $config, string $url): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_USERAGENT => wiktionary_user_agent($config),
        CURLOPT_HTTPHEADER => ['Accept: application/json'],
    ]);

    $body = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($body === false) {
        return ['ok' => false, 'error' => 'Could not reach Wiktionary.', 'detail' => $curlError];
    }

    return ['ok' => true, 'status' => $status, 'body' => $body];
}

function wiktionary_fetch_parse(array $config, string $word): array
{
    $query = [
        'action' => 'parse',
        'page' => $word,
        'prop' => 'text',
        'format' => 'json',
        'formatversion' => '2',
        'redirects' => '1',
        'disablelimitreport' => '1',
        'disableeditsection' => '1',
    ];
    $url = wiktionary_api_url($config) . '?' . http_build_query($query);
    $res = wiktionary_http_get($config, $url);
    if (!$res['ok']) {
        return $res;
    }

    $data = json_decode($res['body'], true);
    if (!is_array($data)) {
        return ['ok' => false, 'error' => 'Unexpected response from Wiktionary.'];
    }

    return ['ok' => true, 'status' => $res['status'], 'data' => $data];
}

function wiktionary_inner_html(DOMNode $node): string
{
    $html = '';
    foreach ($node->childNodes as $child) {
        $html .= $node->ownerDocument->saveHTML($child);
    }
    return $html;
}

function wiktionary_clean_text(string $html): string
{
    $html = preg_replace('/<sup[^>]*class="[^"]*reference[^"]*"[^>]*>.*?<\/sup>/is', '', $html);
    $html = preg_replace('/<span[^>]*class="[^"]*mw-editsection[^"]*"[^>]*>.*?<\/span>/is', '', $html);
    $text = html_entity_decode(strip_tags((string) $html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $text = preg_replace('/\[\s*edit\s*\]/iu', '', $text);
    $text = preg_replace('/\[\d+\]/u', '', $text);
    $text = preg_replace('/[↑→←]/u', '', $text);
    $text = preg_replace('/\s+/u', ' ', $text);
    return trim((string) $text);
}

function wiktionary_is_etymology_paragraph(string $text): bool
{
    if ($text === '' || strlen($text) < 10) {
        return false;
    }
    if (preg_match('/^IPA\b/i', $text)) {
        return false;
    }
    // Headword gloss lines such as "bank ( countable and uncountable , plural banks )".
    if (preg_match('/^[\p{L}][\p{L}0-9\x{0027}\x{2032}\-]*\s+\(/u', $text)) {
        return false;
    }
    return true;
}

function wiktionary_heading_level(string $tag): int
{
    if (preg_match('/^h([1-6])$/i', $tag, $m)) {
        return (int) $m[1];
    }
    return 0;
}

// Returns [level, text]. Handles both the legacy <h2> markup and the 2024
// markup where headings are wrapped in <div class="mw-heading mw-heading2">.
function wiktionary_node_heading(DOMElement $node): array
{
    $level = wiktionary_heading_level(strtolower($node->tagName));
    if ($level > 0) {
        return [$level, wiktionary_clean_text($node->textContent ?? '')];
    }

    $class = $node->getAttribute('class');
    if ($class !== '' && strpos($class, 'mw-heading') !== false) {
        foreach ($node->childNodes as $child) {
            if ($child instanceof DOMElement) {
                $lv = wiktionary_heading_level(strtolower($child->tagName));
                if ($lv > 0) {
                    return [$lv, wiktionary_clean_text($child->textContent ?? '')];
                }
            }
        }
    }

    return [0, ''];
}

// Walks the parser output in document order. Captures paragraphs that sit under
// an "Etymology" heading inside the English language section. Each Etymology
// heading becomes one entry. Definitions are left empty; this feature is about
// origins, and per-part-of-speech definitions can be added later.
function wiktionary_extract_etymologies(string $html): array
{
    $previous = libxml_use_internal_errors(true);
    $document = new DOMDocument();
    $loaded = $document->loadHTML('<?xml encoding="utf-8" ?>' . $html, LIBXML_NOWARNING | LIBXML_NOERROR);
    libxml_clear_errors();
    libxml_use_internal_errors($previous);

    if (!$loaded) {
        return [];
    }

    $xpath = new DOMXPath($document);
    $container = $xpath->query("//div[contains(concat(' ', normalize-space(@class), ' '), ' mw-parser-output ')]")->item(0);
    if (!$container) {
        $container = $xpath->query('//body')->item(0);
    }
    if (!$container) {
        return [];
    }

    $entries = [];
    $current = null;
    $inEnglish = false;
    $capturing = false;

    foreach ($container->childNodes as $node) {
        if (!($node instanceof DOMElement)) {
            continue;
        }

        [$level, $headingText] = wiktionary_node_heading($node);

        if ($level === 2) {
            if ($current !== null) {
                $entries[] = $current;
                $current = null;
            }
            $inEnglish = (stripos($headingText, 'English') === 0);
            $capturing = false;
            continue;
        }

        if (!$inEnglish) {
            continue;
        }

        if ($level >= 3) {
            if ($current !== null) {
                $entries[] = $current;
                $current = null;
            }
            if (stripos($headingText, 'Etymology') === 0) {
                $capturing = true;
                $current = ['lexicalCategory' => '', 'etymologies' => [], 'definitions' => []];
            } else {
                $capturing = false;
            }
            continue;
        }

        if ($capturing && $current !== null && strtolower($node->tagName) === 'p') {
            $text = wiktionary_clean_text(wiktionary_inner_html($node));
            if (wiktionary_is_etymology_paragraph($text)) {
                $current['etymologies'][] = $text;
            }
        }
    }

    if ($current !== null) {
        $entries[] = $current;
    }

    return array_values(array_filter($entries, static function (array $entry) {
        return !empty($entry['etymologies']);
    }));
}

function wiktionary_extract_derivation_root(string $text): ?string
{
    if (!preg_match('/^(?:From|Formed from|Coined from)\s+([a-z][a-z0-9\'-]*)\s+\+/i', $text, $matches)) {
        return null;
    }

    return strtolower($matches[1]);
}

function wiktionary_is_short_derivation(string $text): bool
{
    $root = wiktionary_extract_derivation_root($text);
    if ($root === null) {
        return false;
    }

    return strlen($text) <= 100;
}

function wiktionary_parse_word_entries(array $config, string $word): ?array
{
    $wordId = strtolower($word);
    $fetch = wiktionary_fetch_parse($config, $wordId);
    if (!$fetch['ok'] || isset($fetch['data']['error'])) {
        return null;
    }

    $html = $fetch['data']['parse']['text'] ?? '';
    if (is_array($html)) {
        $html = $html['*'] ?? '';
    }
    if ($html === '') {
        return null;
    }

    $entries = wiktionary_extract_etymologies((string) $html);

    return $entries ?: null;
}

function wiktionary_enrich_with_root_etymologies(array $config, array $entries, string $wordId): array
{
    $roots = [];

    foreach ($entries as $entry) {
        foreach ($entry['etymologies'] as $text) {
            if (!wiktionary_is_short_derivation($text)) {
                continue;
            }
            $root = wiktionary_extract_derivation_root($text);
            if ($root === null || $root === $wordId) {
                continue;
            }
            $roots[$root] = true;
        }
    }

    foreach (array_keys($roots) as $root) {
        $rootEntries = wiktionary_parse_word_entries($config, $root);
        if (!$rootEntries) {
            continue;
        }

        $rootEntry = $rootEntries[0];
        $entries[] = [
            'lexicalCategory' => $root,
            'etymologies' => $rootEntry['etymologies'],
            'definitions' => [],
        ];
    }

    return $entries;
}

function wiktionary_lookup(array $config, string $word): array
{
    $wordId = strtolower($word);
    $fetch = wiktionary_fetch_parse($config, $wordId);

    if (!$fetch['ok']) {
        return ['ok' => false, 'status' => 502, 'error' => $fetch['error'], 'detail' => $fetch['detail'] ?? null, 'word' => $wordId];
    }

    $data = $fetch['data'];
    if (isset($data['error'])) {
        return [
            'ok' => false,
            'status' => 404,
            'error' => 'No Wiktionary entry found for that word.',
            'word' => $wordId,
        ];
    }

    $html = $data['parse']['text'] ?? '';
    if (is_array($html)) {
        $html = $html['*'] ?? '';
    }
    if ($html === '') {
        return [
            'ok' => false,
            'status' => 404,
            'error' => 'No Wiktionary entry found for that word.',
            'word' => $wordId,
        ];
    }

    $entries = wiktionary_extract_etymologies((string) $html);
    if (!$entries) {
        return [
            'ok' => false,
            'status' => 404,
            'error' => 'No etymology found on Wiktionary for that word.',
            'word' => $wordId,
        ];
    }

    $entries = wiktionary_enrich_with_root_etymologies($config, $entries, $wordId);

    return [
        'ok' => true,
        'status' => 200,
        'word' => $wordId,
        'entries' => $entries,
        'source' => 'wiktionary',
        'sourceUrl' => wiktionary_page_url($wordId),
        'attribution' => 'Etymology from Wiktionary, the free dictionary, licensed CC BY-SA 4.0.',
    ];
}
