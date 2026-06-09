/**
 * P31 document library — MiniSearch in a Web Worker.
 *
 * Wire protocol (structured clone):
 *   IN  `{ type: "load", documents: IndexDocument[] }` → build index, `ready` | `loadError`
 *   IN  `{ type: "search", q: string, reqId?: number }`  → `results` | `searchError`
 *   OUT `{ type: "ready" }`
 *   OUT `{ type: "loadError", message: string }`
 *   OUT `{ type: "results", q, reqId, hits: { id, terms, score, match }[] }` (capped 100)
 *   OUT `{ type: "searchError", reqId, message }`
 *
 * UMD: `global MiniSearch` (minisearch@6.3.0). Field boosts live here only.
 */
/* global self, MiniSearch */
importScripts("vendor/minisearch-6.3.0.umd.min.js");

const MS = self.MiniSearch;
let mini = null;

self.onmessage = function (e) {
  const msg = e && e.data;
  if (msg && msg.type === "load" && Array.isArray(msg.documents)) {
    try {
      mini = new MS({
        idField: "id",
        fields: ["title", "text", "h2text", "path", "cluster", "tagsText"],
        storeFields: ["title", "path", "preview", "previewLead", "h2", "cluster", "tagsText", "lines", "x", "y", "daysSinceCommit", "references"],
      });
      mini.addAll(msg.documents);
      self.postMessage({ type: "ready" });
    } catch (err) {
      self.postMessage({
        type: "loadError",
        message: err && err.message ? err.message : String(err),
      });
    }
    return;
  }
  if (msg && msg.type === "search" && typeof msg.q === "string") {
    if (!mini) {
      self.postMessage({
        type: "searchError",
        reqId: msg.reqId,
        message: "Index not ready",
      });
      return;
    }
    try {
      const raw = mini.search(msg.q, {
        prefix: true,
        fuzzy: 0.2,
        boost: { title: 2.2, h2text: 1.4, path: 1.2, text: 1 },
      });
      const n = Math.min(100, raw.length);
      const hits = new Array(n);
      for (let i = 0; i < n; i++) {
        const h = raw[i];
        const t = h.terms;
        const terms = t && typeof t.forEach === "function" ? Array.from(t) : [];
        hits[i] = { id: h.id, terms, score: h.score, match: h.match };
      }
      self.postMessage({
        type: "results",
        reqId: msg.reqId,
        q: msg.q,
        hits: hits,
      });
    } catch (err) {
      self.postMessage({
        type: "searchError",
        reqId: msg.reqId,
        message: err && err.message ? err.message : String(err),
      });
    }
  }
};
