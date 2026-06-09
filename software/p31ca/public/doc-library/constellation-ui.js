/**
 * Document library constellation — Gray Rock dots, Alive on hover/click.
 * Listens for CustomEvent p31-doclib-loaded + p31-doclib-search from app.js
 */
(function () {
  "use strict";

  const SVG_W = 1000;
  const SVG_H = 640;
  const perfLite = /\bperf=lite\b/i.test(window.location.search || "");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const staticMotion = perfLite || reducedMotion;

  let docs = [];
  let byId = new Map();
  let clusterLabels = {};
  let selectedId = null;
  let hoverId = null;
  let searchIds = null;

  function fileHref(relPath) {
    return "../../" + relPath.split("/").map(encodeURIComponent).join("/");
  }

  function esc(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function radiusFor(d) {
    const lines = d.lines || 80;
    return 2.2 + Math.min(6.5, Math.sqrt(lines / 90) * 3.2);
  }

  function applyNodeStyles() {
    const circles = document.querySelectorAll("circle.doc-node");
    for (const c of circles) {
      const id = c.getAttribute("data-id");
      let op = 0.18;
      if (searchIds) {
        op = searchIds.has(id) ? 0.92 : 0.06;
      } else if (!selectedId) {
        op = 0.2;
      } else if (selectedId !== id && hoverId !== id) {
        op = 0.09;
      }
      if (hoverId === id || selectedId === id) op = Math.max(op, 0.95);
      c.setAttribute("opacity", String(op));
      const fill =
        selectedId === id
          ? "rgba(77,184,168,0.62)"
          : hoverId === id
            ? "rgba(77,184,168,0.38)"
            : "rgba(216,214,208,0.24)";
      c.setAttribute("fill", fill);
    }
  }

  function clearEdges() {
    const g = document.getElementById("constellation-edges");
    if (g) g.innerHTML = "";
  }

  function drawEdges(centerId) {
    const g = document.getElementById("constellation-edges");
    if (!g) return;
    g.innerHTML = "";
    const d = byId.get(centerId);
    if (!d || !Array.isArray(d.references)) return;
    for (const rid of d.references) {
      const b = byId.get(rid);
      if (!b) continue;
      const ln = document.createElementNS("http://www.w3.org/2000/svg", "line");
      ln.setAttribute("x1", String(d.x * SVG_W));
      ln.setAttribute("y1", String(d.y * SVG_H));
      ln.setAttribute("x2", String(b.x * SVG_W));
      ln.setAttribute("y2", String(b.y * SVG_H));
      ln.setAttribute("stroke", "rgba(77,184,168,0.4)");
      ln.setAttribute("stroke-width", "1.1");
      g.appendChild(ln);
    }
  }

  function renderDetail(d) {
    const panel = document.getElementById("constellation-detail");
    if (!panel) return;
    if (!d) {
      panel.hidden = true;
      panel.innerHTML = "";
      return;
    }
    const href = fileHref(d.path);
    const conn =
      Array.isArray(d.references) && d.references.length
        ? "<p class=\"cd-conn\"><strong>Connected to:</strong> " +
          d.references
            .map((rid) => {
              const t = byId.get(rid);
              const lab = t ? esc(t.title) : esc(rid);
              return (
                "<button type=\"button\" class=\"cd-link p31-mesh-tap\" data-goto=\"" +
                esc(rid) +
                "\">" +
                lab +
                "</button>"
              );
            })
            .join(" · ") +
          "</p>"
        : "";
    panel.innerHTML =
      "<h2 class=\"cd-title display-font\">" +
      esc(d.title) +
      "</h2>" +
      "<p class=\"cd-path\">" +
      esc(d.path) +
      "</p>" +
      "<p class=\"cd-lead\">" +
      esc(d.previewLead || "") +
      "</p>" +
      "<p><a class=\"cd-read p31-mesh-tap\" href=\"" +
      esc(href) +
      "\">Read markdown →</a></p>" +
      conn +
      "<p><button type=\"button\" class=\"btn-inline-clear cd-close p31-mesh-tap\">Back to sky</button></p>";
    panel.hidden = false;
    const close = panel.querySelector(".cd-close");
    if (close) close.addEventListener("click", () => selectDoc(null));
    panel.querySelectorAll("[data-goto]").forEach((btn) => {
      btn.addEventListener("click", function () {
        const id = btn.getAttribute("data-goto");
        if (id) selectDoc(id);
      });
    });
  }

  function selectDoc(id) {
    selectedId = id;
    hoverId = null;
    clearEdges();
    if (id) drawEdges(id);
    applyNodeStyles();
    renderDetail(id ? byId.get(id) : null);
  }

  function onHover(id) {
    hoverId = id;
    if (id) drawEdges(id);
    else if (!selectedId) clearEdges();
    else drawEdges(selectedId);
    applyNodeStyles();
  }

  function clusterCentroids() {
    const g = {};
    for (const d of docs) {
      const k = d.cluster || "misc";
      if (!g[k]) g[k] = { sx: 0, sy: 0, n: 0 };
      g[k].sx += d.x;
      g[k].sy += d.y;
      g[k].n++;
    }
    return g;
  }

  function drawClusterLabels() {
    const gLab = document.getElementById("constellation-labels");
    if (!gLab) return;
    gLab.innerHTML = "";
    const cents = clusterCentroids();
    for (const k of Object.keys(cents)) {
      const { sx, sy, n } = cents[k];
      if (n < 2) continue;
      const cx = (sx / n) * SVG_W;
      const cy = (sy / n) * SVG_H - 18;
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", String(cx));
      text.setAttribute("y", String(cy));
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("class", "cluster-label");
      text.textContent = clusterLabels[k] || k;
      gLab.appendChild(text);
    }
  }

  function paintNodes() {
    const gNodes = document.getElementById("constellation-nodes");
    const wrap = document.getElementById("constellation-wrap");
    if (!gNodes || !wrap) return;
    if (!docs.length) {
      wrap.classList.add("constellation-wrap--empty");
      gNodes.innerHTML = "";
      const gl = document.getElementById("constellation-labels");
      if (gl) gl.innerHTML = "";
      return;
    }
    wrap.classList.remove("constellation-wrap--empty");
    gNodes.innerHTML = "";
    for (const d of docs) {
      const cx = d.x * SVG_W;
      const cy = d.y * SVG_H;
      const r = radiusFor(d);
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", String(cx));
      c.setAttribute("cy", String(cy));
      c.setAttribute("r", String(r));
      c.setAttribute("data-id", d.id);
      c.setAttribute("class", "doc-node");
      c.setAttribute("fill", "rgba(216,214,208,0.2)");
      c.setAttribute("stroke", "rgba(255,255,255,0.06)");
      c.setAttribute("stroke-width", "0.6");
      c.style.cursor = "pointer";
      if (!staticMotion) {
        c.style.transition = "opacity 0.35s ease, fill 0.28s ease";
      }
      const tt = document.createElementNS("http://www.w3.org/2000/svg", "title");
      tt.textContent = d.title;
      c.appendChild(tt);
      c.addEventListener("click", function (e) {
        e.stopPropagation();
        selectDoc(selectedId === d.id ? null : d.id);
      });
      c.addEventListener("mouseenter", function () {
        onHover(d.id);
      });
      c.addEventListener("mouseleave", function () {
        onHover(null);
      });
      gNodes.appendChild(c);
    }
    drawClusterLabels();
    applyNodeStyles();
  }

  const svgHost = document.getElementById("constellation-svg");
  if (svgHost) {
    svgHost.addEventListener("click", function (e) {
      const t = e.target;
      if (t === svgHost || (t && t.tagName === "rect" && t.parentNode === svgHost)) {
        selectDoc(null);
      }
    });
  }

  window.addEventListener("p31-doclib-loaded", function (ev) {
    const det = ev.detail || {};
    docs = det.docs || [];
    byId = det.byId instanceof Map ? det.byId : new Map();
    clusterLabels = (det.constellation && det.constellation.clusterLabels) || {};
    selectedId = null;
    hoverId = null;
    searchIds = null;
    clearEdges();
    paintNodes();
  });

  window.addEventListener("p31-doclib-search", function (ev) {
    const det = ev.detail || {};
    if (det.all) searchIds = null;
    else if (det.ids) searchIds = det.ids instanceof Set ? det.ids : new Set(det.ids);
    applyNodeStyles();
  });
})();
