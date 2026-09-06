/**
 * @file fouc-killer.js — Synchronous spoon/theme preloader.
 *
 * Runs BEFORE React hydration to prevent Flash of Unstyled Motion (FOUM)
 * for neurodivergent users. Reads localStorage and sets <html> attributes
 * synchronously so that CSS rules like [data-spoons="0"] are active
 * before the first paint.
 *
 * Usage: inject into <head> of index.html AS THE FIRST SCRIPT.
 *   <script src="/fouc-killer.js"></script>
 *
 * Do NOT bundle with Vite — it must execute before any module loading.
 */

(function () {
  var html = document.documentElement;

  // 1. Spoon level (0–5)
  try {
    var spoons = parseInt(localStorage.getItem('p31:spoons') || '3', 10);
    if (isNaN(spoons) || spoons < 0 || spoons > 5) spoons = 3;
    html.setAttribute('data-spoons', String(spoons));
  } catch (_) {
    html.setAttribute('data-spoons', '3');
  }

  // 2. Size class (compact / regular / medium / expanded)
  try {
    var w = window.innerWidth;
    var sc = 'regular';
    if (w <= 480) sc = 'compact';
    else if (w >= 768 && w <= 1023) sc = 'medium';
    else if (w >= 1024) sc = 'expanded';
    html.dataset.sizeClass = sc;
  } catch (_) {
    html.dataset.sizeClass = 'regular';
  }

  // 3. Input mode (touch / mouse / hybrid)
  try {
    var hasTouch = window.matchMedia('(pointer: coarse)').matches;
    var hasMouse = window.matchMedia('(pointer: fine)').matches;
    html.dataset.input = hasTouch && hasMouse ? 'hybrid' : hasTouch ? 'touch' : 'mouse';
  } catch (_) {
    html.dataset.input = 'mouse';
  }
})();
