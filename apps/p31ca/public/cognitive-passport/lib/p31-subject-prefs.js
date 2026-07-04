/**
 * p31-subject-prefs.js — Reads user preferences from localStorage
 * and sets data attributes on <html> for CSS consumption.
 *
 * Preferences source (priority order):
 * 1. localStorage key 'p31_subject_prefs' (JSON)
 * 2. Cognitive Passport JSON if loaded via mesh-start (future: merge from profile)
 * 3. Defaults (Gray Rock: standard contrast, comfortable density, reduced motion)
 *
 * Schema: p31.subjectPrefs/0.1.0
 *
 * CSS reads: data-p31-contrast, data-p31-density, data-p31-motion, data-p31-temp
 * These are consumed by p31-style.css doctrine section.
 */
(function () {
  "use strict";
  var root = document.documentElement;
  var KEY = "p31_subject_prefs";

  var defaults = {
    contrast: "standard",
    density: "comfortable",
    motion: "reduced",
    temp: "neutral",
  };

  function readStored() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      /* no-op */
    }
    return null;
  }

  function normalize(prefs) {
    if (!prefs || typeof prefs !== "object") prefs = {};
    return {
      contrast: prefs.contrast || defaults.contrast,
      density: prefs.density || defaults.density,
      motion: prefs.motion || defaults.motion,
      temp: prefs.temp || defaults.temp,
    };
  }

  function applyToDom(p) {
    function setOrRemove(attr, value, defaultVal) {
      if (value === defaultVal) root.removeAttribute(attr);
      else root.setAttribute(attr, value);
    }
    setOrRemove("data-p31-contrast", p.contrast, defaults.contrast);
    setOrRemove("data-p31-density", p.density, defaults.density);
    setOrRemove("data-p31-motion", p.motion, defaults.motion);
    setOrRemove("data-p31-temp", p.temp, defaults.temp);
  }

  var prefs = normalize(readStored());
  applyToDom(prefs);

  window.p31SubjectPrefs = {
    get: function () {
      return normalize(readStored());
    },
    set: function (partial) {
      if (!partial || typeof partial !== "object") return;
      var current = normalize(readStored());
      var next = {
        contrast: partial.contrast !== undefined ? partial.contrast : current.contrast,
        density: partial.density !== undefined ? partial.density : current.density,
        motion: partial.motion !== undefined ? partial.motion : current.motion,
        temp: partial.temp !== undefined ? partial.temp : current.temp,
      };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch (e) {
        /* no-op */
      }
      applyToDom(normalize(next));
    },
  };
})();
