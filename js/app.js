(function () {
  // --- Tab elements ---
  const tabs = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".panel");
  const TAB_IDS = ["glossary", "practice", "rewrite", "etymology"];

  function setActiveTab(panelId) {
    const target = TAB_IDS.includes(panelId) ? panelId : "glossary";
    tabs.forEach((t) => {
      const active = t.dataset.panel === target;
      t.classList.toggle("active", active);
      t.setAttribute("aria-selected", active);
    });
    panels.forEach((p) => {
      const active = p.id === `panel-${target}`;
      p.classList.toggle("active", active);
      p.hidden = !active;
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      navigateTo({ tab: tab.dataset.panel }, true);
    });
  });

  // --- Glossary ---
  const glossaryList = document.getElementById("glossary-list");
  const searchInput = document.getElementById("glossary-search");
  const filterContainer = document.getElementById("source-filters");

  const sources = [...new Set(VOCAB_TERMS.map((t) => t.source))];
  let activeSource = "all";

  function renderFilters() {
    const allBtn = makeFilterBtn("all", "All");
    allBtn.classList.add("active");
    filterContainer.appendChild(allBtn);
    sources.forEach((src) => filterContainer.appendChild(makeFilterBtn(src, src)));
  }

  function makeFilterBtn(value, label) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "filter-btn";
    btn.textContent = label;
    btn.dataset.source = value;
    btn.addEventListener("click", () => {
      activeSource = value;
      filterContainer.querySelectorAll(".filter-btn").forEach((b) => {
        b.classList.toggle("active", b.dataset.source === value);
      });
      renderGlossary();
    });
    return btn;
  }

  function etymologyLookupSlug(term) {
    return term.id;
  }

  function renderGlossary() {
    const q = searchInput.value.trim().toLowerCase();
    const filtered = VOCAB_TERMS.filter((t) => {
      if (activeSource !== "all" && t.source !== activeSource) return false;
      if (!q) return true;
      const hay = [t.misleading, t.replacement, t.problem, t.better, ...(t.replacementAlternatives || [])]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });

    glossaryList.innerHTML = "";
    if (!filtered.length) {
      glossaryList.innerHTML = '<p class="empty-state">No terms match your search.</p>';
      return;
    }

    filtered.forEach((t) => {
      const isCaution = t.type === "caution";
      const card = document.createElement("article");
      card.className = isCaution ? "term-card caution" : "term-card";
      const headerRight = isCaution
        ? `<span class="term-flag">${esc(t.flag || "handle with care")}</span>`
        : `<span class="term-arrow" aria-hidden="true">\u2192</span><span class="term-replacement">${esc(t.replacement)}</span>`;
      const useLabel = isCaution ? "What to do" : "Use instead";
      const lookupWord = etymologyLookupSlug(t);
      card.innerHTML = `
        <div class="term-card-header">
          <span class="term-misleading">${esc(t.misleading)}</span>
          ${headerRight}
          <span class="term-source">${esc(t.source)}</span>
        </div>
        <div class="term-body">
          <p><strong>Why it misleads:</strong> ${esc(t.problem)}</p>
          <p><strong>${useLabel}:</strong> ${esc(t.better)}</p>
          <div class="term-examples">
            <p class="example-bad">${esc(t.exampleBad)}</p>
            <p class="example-good">${esc(t.exampleGood)}</p>
          </div>
          <p class="term-etymology-line"><button type="button" class="link-btn" data-etymology-word="${esc(lookupWord)}" title="Look up the etymology of ${esc(t.misleading)}">Etymology \u2197</button></p>
        </div>`;
      const etymologyLink = card.querySelector("[data-etymology-word]");
      if (etymologyLink) {
        etymologyLink.addEventListener("click", () => openEtymology(lookupWord));
      }
      glossaryList.appendChild(card);
    });
  }

  searchInput.addEventListener("input", renderGlossary);
  renderFilters();
  renderGlossary();

  // --- Practice ---
  const PRACTICE_TERMS = VOCAB_TERMS.filter((t) => t.type !== "caution");
  let practiceIndex = 0;
  let practiceOrder = shuffle([...PRACTICE_TERMS]);
  let score = { correct: 0, total: 0 };

  const practiceTerm = document.getElementById("practice-term");
  const practiceAnswer = document.getElementById("practice-answer");
  const practiceFeedback = document.getElementById("practice-feedback");
  const practiceHintText = document.getElementById("practice-hint-text");
  const practiceScore = document.getElementById("practice-score");
  const practiceHint = document.getElementById("practice-hint");

  function showPracticeTerm() {
    if (practiceIndex >= practiceOrder.length) {
      practiceOrder = shuffle([...PRACTICE_TERMS]);
      practiceIndex = 0;
    }
    const t = practiceOrder[practiceIndex];
    practiceTerm.textContent = t.misleading;
    practiceAnswer.value = "";
    practiceAnswer.focus();
    practiceFeedback.textContent = "";
    practiceFeedback.className = "practice-feedback";
    practiceHint.open = false;
    practiceHintText.textContent = t.problem;
    updateScore();
  }

  function acceptedAnswers(t) {
    const base = [t.replacement, ...(t.replacementAlternatives || [])];
    return base.map(normalize);
  }

  function checkAnswer(revealOnly) {
    const t = practiceOrder[practiceIndex];
    const answers = acceptedAnswers(t);
    const given = normalize(practiceAnswer.value);

    if (!revealOnly && given) {
      score.total += 1;
      const ok = answers.some((a) => a === given || a.includes(given) || given.includes(a));
      if (ok) {
        score.correct += 1;
        practiceFeedback.textContent = `Correct: "${t.replacement}"`;
        practiceFeedback.className = "practice-feedback correct";
      } else {
        practiceFeedback.innerHTML = `Not quite. Accepted: <strong>${esc(t.replacement)}</strong>`;
        practiceFeedback.className = "practice-feedback incorrect";
      }
      updateScore();
      return;
    }

    practiceAnswer.value = t.replacement;
    practiceFeedback.innerHTML = `Answer: <strong>${esc(t.replacement)}</strong>`;
    practiceFeedback.className = "practice-feedback";
  }

  function updateScore() {
    if (score.total === 0) {
      practiceScore.textContent = "";
      return;
    }
    const pct = Math.round((score.correct / score.total) * 100);
    practiceScore.textContent = `Session: ${score.correct} / ${score.total} correct (${pct}%)`;
  }

  document.getElementById("practice-check").addEventListener("click", () => checkAnswer(false));
  document.getElementById("practice-reveal").addEventListener("click", () => checkAnswer(true));
  document.getElementById("practice-next").addEventListener("click", () => {
    practiceIndex += 1;
    showPracticeTerm();
  });
  practiceAnswer.addEventListener("keydown", (e) => {
    if (e.key === "Enter") checkAnswer(false);
  });

  showPracticeTerm();

  // --- Rewrite ---
  const rewriteContainer = document.getElementById("rewrite-exercises");
  let rewriteIndex = 0;
  let rewriteOrder = shuffle([...REWRITE_EXERCISES]);

  function renderRewrite() {
    if (rewriteIndex >= rewriteOrder.length) {
      rewriteOrder = shuffle([...REWRITE_EXERCISES]);
      rewriteIndex = 0;
    }
    const ex = rewriteOrder[rewriteIndex];
    const card = document.createElement("div");
    card.className = "rewrite-card";

    const before = document.createElement("p");
    before.className = "rewrite-sentence";
    before.innerHTML = highlightFlags(ex.before);
    card.appendChild(before);

    const revealBtn = document.createElement("button");
    revealBtn.type = "button";
    revealBtn.className = "btn reveal-rewrite";
    revealBtn.textContent = "Reveal a careful rewrite";
    card.appendChild(revealBtn);

    const after = document.createElement("p");
    after.className = "rewrite-after";
    after.hidden = true;
    after.textContent = ex.after;
    card.appendChild(after);

    revealBtn.addEventListener("click", () => {
      after.hidden = false;
      revealBtn.disabled = true;
    });

    rewriteContainer.innerHTML = "";
    rewriteContainer.appendChild(card);
  }

  function highlightFlags(text) {
    return esc(text).replace(/\[\[(.+?)\]\]/g, '<span class="rewrite-flag">$1</span>');
  }

  document.getElementById("rewrite-next").addEventListener("click", () => {
    rewriteIndex += 1;
    renderRewrite();
  });

  renderRewrite();

  // --- Etymology ---
  const ETYMOLOGY_SUGGESTIONS = ["intelligence", "agent", "artificial", "consciousness", "hallucination"];
  const ETYMOLOGY_SESSION_PREFIX = "etymology:v3:wiktionary:";
  const etymologyWord = document.getElementById("etymology-word");
  const etymologyFeedback = document.getElementById("etymology-feedback");
  const etymologyResults = document.getElementById("etymology-results");
  const etymologySuggestions = document.getElementById("etymology-suggestions");
  const etymologyAnalyzeBtn = document.getElementById("etymology-analyze");
  let etymologyBusy = false;

  function renderEtymologySuggestions() {
    etymologySuggestions.innerHTML = "";
    ETYMOLOGY_SUGGESTIONS.forEach((word) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "suggestion-btn";
      btn.textContent = word;
      btn.addEventListener("click", () => {
        etymologyWord.value = word;
        analyzeEtymology();
      });
      etymologySuggestions.appendChild(btn);
    });
  }

  function etymologySessionKey(word) {
    return `${ETYMOLOGY_SESSION_PREFIX}${word.toLowerCase()}`;
  }

  function etymologyIsShortDerivation(text) {
    return typeof text === "string"
      && text.length <= 100
      && /^(?:From|Formed from|Coined from)\s+[a-z][a-z0-9'-]*\s+\+/i.test(text);
  }

  function etymologyNeedsRootFetch(data) {
    if (!data || !Array.isArray(data.entries) || data.entries.length !== 1) {
      return false;
    }
    const first = data.entries[0];
    const text = first && first.etymologies && first.etymologies[0];
    return etymologyIsShortDerivation(text);
  }

  function readEtymologySession(word) {
    try {
      const raw = sessionStorage.getItem(etymologySessionKey(word));
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.source !== "wiktionary" || etymologyNeedsRootFetch(data)) {
        sessionStorage.removeItem(etymologySessionKey(word));
        return null;
      }
      return data;
    } catch (err) {
      return null;
    }
  }

  function writeEtymologySession(word, payload) {
    try {
      sessionStorage.setItem(etymologySessionKey(word), JSON.stringify(payload));
    } catch (err) {
      // Session storage may be full or unavailable; lookup still works.
    }
  }

  function renderEtymologyResults(data) {
    let html = `<header class="etymology-result-header">
      <h2 class="etymology-headword">${esc(data.word)}</h2>
    </header>`;

    data.entries.forEach((entry) => {
      html += `<article class="etymology-entry">`;
      if (entry.lexicalCategory) {
        html += `<h3 class="etymology-category">${esc(entry.lexicalCategory)}</h3>`;
      }
      if (entry.etymologies.length) {
        html += `<div class="etymology-block">
          <p class="etymology-label">Etymology</p>
          <ul class="etymology-list">${entry.etymologies.map((e) => `<li>${esc(e)}</li>`).join("")}</ul>
        </div>`;
      }
      if (entry.definitions.length) {
        html += `<div class="etymology-block">
          <p class="etymology-label">Definitions</p>
          <ol class="definition-list">${entry.definitions.map((d) => `<li>${esc(d)}</li>`).join("")}</ol>
        </div>`;
      }
      html += "</article>";
    });

    if (data.attribution) {
      const sourceLink = data.sourceUrl
        ? `<a href="${esc(data.sourceUrl)}" rel="noopener noreferrer">View on Wiktionary</a>`
        : "";
      const etymonlineUrl = `https://www.etymonline.com/word/${encodeURIComponent(data.word)}`;
      const etymonlineLink = `<a href="${esc(etymonlineUrl)}" rel="noopener noreferrer" target="_blank">Compare on Etymonline</a>`;
      const links = [sourceLink, etymonlineLink].filter(Boolean).join(" \u00b7 ");
      html += `<p class="etymology-attribution">${esc(data.attribution)}${links ? ` \u00b7 ${links}` : ""}</p>`;
    }

    etymologyResults.innerHTML = html;
    etymologyResults.hidden = false;
  }

  function openEtymology(word) {
    navigateTo({ tab: "etymology", word: word }, true);
    const panel = document.getElementById("panel-etymology");
    if (panel) {
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function analyzeEtymology(opts) {
    const navigate = !opts || opts.navigate !== false;
    if (etymologyBusy) return;
    const word = etymologyWord.value.trim();
    if (!word) {
      etymologyFeedback.textContent = "Enter a word to look up.";
      etymologyFeedback.className = "etymology-feedback error";
      etymologyResults.hidden = true;
      return;
    }

    if (navigate) {
      setActiveTab("etymology");
      const state = { tab: "etymology", word: word };
      if (!history.state || history.state.tab !== "etymology" || history.state.word !== word) {
        history.pushState(state, "", stateToHash(state));
      }
    }

    etymologyBusy = true;
    etymologyAnalyzeBtn.disabled = true;
    etymologyFeedback.textContent = "Looking up etymology\u2026";
    etymologyFeedback.className = "etymology-feedback loading";
    etymologyResults.hidden = true;

    const sessionHit = readEtymologySession(word);
    if (sessionHit) {
      if (sessionHit.error) {
        etymologyFeedback.textContent = sessionHit.error;
        etymologyFeedback.className = "etymology-feedback error";
      } else {
        etymologyFeedback.textContent = "";
        etymologyFeedback.className = "etymology-feedback";
        renderEtymologyResults({ ...sessionHit, cached: true });
      }
      etymologyBusy = false;
      etymologyAnalyzeBtn.disabled = false;
      return;
    }

    try {
      const res = await fetch(`api/etymology.php?word=${encodeURIComponent(word)}`);
      const data = await res.json();
      if (!res.ok) {
        etymologyFeedback.textContent = data.error || "Lookup failed.";
        etymologyFeedback.className = "etymology-feedback error";
        writeEtymologySession(word, data);
        return;
      }
      if (!data.entries || !data.entries.length) {
        etymologyFeedback.textContent = "No etymology found for that word.";
        etymologyFeedback.className = "etymology-feedback error";
        return;
      }
      etymologyFeedback.textContent = "";
      etymologyFeedback.className = "etymology-feedback";
      writeEtymologySession(word, data);
      renderEtymologyResults(data);
    } catch (err) {
      etymologyFeedback.textContent = "Could not reach the lookup service.";
      etymologyFeedback.className = "etymology-feedback error";
    } finally {
      etymologyBusy = false;
      etymologyAnalyzeBtn.disabled = false;
    }
  }

  etymologyAnalyzeBtn.addEventListener("click", () => analyzeEtymology());
  etymologyWord.addEventListener("keydown", (e) => {
    if (e.key === "Enter") analyzeEtymology();
  });
  renderEtymologySuggestions();

  // --- History routing ---
  function stateToHash(state) {
    if (state && state.tab === "etymology" && state.word) {
      return `#etymology/${encodeURIComponent(state.word)}`;
    }
    return `#${state && state.tab ? state.tab : "glossary"}`;
  }

  function hashToState() {
    const raw = location.hash.replace(/^#/, "");
    if (!raw) {
      return { tab: "glossary" };
    }
    const parts = raw.split("/");
    const tab = parts[0];
    if (!TAB_IDS.includes(tab)) {
      return { tab: "glossary" };
    }
    if (tab === "etymology" && parts.length > 1) {
      return { tab: "etymology", word: decodeURIComponent(parts.slice(1).join("/")) };
    }
    return { tab: tab };
  }

  function applyState(state) {
    const tab = state && state.tab ? state.tab : "glossary";
    setActiveTab(tab);
    if (tab === "etymology" && state && state.word) {
      etymologyWord.value = state.word;
      analyzeEtymology({ navigate: false });
    }
  }

  function navigateTo(state, push) {
    const hash = stateToHash(state);
    if (push) {
      history.pushState(state, "", hash);
    } else {
      history.replaceState(state, "", hash);
    }
    applyState(state);
  }

  window.addEventListener("popstate", (e) => {
    applyState(e.state || hashToState());
  });

  const initialState = hashToState();
  history.replaceState(initialState, "", stateToHash(initialState));
  applyState(initialState);

  // --- Helpers ---
  function esc(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function normalize(s) {
    return s
      .toLowerCase()
      .replace(/[?.!,'"]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
})();
