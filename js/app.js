(function () {
  // --- Tab elements ---
  const tabs = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".panel");
  const TAB_IDS = ["glossary", "rewrite", "etymology", "analyze"];

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

  // Rank a term against the query. Headword matches outrank replacement
  // matches, which outrank matches buried in the body text. This keeps the
  // term that *is* the search word at the top.
  function matchScore(t, q) {
    const m = t.misleading.toLowerCase();
    const r = (t.replacement || "").toLowerCase();
    const alts = (t.replacementAlternatives || []).join(" ").toLowerCase();
    const body = [t.problem, t.better].filter(Boolean).join(" ").toLowerCase();
    if (m === q) return 100;
    if (m.startsWith(q)) return 80;
    if (m.includes(q)) return 60;
    if (r === q) return 50;
    if (r.includes(q)) return 40;
    if (alts.includes(q)) return 30;
    if (body.includes(q)) return 10;
    return 0;
  }

  function renderGlossary() {
    const q = searchInput.value.trim().toLowerCase();
    let filtered = VOCAB_TERMS.filter((t) => activeSource === "all" || t.source === activeSource);
    if (q) {
      filtered = filtered
        .map((t) => ({ t: t, s: matchScore(t, q) }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .map((x) => x.t);
    }

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
  const ETYMOLOGY_SESSION_PREFIX = "etymology:v1:";
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

  function readEtymologySession(word) {
    try {
      const raw = sessionStorage.getItem(etymologySessionKey(word));
      return raw ? JSON.parse(raw) : null;
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
      const sourceLabel = data.source === "wiktionary" ? "View on Wiktionary" : "View source";
      const sourceLink = data.sourceUrl
        ? `<a href="${esc(data.sourceUrl)}" rel="noopener noreferrer">${sourceLabel}</a>`
        : "";
      const etymonlineUrl = `https://www.etymonline.com/word/${encodeURIComponent(data.word)}`;
      const etymonlineLink = `<a href="${esc(etymonlineUrl)}" rel="noopener noreferrer">Compare on Etymonline</a>`;
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

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
})();
