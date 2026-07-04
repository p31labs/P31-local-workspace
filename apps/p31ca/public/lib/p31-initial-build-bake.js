/**
 * CWP-32 D-IB5 + D-IB6 — client bake: PUT profile, PUT tetra, then p31.buildRecord/0.1.0 in localStorage.
 * Normative order: INITIAL-BUILD-SITE-STRICT-PLAN.md §6.2.
 */
(function () {
  "use strict";

  var LS_ID = "p31_subject_id";
  var LS_BUILD = "p31_build_record";
  var WELCOME_JSON = "/p31-welcome-packages.json";
  var CLIENT_VER = "ib-0.1.0";
  var BUILD_SCHEMA = "p31.buildRecord/0.1.0";

  function agentBase() {
    var q = new URLSearchParams(location.search).get("agent");
    if (q) return q.replace(/\/$/, "");
    return "https://k4-personal.trimtab-signal.workers.dev";
  }

  function shortId(s) {
    if (!s || s.length <= 18) return s || "—";
    return s.slice(0, 12) + "…" + s.slice(-8);
  }

  function mergeTetraWithPackage(baseTetra, pkg) {
    if (!pkg || !pkg.personalTetra || !pkg.personalTetra.docks) return baseTetra;
    var o = JSON.parse(JSON.stringify(baseTetra));
    ["structure", "connection", "rhythm", "creation"].forEach(function (k) {
      if (pkg.personalTetra.docks[k]) {
        o.docks[k] = Object.assign({}, o.docks[k] || {}, pkg.personalTetra.docks[k]);
      }
    });
    return o;
  }

  function archetypeForWelcomeKey(key) {
    if (key === "kid") return "child";
    if (key === "parent") return "default";
    return "default";
  }

  function roleForWelcomeKey(key) {
    var map = {
      kid: "family — child",
      parent: "family — parent / caregiver",
      adult: "mesh participant",
      neuro: "mesh participant",
      builder: "mesh participant — builder",
      default: "mesh participant",
    };
    return map[key] || map.default;
  }

  function stableStringify(tetra) {
    return JSON.stringify(tetra);
  }

  function hexPrefix(buf) {
    return [].concat(Array.from(new Uint8Array(buf)))
      .map(function (b) { return b.toString(16).padStart(2, "0"); })
      .join("");
  }

  async function tetraBuildHash(tetra, subjectId) {
    var body = stableStringify(tetra) + "|" + subjectId;
    var digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body));
    return hexPrefix(digest).slice(0, 12);
  }

  function showEl(id, on) {
    var el = document.getElementById(id);
    if (el) el.classList.toggle("hidden", !on);
  }

  function setText(id, t) {
    var el = document.getElementById(id);
    if (el) el.textContent = t;
  }

  function getSubjectId() {
    try {
      return localStorage.getItem(LS_ID);
    } catch (_) {
      return null;
    }
  }

  function readBuildRecord() {
    try {
      var raw = localStorage.getItem(LS_BUILD);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  function mountGateOrMain() {
    var sid = getSubjectId();
    var hasId = Boolean(sid);
    showEl("ib-gate", !hasId);
    showEl("ib-with-id", hasId);
    if (hasId) {
      setText("ib-subject-line", "Session: " + shortId(sid));
      var line = document.getElementById("ib-subject-line");
      if (line) line.setAttribute("title", sid);
      var full = document.getElementById("ib-subject-line-full");
      if (full) full.textContent = sid;
    }
  }

  function fillWelcomeSelect(packages) {
    var sel = document.getElementById("ib-welcome-key");
    if (!sel) return;
    var keys = Object.keys(packages || {}).filter(function (k) {
      return k !== "schema" && k !== "version" && k !== "packages";
    });
    if (!keys.length) return;
    var preferred = new URLSearchParams(location.search).get("welcome");
    sel.innerHTML = keys.map(function (k) {
      var p = packages[k];
      var label = (p && p.label) ? p.label : k;
      return '<option value="' + k + '">' + label + " (" + k + ")</option>";
    }).join("");
    if (preferred && keys.indexOf(preferred) >= 0) sel.value = preferred;
    else if (keys.indexOf("default") >= 0) sel.value = "default";
  }

  async function loadWelcomeJson() {
    var r = await fetch(WELCOME_JSON, { cache: "no-cache" });
    if (!r.ok) throw new Error("Could not load " + WELCOME_JSON);
    return r.json();
  }

  function renderReentry(br) {
    var panel = document.getElementById("ib-reentry");
    if (!panel) return;
    if (!br || !br.bakedAt) {
      showEl("ib-reentry", false);
      return;
    }
    setText("ib-reentry-line", "Last bake: " + (br.bakedAt || "—") + " · welcome: " + (br.welcomeKey || "—"));
    showEl("ib-reentry", true);
  }

  async function runBake() {
    var BASE = agentBase();
    var subjectId = getSubjectId();
    var errEl = document.getElementById("ib-err");
    var btn = document.getElementById("ib-bake");
    var nameInput = document.getElementById("ib-display-name");
    var sel = document.getElementById("ib-welcome-key");

    if (errEl) {
      errEl.classList.add("hidden");
      errEl.textContent = "";
    }
    if (!subjectId) {
      if (errEl) {
        errEl.textContent = "No subject_id — use onboard or create a guest id.";
        errEl.classList.remove("hidden");
      }
      return;
    }
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Baking…";
    }

    var welcomeKey = (sel && sel.value) || "default";
    var displayName = (nameInput && (nameInput.value || "").trim()) || "Mesh member";

    try {
      var welcomeRoot = await loadWelcomeJson();
      var packages = (welcomeRoot && welcomeRoot.packages) || {};
      var pkg = packages[welcomeKey] || packages.default;
      if (!pkg) throw new Error("Invalid welcome package: " + welcomeKey);

      var baseTetra = await fetch(BASE + "/agent/" + encodeURIComponent(subjectId) + "/tetra", {
        cache: "no-cache",
      }).then(function (r) {
        if (!r.ok) throw new Error("GET /tetra " + r.status);
        return r.json();
      });

      var merged = mergeTetraWithPackage(baseTetra, pkg);

      var profile = {
        name: displayName,
        role: roleForWelcomeKey(welcomeKey),
        archetype: archetypeForWelcomeKey(welcomeKey),
        edeContext: "Initial Build — p31ca /build",
        welcomeKey: welcomeKey,
        welcomeLabel: (pkg && pkg.label) || null,
        welcomePackagesVersion: (welcomeRoot && welcomeRoot.version) || null,
      };

      var stRes = await fetch(BASE + "/agent/" + encodeURIComponent(subjectId) + "/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: profile }),
      });
      if (!stRes.ok) {
        var stErr = await stRes.text();
        throw new Error("PUT /state " + stRes.status + (stErr ? " — " + stErr : ""));
      }

      var tRes = await fetch(BASE + "/agent/" + encodeURIComponent(subjectId) + "/tetra", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(merged),
      });
      if (!tRes.ok) {
        var tErr = await tRes.text();
        throw new Error("PUT /tetra " + tRes.status + (tErr ? " — " + tErr : ""));
      }

      var th = await tetraBuildHash(merged, subjectId);
      var record = {
        schema: BUILD_SCHEMA,
        bakedAt: new Date().toISOString(),
        subjectIdPrefix: String(subjectId).slice(0, 8),
        welcomeKey: welcomeKey,
        tetraBuildHash: th,
        clientBuildVersion: CLIENT_VER,
      };
      try {
        localStorage.setItem(LS_BUILD, JSON.stringify(record));
      } catch (e) {
        console.warn("[P31 initial build] localStorage:", e);
      }

      setText("ib-success", "Baked. Your personal tetra is on the edge — continue to the mesh home.");
      showEl("ib-success-wrap", true);
      renderReentry(readBuildRecord());
    } catch (e) {
      if (errEl) {
        errEl.textContent = (e && e.message) ? e.message : String(e);
        errEl.classList.remove("hidden");
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Bake to my agent";
      }
    }
  }

  function guestId() {
    var ge = document.getElementById("ib-gate-err");
    if (ge) {
      ge.textContent = "";
      ge.classList.add("hidden");
    }
    if (typeof p31DeriveSubjectId !== "function") {
      if (ge) {
        ge.textContent = "Missing p31-subject-id.js";
        ge.classList.remove("hidden");
      }
      return;
    }
    p31DeriveSubjectId(null).then(function (id) {
      try {
        localStorage.setItem(LS_ID, id);
      } catch (e) {
        if (ge) {
          ge.textContent = "localStorage: " + (e && e.message);
          ge.classList.remove("hidden");
        }
        return;
      }
      location.reload();
    });
  }

  function init() {
    mountGateOrMain();
    var br = readBuildRecord();
    renderReentry(br);

    loadWelcomeJson()
      .then(function (data) {
        var pk = (data && data.packages) || {};
        fillWelcomeSelect(pk);
      })
      .catch(function (e) {
        var el = document.getElementById("ib-err");
        if (el) {
          el.textContent = (e && e.message) || String(e);
          el.classList.remove("hidden");
        }
      });

    var g = document.getElementById("ib-guest");
    if (g) g.addEventListener("click", guestId);

    var b = document.getElementById("ib-bake");
    if (b) b.addEventListener("click", function () { void runBake(); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
