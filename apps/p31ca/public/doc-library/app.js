/**
 * P31 document library — static HTML + Web Worker. No client bundle, no vDOM.
 *
 * Data path:  `index.json` (schema `p31.docLibrary/1.0.0`, built at repo root)
 * Search path: main thread debounces input → `doc-search-worker.js` (MiniSearch)
 *              → `results` with term lists for snippet highlighting
 * Markup:     with a query, rows 0–2 → `hit--prime` (left accent + badge). Each row has a
 *              `role="progressbar"` relevance track: score / max score in the current list.
 * Motion:     `--stagger` capped via `maxStaggerIndex` so 100+ hits don’t queue heavy CSS.
 */
(function () {
  "use strict";

  /** @typedef {{ id: string, path: string, title: string, text?: string, preview?: string, h2?: string[] }} IndexDocument */
  /** @typedef {{ id: string, terms: string[], score?: number, match?: unknown }} SearchHitMeta */

  const CONFIG = Object.freeze({
    queryDebounceMs: 120,
    maxQueryLength: 200,
    /** Capped list index for `--stagger` × --doclib-stagger-ms in CSS. */
    maxStaggerIndex: 24,
    schema: "p31.docLibrary/1.0.0",
    worker: "doc-search-worker.js",
  });

  /** @returns {{ type: "tag", tag: string, rest: string } | { type: "normal", q: string }} */
  function parseCategoryQuery(qs) {
    const s = String(qs).trim();
    const m = s.match(/^(legal|agent|shipped|stale):(.*)$/i);
    if (!m) return { type: "normal", q: s };
    return { type: "tag", tag: m[1].toLowerCase(), rest: (m[2] || "").trim() };
  }

  function docsMatchingTag(tag) {
    return docs.filter(function (d) {
      const tags = d.tags || [];
      if (tag === "stale") return d.daysSinceCommit != null && d.daysSinceCommit > 30;
      if (tag === "shipped") return tags.indexOf("shipped") !== -1;
      if (tag === "legal") return tags.indexOf("legal") !== -1 || d.cluster === "legal";
      if (tag === "agent") return tags.indexOf("agent") !== -1 || d.cluster === "agent_crew";
      return false;
    });
  }

  function filterDocsBySubstring(subset, sub) {
    if (!sub) return subset;
    const low = sub.toLowerCase();
    return subset.filter(function (d) {
      return (
        (d.text && d.text.toLowerCase().indexOf(low) !== -1) ||
        (d.title && d.title.toLowerCase().indexOf(low) !== -1) ||
        (d.path && d.path.toLowerCase().indexOf(low) !== -1)
      );
    });
  }

  const input = document.getElementById("q");
  const resultsEl = document.getElementById("results");
  const meta = document.getElementById("meta");
  const metaHint = document.getElementById("meta-hint");
  const clearBtn = document.getElementById("clear-q");
  const mainEl = document.getElementById("main");
  const searchBlock = document.getElementById("search-block");
  const footHint = document.getElementById("foot-hint");
  const tryChips = document.getElementById("try-chips");
  const comfortLine = document.getElementById("comfort-line");
  const specCountEl = document.getElementById("spec-count");
  const specTimeEl = document.getElementById("spec-time");

  const baseTitle = document.title;

  /** `generatedAt` from index.json for `<time datetime>` (ISO-8601). */
  let indexIso = "";

  /** One line per session (day + count–seeded index). */
  const COMFORT_PHRASES = [
    "No rush. One word, one chip, or plain browsing — all valid.",
    "The chips are a soft on-ramp if picking a search word feels like work.",
    "All of this is for you. Search is a shortcut; scrolling is not failure.",
    "Tired? Tap one chip. That still counts as progress.",
    "Nothing here is timed or graded. Find one link that helps, that is enough.",
    "What you curate in the tree meets you here in the tab — as above, so below.",
    "Same repository, gentler altitude: the words below echo the work above.",
  ];
  let worker = null;
  let workerReady = false;
  let searchSeq = 0;
  let activeSearchId = 0;
  let docs = [];
  let byId = new Map();
  let total = 0;
  let indexWhen = "";
  let debounceT;
  let skipUrl = false;

  function esc(s) {
    if (s == null) return "";
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function escapeRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function safeQuery(q) {
    return String(q)
      .replace(/[\n\r\u2028\u2029]+/g, " ")
      .slice(0, CONFIG.maxQueryLength);
  }

  function updateSpecStrip() {
    if (specCountEl) specCountEl.textContent = total > 0 ? String(total) : "—";
    if (specTimeEl) {
      specTimeEl.textContent = indexWhen && indexWhen !== "—" ? indexWhen : "—";
      if (indexIso) specTimeEl.setAttribute("datetime", indexIso);
      else specTimeEl.removeAttribute("datetime");
    }
  }

  function setSpecStripDash() {
    if (specCountEl) specCountEl.textContent = "—";
    if (specTimeEl) {
      specTimeEl.textContent = "—";
      specTimeEl.removeAttribute("datetime");
    }
  }

  /** Word-like runs (Unicode) with ASCII fallback for engines without \\p. */
  let reUnicodeWord = null;
  try {
    reUnicodeWord = new RegExp("[\\p{L}\\p{N}]+", "gu");
  } catch (e) {
    reUnicodeWord = null;
  }
  function simpleTokens(q) {
    const s = String(q).toLowerCase();
    if (reUnicodeWord) {
      return s.match(reUnicodeWord) || [];
    }
    return s.match(/[a-z0-9_]+/g) || [];
  }

  function fileHref(relPath) {
    const segs = relPath.split("/").map(encodeURIComponent);
    return "../../" + segs.join("/");
  }

  function makeUrlWithQ(qS) {
    const u = new URL(window.location.href);
    if (qS) u.searchParams.set("q", qS);
    else u.searchParams.delete("q");
    return u.pathname + u.search + u.hash;
  }

  function urlReplaceForQuery(qS) {
    if (typeof history === "undefined" || !history.replaceState) return;
    const next = makeUrlWithQ(qS);
    const cur = window.location.pathname + window.location.search + window.location.hash;
    if (next === cur) return;
    const st = history.state && typeof history.state === "object" ? history.state : {};
    history.replaceState(Object.assign({ p31q: qS || "" }, st), "", next);
  }

  function historyPushOnEnter() {
    if (typeof history === "undefined" || !history.pushState) return;
    const qS = input ? safeQuery(String(input.value).trim()) : "";
    if (!qS) return;
    const next = makeUrlWithQ(qS);
    history.pushState({ p31q: qS, p31lib: 1 }, "", next);
  }

  function updateMeta(visible, q) {
    const qSafe = q ? safeQuery(q) : "";
    const indexBit = "Index " + indexWhen;
    if (metaHint) metaHint.hidden = !qSafe;
    if (!qSafe) {
      let seenBrowseHi = true;
      try {
        seenBrowseHi = sessionStorage.getItem("p31.doclib.browseHi") === "1";
      } catch (e) {
        seenBrowseHi = false;
      }
      if (!seenBrowseHi) {
        try {
          sessionStorage.setItem("p31.doclib.browseHi", "1");
        } catch (e) {
          void e;
        }
        meta.textContent =
          "All " +
          total +
          " document" +
          (total === 1 ? "" : "s") +
          " — " +
          indexBit +
          ". At your own pace: type, a chip, or scroll.";
      } else {
        meta.textContent =
          "All " +
          total +
          " document" +
          (total === 1 ? "" : "s") +
          " — " +
          indexBit +
          ". Type a word, or try a chip.";
      }
      document.title = baseTitle;
      setFootHint(total > 3);
      return;
    }
    setFootHint(false);
    if (visible === 0) {
      meta.textContent =
        "No match for \u201c" +
        qSafe +
        "\u201d · " +
        indexBit +
        " — try a chip or a shorter word.";
    } else {
      meta.innerHTML =
        "Found <strong>" +
        visible +
        "</strong> of " +
        total +
        " · " +
        indexBit;
    }
    const short = qSafe.length > 48 ? qSafe.slice(0, 45) + "…" : qSafe;
    document.title = short + " · " + baseTitle;
  }

  function setClearVisible(on) {
    if (clearBtn) clearBtn.hidden = !on;
  }

  function setSearchBusy(on) {
    if (searchBlock) {
      if (on) searchBlock.classList.add("is-searching");
      else searchBlock.classList.remove("is-searching");
    }
  }

  function setFootHint(visible) {
    if (footHint) footHint.hidden = !visible;
  }

  function showComfort() {
    if (!comfortLine || !COMFORT_PHRASES.length) return;
    const day = Math.floor(Date.now() / 86400000);
    const idx = (day + (total | 0)) % COMFORT_PHRASES.length;
    comfortLine.textContent = COMFORT_PHRASES[idx];
    comfortLine.hidden = false;
  }

  function showResultSkeleton() {
    const bones = '<div class="skel-bone" aria-hidden="true"></div>'.repeat(4);
    resultsEl.innerHTML =
      '<div class="skel" role="status" aria-label="Preparing the index">' + bones + "</div>";
  }

  function highlightPlain(raw, terms, q) {
    if (!raw) return "";
    const tset = new Set(terms.map((t) => String(t).toLowerCase()).filter(Boolean));
    for (const t of simpleTokens(q)) tset.add(t);
    const uniq = [...tset].filter((t) => t.length).slice(0, 32);
    if (!uniq.length) return esc(raw);
    const re = new RegExp(uniq.map(escapeRe).join("|"), "gi");
    const s = String(raw);
    const parts = [];
    let last = 0;
    if (s.matchAll) {
      for (const m of s.matchAll(re)) {
        if (m.index == null) break;
        parts.push(esc(s.slice(last, m.index)));
        parts.push('<mark class="hi">' + esc(m[0]) + "</mark>");
        last = m.index + m[0].length;
      }
    } else {
      let m;
      re.lastIndex = 0;
      const max = 400;
      let g = 0;
      while (g++ < max && (m = re.exec(s)) !== null) {
        if (m.index == null) break;
        parts.push(esc(s.slice(last, m.index)));
        parts.push('<mark class="hi">' + esc(m[0]) + "</mark>");
        last = m.index + m[0].length;
        if (m[0] === "") re.lastIndex += 1;
      }
    }
    parts.push(esc(s.slice(last)));
    return parts.join("");
  }

  function makeSnippetBody(text, terms, q) {
    if (!text) return { html: esc(""), plain: 1 };
    const low = text.toLowerCase();
    const tset = new Set(terms.map((t) => String(t).toLowerCase()).filter((x) => x.length > 0));
    for (const t of simpleTokens(q)) tset.add(t);
    const uniq = [...tset].filter((t) => t.length);
    let start = 0;
    for (const t of uniq) {
      const i = low.indexOf(t);
      if (i !== -1) {
        start = Math.max(0, i - 100);
        break;
      }
    }
    if (!uniq.length) {
      const head = text.length > 220 ? text.slice(0, 220) + "…" : text;
      return { html: esc(head), plain: 1 };
    }
    const a = start;
    const b = Math.min(text.length, start + 220);
    const slice = text.slice(a, b);
    const prefix = a > 0 ? "…" : "";
    const suffix = b < text.length ? "…" : "";
    return { html: prefix + highlightPlain(slice, terms, q) + suffix, plain: 1 };
  }

  /**
   * Renders the hit list. Stagger is capped so long lists do not block first paint.
   * @param {IndexDocument[]} items
   * @param {string} query
   * @param {SearchHitMeta[] | null} hitMetas
   */
  function renderList(items, query, hitMetas) {
    const q = query ? safeQuery(query) : "";
    const hmap = hitMetas ? new Map(hitMetas.map((h) => [h.id, h])) : new Map();
    if (!items.length) {
      if (q) {
        resultsEl.innerHTML =
          '<div class="empty empty-state" role="status" aria-live="polite">' +
          '<h2 class="empty-lead display-font">No matching documents</h2>' +
          "<p class=\"empty-sub\">No hits for <strong>" +
          esc(q) +
          "</strong> — try a chip, a shorter word, or " +
          '<button type="button" class="btn-inline-clear" data-empty-clear>clear the search</button> to browse the full set.</p></div>';
        const clearEmpty = resultsEl.querySelector("[data-empty-clear]");
        if (clearEmpty) clearEmpty.addEventListener("click", clearSearch, { once: true });
        return;
      }
      resultsEl.innerHTML = '<p class="empty" role="status">No documents in index.</p>';
      return;
    }
    let maxScore = 0;
    if (q && hmap.size) {
      for (let j = 0; j < items.length; j++) {
        const hm0 = hmap.get(items[j].id);
        if (hm0 && typeof hm0.score === "number" && hm0.score > maxScore) {
          maxScore = hm0.score;
        }
      }
    }
    const rows = items.map((d, i) => {
      const href = fileHref(d.path);
      const hm = hmap.get(d.id);
      const tlist = (hm && hm.terms) || [];
      const stagger = Math.min(i, CONFIG.maxStaggerIndex);
      const h2s =
        Array.isArray(d.h2) && d.h2.length
          ? d.h2.slice(0, 6).join(" · ") + (d.h2.length > 6 ? "…" : "")
          : "";
      const h2 = h2s
        ? "<p class=\"h2\">" + (q ? highlightPlain(h2s, tlist, q) : esc(h2s)) + "</p>"
        : "";
      const titleHtml = q ? highlightPlain(d.title, tlist, q) : esc(d.title);
      const body = q
        ? makeSnippetBody(d.text || "", tlist, q)
        : { html: esc(d.preview || ""), plain: 1 };
      const rank = i + 1;
      const isPrime = Boolean(q && i < 3);
      const rel =
        maxScore > 0 && hm && typeof hm.score === "number"
          ? Math.min(1, Math.max(0, hm.score / maxScore))
          : 0;
      const relPct = Math.round(rel * 100);
      const relv =
        q && maxScore > 0
          ? '<div class="hit-relv" title="Relative score in this result set (higher = stronger match)">' +
            '<div class="hit-relv__track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' +
            relPct +
            '" aria-label="Match strength in this list: ' +
            relPct +
            ' percent of the top result">' +
            '<div class="hit-relv__fill" style="--p:' +
            rel.toFixed(6) +
            '"></div></div></div>'
          : "";
      return (
        "<li class=\"hit" +
        (isPrime ? " hit--prime" : "") +
        "\" style=\"--stagger: " +
        stagger +
        "\" role=\"listitem\" aria-label=\"Result " +
        rank +
        " of " +
        items.length +
        '">' +
        '<span class="hit-badge" aria-hidden="true">' +
        rank +
        "</span>" +
        "<article class=\"hit-inner\">" +
        "<a class=\"title display-font p31-mesh-tap\" href=\"" +
        esc(href) +
        '" title="Open: ' +
        esc(d.title).replace(/"/g, "&quot;") +
        '">' +
        titleHtml +
        "</a>" +
        '<div class="path">' +
        esc(d.path) +
        "</div>" +
        h2 +
        '<p class="preview">' +
        body.html +
        "</p>" +
        relv +
        "</article></li>"
      );
    });
    resultsEl.innerHTML = '<ol class="hits" role="list" aria-label="Documents">' + rows.join("") + "</ol>";
  }

  function runQuery() {
    if (!workerReady || !worker) {
      setSearchBusy(false);
      return;
    }
    const q = input && input.value != null ? String(input.value).trim() : "";
    const qS = q ? safeQuery(q) : "";
    if (q && !qS && input) input.value = qS;
    if (!qS) {
      if (skipUrl) {
        skipUrl = false;
      } else {
        urlReplaceForQuery("");
      }
      setClearVisible(false);
      renderList(docs, "", null);
      updateMeta(docs.length, "");
      try {
        window.dispatchEvent(new CustomEvent("p31-doclib-search", { detail: { all: true } }));
      } catch (e) {
        void e;
      }
      setSearchBusy(false);
      return;
    }
    const parsed = parseCategoryQuery(qS);
    if (parsed.type === "tag") {
      if (skipUrl) skipUrl = false;
      else urlReplaceForQuery(qS);
      setClearVisible(true);
      setSearchBusy(false);
      let subset = docsMatchingTag(parsed.tag);
      subset = filterDocsBySubstring(subset, parsed.rest);
      const idSet = new Set(subset.map(function (d) {
        return d.id;
      }));
      try {
        window.dispatchEvent(new CustomEvent("p31-doclib-search", { detail: { ids: idSet, q: qS } }));
      } catch (e) {
        void e;
      }
      renderList(subset, qS, null);
      updateMeta(subset.length, qS);
      return;
    }
    if (skipUrl) {
      skipUrl = false;
    } else {
      urlReplaceForQuery(qS);
    }
    setClearVisible(true);
    setSearchBusy(true);
    const myId = ++searchSeq;
    activeSearchId = myId;
    worker.postMessage({ type: "search", q: parsed.q, reqId: myId });
  }

  function onSearchResults(m) {
    if (m.reqId != null && m.reqId !== activeSearchId) return;
    if (m.type === "searchError") {
      meta.textContent = "Search error: " + (m.message || "unknown");
      setSearchBusy(false);
      return;
    }
    if (m.type !== "results" || m.q == null) return;
    const out = [];
    const metas = [];
    const list = m.hits || [];
    for (let i = 0; i < list.length; i++) {
      const h = list[i];
      const d = byId.get(h.id);
      if (d) {
        out.push(d);
        metas.push(h);
      }
    }
    renderList(out, m.q, metas);
    updateMeta(out.length, m.q);
    try {
      window.dispatchEvent(
        new CustomEvent("p31-doclib-search", { detail: { ids: new Set(out.map(function (x) { return x.id; })), q: m.q } })
      );
    } catch (e) {
      void e;
    }
    setSearchBusy(false);
  }

  function clearSearch() {
    if (input) input.value = "";
    if (input) input.focus();
    runQuery();
  }

  function scheduleQuery() {
    setSearchBusy(true);
    clearTimeout(debounceT);
    debounceT = setTimeout(runQuery, CONFIG.queryDebounceMs);
  }

  function focusFirstHitLink() {
    const a = document.querySelector("#results ol.hits a.title");
    if (a) a.focus();
  }

  if (input) {
    input.addEventListener("input", scheduleQuery);
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        focusFirstHitLink();
        return;
      }
      if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        historyPushOnEnter();
        clearTimeout(debounceT);
        setSearchBusy(true);
        runQuery();
      }
    });
  }
  if (clearBtn) {
    clearBtn.addEventListener("click", clearSearch);
  }

  if (resultsEl) {
    resultsEl.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const t = e.target;
      if (!t || t.tagName !== "A" || !t.classList.contains("title")) return;
      const li = t.closest("li.hit");
      if (!li) return;
      const list = li.parentElement;
      if (!list || list.tagName !== "OL") return;
      const items = list.querySelectorAll("li.hit a.title");
      const i = Array.prototype.indexOf.call(items, t);
      if (i === -1) return;
      if (e.key === "ArrowUp" && i === 0) {
        e.preventDefault();
        if (input) input.focus();
        return;
      }
      const next = e.key === "ArrowDown" ? items[i + 1] : items[i - 1];
      if (next) {
        e.preventDefault();
        next.focus();
      }
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const t = e.target;
      const tag = t && t.tagName;
      const editable =
        t &&
        (tag === "INPUT" ||
          tag === "TEXTAREA" ||
          t.isContentEditable === true);
      if (editable) return;
      e.preventDefault();
      if (input) input.focus();
    }
    if (e.key === "Escape" && input && String(input.value).trim()) {
      const t = e.target;
      const tag = t && t.tagName;
      const inEditable =
        t &&
        (tag === "INPUT" || tag === "TEXTAREA" || t.isContentEditable === true);
      if (inEditable && t !== input) return;
      if (document.activeElement === input) {
        if (input.value) {
          e.preventDefault();
          clearSearch();
        }
        return;
      }
      e.preventDefault();
      clearSearch();
    }
  });

  window.addEventListener("popstate", function () {
    if (!input || !workerReady) return;
    const p = new URLSearchParams(window.location.search).get("q");
    const fromUrl = p != null ? String(p) : "";
    const h = history.state;
    const fromState = h && h.p31q != null ? String(h.p31q) : null;
    const next = fromState != null ? fromState : fromUrl;
    skipUrl = true;
    input.value = next;
    clearTimeout(debounceT);
    runQuery();
  });

  function onLoadFailure(text) {
    if (mainEl) mainEl.setAttribute("aria-busy", "false");
    setSearchBusy(false);
    setFootHint(false);
    document.body.classList.add("lib-ready");
    setSpecStripDash();
    meta.innerHTML =
      '<span class="err">Search index could not be built. ' + esc(text) + "</span>";
  }

  function wireWorker() {
    if (typeof Worker === "undefined") {
      onLoadFailure("Web Worker not available in this context.");
      return;
    }
    try {
      worker = new Worker(CONFIG.worker);
    } catch (e) {
      onLoadFailure((e && e.message) || String(e));
      return;
    }
    worker.addEventListener("message", function (e) {
      const m = e.data;
      if (!m) return;
      if (m.type === "ready") {
        workerReady = true;
        if (mainEl) mainEl.setAttribute("aria-busy", "false");
        document.body.classList.add("lib-ready");
        showComfort();
        const params = new URLSearchParams(window.location.search);
        const q0 = params.get("q");
        if (q0 != null && String(q0) !== "" && input) {
          input.value = String(q0);
        }
        runQuery();
        return;
      }
      if (m.type === "loadError") {
        onLoadFailure(m.message || "load error");
        return;
      }
      if (m.type === "results" || m.type === "searchError") {
        onSearchResults(m);
      }
    });
    worker.addEventListener("error", function (e) {
      onLoadFailure((e && e.message) || "Worker script error");
    });
  }

  if (tryChips) {
    tryChips.addEventListener("click", function (e) {
      const btn = e.target && e.target.closest && e.target.closest("button.chip");
      if (!btn || !input) return;
      const t = btn.getAttribute("data-try");
      if (t == null) return;
      e.preventDefault();
      input.value = t;
      input.focus();
      clearTimeout(debounceT);
      setSearchBusy(true);
      if (window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
        btn.classList.add("chip-joy");
        const onEnd = function () {
          btn.classList.remove("chip-joy");
          btn.removeEventListener("animationend", onEnd);
        };
        btn.addEventListener("animationend", onEnd);
        setTimeout(function () {
          btn.removeEventListener("animationend", onEnd);
          btn.classList.remove("chip-joy");
        }, 600);
      }
      runQuery();
    });
  }

  function onIndexPathFailure() {
    if (mainEl) mainEl.setAttribute("aria-busy", "false");
    setSearchBusy(false);
    setFootHint(false);
    document.body.classList.add("lib-ready");
    setSpecStripDash();
  }

  document.addEventListener("DOMContentLoaded", async function () {
    wireWorker();
    if (!worker) return;
    showResultSkeleton();

    let res;
    try {
      res = await fetch("index.json", { cache: "no-store" });
    } catch (e) {
      onIndexPathFailure();
      if (resultsEl) {
        resultsEl.innerHTML =
          '<p class="empty" role="status">Could not load <code>index.json</code>. Use <code>npm run demo</code> from the repo root (not <code>file://</code>).</p>';
      }
      meta.innerHTML =
        '<span class="err">Could not fetch index.json.</span> Use <code>npm run demo</code> from the repo root, not file://. Run <code>npm run build:doc-index</code> if the file is missing.';
      return;
    }
    if (!res.ok) {
      onIndexPathFailure();
      if (resultsEl) {
        resultsEl.innerHTML =
          '<p class="empty" role="status">Missing <code>index.json</code> — run <code>npm run build:doc-index</code> from the repo root.</p>';
      }
      meta.innerHTML =
        'Missing <code>index.json</code> — run <code>npm run build:doc-index</code> from the repo root.';
      return;
    }
    const data = await res.json();
    if (data.schema !== CONFIG.schema) {
      onIndexPathFailure();
      if (resultsEl) {
        resultsEl.innerHTML =
          '<p class="empty" role="status">This page needs a current document index. Run <code>npm run build:doc-index</code>.</p>';
      }
      meta.textContent = "Invalid index.json schema.";
      return;
    }
    docs = data.documents || [];
    byId = new Map(docs.map((d) => [d.id, d]));
    total = data.count || 0;
    const when = (data.generatedAt || "").replace("T", " ");
    indexWhen = when.length >= 19 ? when.slice(0, 19) : when || "—";
    indexIso = typeof data.generatedAt === "string" ? data.generatedAt : "";
    updateSpecStrip();
    meta.textContent =
      "Preparing " +
      total +
      " document" +
      (total === 1 ? "" : "s") +
      " for search — " +
      indexWhen;

    worker.postMessage({ type: "load", documents: docs });
    try {
      window.dispatchEvent(
        new CustomEvent("p31-doclib-loaded", {
          detail: {
            docs: docs,
            byId: byId,
            constellation: data.constellation || {},
          },
        })
      );
    } catch (e) {
      void e;
    }

    const btnList = document.getElementById("btn-view-list");
    const btnCon = document.getElementById("btn-view-constellation");
    function setViewMode(list) {
      document.body.classList.toggle("doclib-mode-list", Boolean(list));
      if (btnList) {
        btnList.classList.toggle("is-active", Boolean(list));
        btnList.setAttribute("aria-pressed", list ? "true" : "false");
      }
      if (btnCon) {
        btnCon.classList.toggle("is-active", !list);
        btnCon.setAttribute("aria-pressed", list ? "false" : "true");
      }
      if (list && input && !String(input.value).trim()) {
        renderList(docs, "", null);
      }
      if (!list) {
        try {
          window.dispatchEvent(new CustomEvent("p31-doclib-search", { detail: { all: true } }));
        } catch (e2) {
          void e2;
        }
      }
    }
    if (btnList) {
      btnList.addEventListener("click", function () {
        setViewMode(true);
      });
    }
    if (btnCon) {
      btnCon.addEventListener("click", function () {
        setViewMode(false);
      });
    }
    if (/\bview=list\b/i.test(window.location.search || "")) {
      setViewMode(true);
    }
  });
})();

