/* theme-picker.js — minimal theme switcher.
   Sets document.documentElement.dataset.theme, persists to localStorage,
   syncs on load. Zero dependencies. Hidden in print. */

(function () {
  var THEMES = [
    { id: 'scene', label: 'Scene', swatch: '#2BB3D9' },
    { id: 'editorial', label: 'Editorial', swatch: '#1B365D' },
    { id: 'consulting', label: 'Consulting', swatch: '#3182CE' },
    { id: 'midnight', label: 'Midnight', swatch: '#4CC9F0' },
  ];

  function apply(theme) {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('p31-report-theme', theme); } catch (e) {}
    document.querySelectorAll('.theme-swatch').forEach(function (el) {
      el.setAttribute('aria-pressed', String(el.dataset.setTheme === theme));
    });
  }

  function init() {
    var saved = null;
    try { saved = localStorage.getItem('p31-report-theme'); } catch (e) {}
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    // Only apply a saved/presumed theme if none is already set on <html>.
    if (!document.documentElement.dataset.theme) {
      var theme = saved || (prefersDark ? 'midnight' : 'scene');
      document.documentElement.dataset.theme = theme;
    }

    var picker = document.createElement('div');
    picker.className = 'theme-picker';
    picker.setAttribute('role', 'group');
    picker.setAttribute('aria-label', 'Report theme');
    for (var i = 0; i < THEMES.length; i++) {
      var t = THEMES[i];
      var b = document.createElement('button');
      b.className = 'theme-swatch';
      b.type = 'button';
      b.dataset.setTheme = t.id;
      b.title = t.label;
      b.setAttribute('aria-label', t.label);
      b.style.background = t.swatch;
      b.addEventListener('click', (function (id) { return function () { apply(id); }; })(t.id));
      picker.appendChild(b);
    }
    document.body.appendChild(picker);
    apply(document.documentElement.dataset.theme);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();