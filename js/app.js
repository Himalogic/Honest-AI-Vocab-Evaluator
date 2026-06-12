(function () {
  // --- Tabs ---
  const tabs = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".panel");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const panelId = tab.dataset.panel;
      tabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle("active", active);
        t.setAttribute("aria-selected", active);
      });
      panels.forEach((p) => {
        const active = p.id === `panel-${panelId}`;
        p.classList.toggle("active", active);
        p.hidden = !active;
      });
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
        </div>`;
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
