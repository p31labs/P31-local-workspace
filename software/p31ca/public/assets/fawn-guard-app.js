/**
 * Fawn Guard UI — calls Worker POST /api/analyze (CORS required for p31ca.org).
 */
const FAWN_API = "https://fawn-guard.trimtab-signal.workers.dev/api/analyze";
const CIRCUMFERENCE = 2 * Math.PI * 28;

const textarea = document.getElementById("msg-input");
const analyzeBtn = document.getElementById("analyze-btn");
const clearBtn = document.getElementById("clear-btn");
const charCount = document.getElementById("char-count");
const scoreBanner = document.getElementById("score-banner");
const scoreArc = document.getElementById("score-arc");
const scoreNum = document.getElementById("score-num");
const scoreLabel = document.getElementById("score-label");
const scoreDetail = document.getElementById("score-detail");
const legendEl = document.getElementById("legend");
const outputSection = document.getElementById("output-section");
const highlightedOutput = document.getElementById("highlighted-output");
const flagsSection = document.getElementById("flags-section");
const flagsList = document.getElementById("flags-list");
const emptyState = document.getElementById("empty-state");

textarea.addEventListener("input", () => {
  charCount.textContent = textarea.value.length + " chars";
});

clearBtn.addEventListener("click", () => {
  textarea.value = "";
  charCount.textContent = "0 chars";
  resetResults();
});

analyzeBtn.addEventListener("click", async () => {
  const text = textarea.value.trim();
  if (!text) return;

  analyzeBtn.disabled = true;
  analyzeBtn.textContent = "Analyzing…";

  try {
    const res = await fetch(FAWN_API, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
      mode: "cors",
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    renderResults(text, data);
  } catch (e) {
    alert("Analysis failed: " + (e && e.message ? e.message : String(e)));
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = "Analyze";
  }
});

function resetResults() {
  scoreBanner.classList.remove("visible");
  outputSection.classList.remove("visible");
  flagsSection.classList.remove("visible");
  emptyState.classList.remove("visible");
}

function renderResults(text, data) {
  const { flags, fawnScore, totalSentences, flaggedSentences } = data;

  scoreBanner.classList.add("visible");
  const offset = CIRCUMFERENCE * (1 - fawnScore / 100);
  scoreArc.style.strokeDashoffset = offset;

  const arcColor =
    fawnScore === 0 ? "#14b8a6" : fawnScore < 30 ? "#f59e0b" : fawnScore < 60 ? "#f97316" : "#f43f5e";
  scoreArc.style.stroke = arcColor;

  scoreNum.innerHTML = fawnScore + "<span>%</span>";
  scoreNum.style.color = arcColor;

  if (fawnScore === 0) {
    scoreLabel.innerHTML = '<span class="fawn-score-clear-badge">&#10003; No fawn patterns</span>';
    scoreDetail.textContent =
      totalSentences +
      " sentence" +
      (totalSentences !== 1 ? "s" : "") +
      " analyzed. Message is direct and boundaried.";
  } else {
    const levelText =
      fawnScore < 30 ? "Low fawn signal" : fawnScore < 60 ? "Moderate fawn signal" : "High fawn signal";
    scoreLabel.style.color = arcColor;
    scoreLabel.textContent = levelText;
    scoreDetail.textContent =
      flaggedSentences +
      " of " +
      totalSentences +
      " sentence" +
      (totalSentences !== 1 ? "s" : "") +
      " contain fawn patterns. " +
      flags.length +
      " flag" +
      (flags.length !== 1 ? "s" : "") +
      " total.";
  }

  if (flags.length > 0) {
    const seenCats = [...new Set(flags.map((f) => f.categoryId))];
    const catMap = {};
    flags.forEach((f) => {
      catMap[f.categoryId] = { label: f.categoryLabel, color: f.color };
    });
    legendEl.innerHTML = seenCats
      .map(
        (id) =>
          '<div class="fawn-legend-item">' +
          '<div class="fawn-legend-dot" style="background:' +
          catMap[id].color +
          '"></div>' +
          catMap[id].label +
          "</div>"
      )
      .join("");
  } else {
    legendEl.innerHTML = "";
  }

  if (flags.length === 0) {
    outputSection.classList.remove("visible");
    flagsSection.classList.remove("visible");
    emptyState.classList.add("visible");
    return;
  }

  emptyState.classList.remove("visible");

  outputSection.classList.add("visible");
  highlightedOutput.innerHTML = buildHighlightedHTML(text, flags);

  flagsSection.classList.add("visible");
  const seen = new Set();
  const dedupedFlags = flags.filter((f) => {
    const key = f.categoryId + "::" + f.matchedText.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  flagsList.innerHTML = dedupedFlags
    .map(
      (f) =>
        '<div class="fawn-flag-card" style="border-left-color:' +
        f.color +
        "; background: " +
        f.colorDim +
        '">' +
        '<div class="fawn-flag-header">' +
        '  <span class="fawn-flag-category" style="color:' +
        f.color +
        '">' +
        escHtml(f.categoryLabel) +
        "</span>" +
        '  <span class="fawn-flag-matched">' +
        escHtml(f.matchedText) +
        "</span>" +
        "</div>" +
        '<div class="fawn-flag-rewrite"><strong>Rewrite</strong> ' +
        escHtml(f.rewrite) +
        "</div>" +
        "</div>"
    )
    .join("");
}

function buildHighlightedHTML(text, flags) {
  let result = "";
  let cursor = 0;

  for (const flag of flags) {
    if (flag.start > cursor) {
      result += escHtml(text.slice(cursor, flag.start));
    }
    result +=
      '<mark class="fawn-mark" style="background:' +
      flag.colorDim +
      "; color:" +
      flag.color +
      "; border-bottom: 2px solid " +
      flag.color +
      '" title="' +
      escHtml(flag.categoryLabel + ": " + flag.rewrite) +
      '">' +
      escHtml(text.slice(flag.start, flag.end)) +
      "</mark>";
    cursor = flag.end;
  }

  if (cursor < text.length) {
    result += escHtml(text.slice(cursor));
  }

  return result;
}

function escHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
