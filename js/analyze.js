(function () {
  // Self-contained text analyzer. Lives apart from app.js so a bug here stays
  // contained to the Analyze panel and cannot break the other tabs.
  const input = document.getElementById("analyze-input");
  const runBtn = document.getElementById("analyze-run");
  const clearBtn = document.getElementById("analyze-clear");
  const output = document.getElementById("analyze-output");
  const summary = document.getElementById("analyze-summary");
  const findings = document.getElementById("analyze-findings");
  if (!input || !runBtn || !output || !summary || !findings) return;

  const TERMS = typeof VOCAB_TERMS !== "undefined" ? VOCAB_TERMS : [];

  // Tokens that count as a machine subject or possessor. "it"/"its" are
  // included deliberately: in AI writing the pronoun almost always points at
  // the system. "agent" is intentionally excluded to avoid "travel agent"
  // style false positives.
  const CUES = new Set([
    "model", "models", "system", "systems", "ai", "llm", "llms",
    "chatbot", "chatbots", "bot", "bots", "gpt", "chatgpt", "claude",
    "gemini", "grok", "llama", "copilot", "bard", "algorithm", "algorithms",
    "network", "networks", "machine", "machines", "assistant", "assistants",
    "transformer", "it", "its"
  ]);

  // A clause/sentence boundary. The cue search stops here so a subject is not
  // borrowed across a sentence break or a semicolon.
  const BOUNDARY = /[.!?;]/;

  // form -> { id, scan, neg:Set, negNext:Set }
  const FORM_MAP = new Map();
  const TERM_BY_ID = new Map();
  TERMS.forEach((t) => {
    TERM_BY_ID.set(t.id, t);
    if (!t.scan || !Array.isArray(t.forms)) return;
    const neg = new Set((t.negativePrev || []).map((s) => s.toLowerCase()));
    const negNext = new Set((t.negativeNext || []).map((s) => s.toLowerCase()));
    t.forms.forEach((f) => FORM_MAP.set(f.toLowerCase(), { id: t.id, scan: t.scan, neg: neg, negNext: negNext }));
  });

  function tokenize(text) {
    const tokens = [];
    const re = /[A-Za-z]+/g;
    let m;
    while ((m = re.exec(text))) {
      tokens.push({ lower: m[0].toLowerCase(), start: m.index, end: m.index + m[0].length });
    }
    return tokens;
  }

  // A gated term flags only when a machine cue appears earlier in the same
  // sentence. Walking back token by token, we stop at the first sentence or
  // clause boundary so the subject of one sentence does not leak into the next.
  function cuePrecedes(text, tokens, i) {
    for (let j = i - 1; j >= 0; j--) {
      if (BOUNDARY.test(text.slice(tokens[j].end, tokens[j + 1].start))) break;
      if (CUES.has(tokens[j].lower)) return true;
    }
    return false;
  }

  function analyze(text) {
    const tokens = tokenize(text);
    const hits = [];
    const counts = new Map();
    for (let i = 0; i < tokens.length; i++) {
      const info = FORM_MAP.get(tokens[i].lower);
      if (!info) continue;
      // Suppress when the neighbouring token marks a known non-AI sense
      // (machine learning, belief state, decision tree, lies within, etc.).
      if (i > 0 && info.neg.has(tokens[i - 1].lower)) continue;
      if (i < tokens.length - 1 && info.negNext.has(tokens[i + 1].lower)) continue;
      if (info.scan === "gated" && !cuePrecedes(text, tokens, i)) continue;
      hits.push({ start: tokens[i].start, end: tokens[i].end, id: info.id });
      counts.set(info.id, (counts.get(info.id) || 0) + 1);
    }
    return { hits: hits, counts: counts };
  }

  function esc(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function renderHighlighted(text, hits) {
    let html = "";
    let pos = 0;
    hits.forEach((h) => {
      html += esc(text.slice(pos, h.start));
      html += `<mark class="analyze-hit" data-term-id="${esc(h.id)}">${esc(text.slice(h.start, h.end))}</mark>`;
      pos = h.end;
    });
    html += esc(text.slice(pos));
    return html;
  }

  function run() {
    const text = input.value;
    if (!text.trim()) {
      summary.textContent = "Paste some text to analyze.";
      output.hidden = true;
      output.innerHTML = "";
      findings.innerHTML = "";
      return;
    }

    const result = analyze(text);
    const hits = result.hits;
    const counts = result.counts;

    if (hits.length) {
      output.innerHTML = renderHighlighted(text, hits);
      output.hidden = false;
    } else {
      output.hidden = true;
      output.innerHTML = "";
    }

    let fhtml = "";
    counts.forEach((n, id) => {
      const t = TERM_BY_ID.get(id);
      if (!t) return;
      fhtml += `<div class="analyze-finding" id="finding-${esc(id)}">
        <h3>${esc(t.misleading)} <span class="analyze-count">${n}\u00d7</span></h3>
        <p>${esc(t.problem)}</p>
        <p class="analyze-swap">Use instead: ${esc(t.replacement)}</p>
      </div>`;
    });
    findings.innerHTML = fhtml;

    const total = hits.length;
    const nTerms = counts.size;
    if (total === 0) {
      summary.textContent = "No glossary terms flagged. That does not mean the text is clean, only that none of these terms showed up where they usually mislead.";
    } else {
      summary.textContent = `${total} ${total === 1 ? "word" : "words"} worth a second look, across ${nTerms} ${nTerms === 1 ? "term" : "terms"}. Surfaced for review, not flagged as errors.`;
    }
  }

  function clearAll() {
    input.value = "";
    output.hidden = true;
    output.innerHTML = "";
    findings.innerHTML = "";
    summary.textContent = "";
    input.focus();
  }

  runBtn.addEventListener("click", run);
  if (clearBtn) clearBtn.addEventListener("click", clearAll);

  // Clicking a highlighted word jumps to its finding and flashes it.
  output.addEventListener("click", (e) => {
    const mark = e.target.closest(".analyze-hit");
    if (!mark) return;
    const el = document.getElementById("finding-" + mark.dataset.termId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("flash");
    setTimeout(() => el.classList.remove("flash"), 1200);
  });
})();
