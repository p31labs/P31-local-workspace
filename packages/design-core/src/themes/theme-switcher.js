/**
 * P31 Theme Switcher — magic-8-ball style UI shake
 * Drop this script into any page for instant theme switching.
 * Click the orb → random theme. Hold → cycle through.
 */

(function() {
  'use strict';

  const THEMES = {
    cipher: {
      label: 'Cipher', emoji: '🔮',
      tokens: {
        '--p31-bg': 'oklch(10% 0.01 240)',
        '--p31-surface': 'oklch(15% 0.015 240)',
        '--p31-accent': 'oklch(65% 0.18 195)',
        '--p31-accent-cyan': 'oklch(65% 0.18 195)',
        '--p31-accent-violet': 'oklch(65% 0.18 285)',
        '--p31-accent-gold': 'oklch(65% 0.18 15)',
        '--p31-accent-green': 'oklch(65% 0.18 105)',
        '--p31-accent-red': 'oklch(65% 0.18 30)',
        '--p31-text-primary': 'oklch(96% 0.005 240)',
        '--p31-text-secondary': 'oklch(75% 0.01 240)',
        '--p31-text-tertiary': 'oklch(55% 0.01 240)',
        '--p31-glass-bg': 'oklch(100% 0.01 240 / 0.04)',
        '--p31-glass-border': 'oklch(100% 0.01 240 / 0.08)',
      }
    },
    garden: {
      label: 'Garden', emoji: '🌿',
      tokens: {
        '--p31-bg': 'oklch(12% 0.02 140)',
        '--p31-surface': 'oklch(18% 0.025 140)',
        '--p31-accent': 'oklch(70% 0.15 145)',
        '--p31-accent-cyan': 'oklch(70% 0.15 145)',
        '--p31-accent-violet': 'oklch(70% 0.15 185)',
        '--p31-accent-gold': 'oklch(75% 0.15 85)',
        '--p31-accent-green': 'oklch(70% 0.15 145)',
        '--p31-accent-red': 'oklch(65% 0.15 30)',
        '--p31-text-primary': 'oklch(95% 0.02 120)',
        '--p31-text-secondary': 'oklch(78% 0.02 130)',
        '--p31-text-tertiary': 'oklch(55% 0.02 130)',
        '--p31-glass-bg': 'oklch(100% 0.01 120 / 0.06)',
        '--p31-glass-border': 'oklch(100% 0.01 120 / 0.1)',
      }
    },
    retro: {
      label: 'Retro', emoji: '🕹️',
      tokens: {
        '--p31-bg': 'oklch(8% 0.02 60)',
        '--p31-surface': 'oklch(12% 0.025 60)',
        '--p31-accent': 'oklch(75% 0.18 80)',
        '--p31-accent-cyan': 'oklch(75% 0.18 80)',
        '--p31-accent-violet': 'oklch(70% 0.18 330)',
        '--p31-accent-gold': 'oklch(78% 0.18 70)',
        '--p31-accent-green': 'oklch(65% 0.18 140)',
        '--p31-accent-red': 'oklch(70% 0.18 30)',
        '--p31-text-primary': 'oklch(92% 0.05 80)',
        '--p31-text-secondary': 'oklch(75% 0.04 70)',
        '--p31-text-tertiary': 'oklch(50% 0.03 70)',
        '--p31-glass-bg': 'oklch(100% 0.01 60 / 0.05)',
        '--p31-glass-border': 'oklch(100% 0.01 60 / 0.12)',
      }
    },
    ocean: {
      label: 'Ocean', emoji: '🌊',
      tokens: {
        '--p31-bg': 'oklch(10% 0.03 240)',
        '--p31-surface': 'oklch(15% 0.04 240)',
        '--p31-accent': 'oklch(70% 0.15 200)',
        '--p31-accent-cyan': 'oklch(70% 0.15 200)',
        '--p31-accent-violet': 'oklch(65% 0.15 250)',
        '--p31-accent-gold': 'oklch(72% 0.15 40)',
        '--p31-accent-green': 'oklch(70% 0.15 160)',
        '--p31-accent-red': 'oklch(70% 0.15 20)',
        '--p31-text-primary': 'oklch(95% 0.02 230)',
        '--p31-text-secondary': 'oklch(78% 0.02 235)',
        '--p31-text-tertiary': 'oklch(55% 0.02 235)',
        '--p31-glass-bg': 'oklch(100% 0.01 230 / 0.04)',
        '--p31-glass-border': 'oklch(100% 0.01 230 / 0.08)',
      }
    },
    sunset: {
      label: 'Sunset', emoji: '🌅',
      tokens: {
        '--p31-bg': 'oklch(12% 0.03 30)',
        '--p31-surface': 'oklch(17% 0.035 30)',
        '--p31-accent': 'oklch(72% 0.18 40)',
        '--p31-accent-cyan': 'oklch(72% 0.18 40)',
        '--p31-accent-violet': 'oklch(70% 0.18 360)',
        '--p31-accent-gold': 'oklch(75% 0.18 60)',
        '--p31-accent-green': 'oklch(65% 0.18 140)',
        '--p31-accent-red': 'oklch(72% 0.18 25)',
        '--p31-text-primary': 'oklch(95% 0.03 50)',
        '--p31-text-secondary': 'oklch(78% 0.03 40)',
        '--p31-text-tertiary': 'oklch(55% 0.03 35)',
        '--p31-glass-bg': 'oklch(100% 0.01 30 / 0.06)',
        '--p31-glass-border': 'oklch(100% 0.01 30 / 0.1)',
      }
    },
    mono: {
      label: 'Mono', emoji: '⚪',
      tokens: {
        '--p31-bg': 'oklch(8% 0 0)',
        '--p31-surface': 'oklch(14% 0 0)',
        '--p31-accent': 'oklch(80% 0 0)',
        '--p31-accent-cyan': 'oklch(75% 0 0)',
        '--p31-accent-violet': 'oklch(70% 0 0)',
        '--p31-accent-gold': 'oklch(78% 0 0)',
        '--p31-accent-green': 'oklch(72% 0 0)',
        '--p31-accent-red': 'oklch(68% 0 0)',
        '--p31-text-primary': 'oklch(95% 0 0)',
        '--p31-text-secondary': 'oklch(75% 0 0)',
        '--p31-text-tertiary': 'oklch(50% 0 0)',
        '--p31-glass-bg': 'oklch(100% 0 0 / 0.05)',
        '--p31-glass-border': 'oklch(100% 0 0 / 0.1)',
      }
    }
  };

  const THEME_IDS = Object.keys(THEMES);
  let currentTheme = localStorage.getItem('p31-theme') || 'cipher';

  function applyTheme(id) {
    var t = THEMES[id];
    if (!t) return;
    var root = document.documentElement;
    root.setAttribute('data-theme', id);
    for (var key in t.tokens) {
      if (t.tokens.hasOwnProperty(key)) {
        root.style.setProperty(key, t.tokens[key]);
      }
    }
    localStorage.setItem('p31-theme', id);
    currentTheme = id;
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('theme:changed', { detail: { theme: id, label: t.label, emoji: t.emoji } }));
  }

  function getRandomTheme() {
    var others = THEME_IDS.filter(function(t) { return t !== currentTheme; });
    return others[Math.floor(Math.random() * others.length)];
  }

  // Inject the theme orb
  function injectOrb() {
    var orb = document.createElement('div');
    orb.id = 'p31-theme-orb';
    orb.setAttribute('data-mcp-tool', 'themeOrb');
    orb.setAttribute('data-mcp-type', 'action');
    orb.setAttribute('data-mcp-target', 'theme-orb');
    orb.setAttribute('data-mcp-state', currentTheme);
    orb.setAttribute('title', 'Shake for a new look!');
    orb.innerHTML = '<span id="p31-theme-emoji">' + THEMES[currentTheme].emoji + '</span>';
    orb.style.cssText =
      'position:fixed;bottom:24px;right:24px;width:56px;height:56px;' +
      'border-radius:50%;border:2px solid var(--p31-glass-border,oklch(NaN NaN NaN));' +
      'background:var(--p31-glass-bg,oklch(NaN NaN NaN));' +
      'backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);' +
      'cursor:pointer;z-index:9999;display:flex;align-items:center;justify-content:center;' +
      'font-size:24px;transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);' +
      'box-shadow:0 4px 20px oklch(NaN NaN NaN);user-select:none;';

    // Orb animation states
    var animating = false;
    orb.addEventListener('click', function() {
      if (animating) return;
      animating = true;
      // Shake animation
      orb.style.transition = 'all 0.05s linear';
      var shakes = 6;
      var count = 0;
      function shake() {
        if (count >= shakes) {
          // Apply new theme
          var next = getRandomTheme();
          applyTheme(next);
          document.getElementById('p31-theme-emoji').textContent = THEMES[next].emoji;
          orb.dataset.mcpState = next;
          // Reset
          orb.style.transform = 'scale(1) rotate(0deg)';
          orb.style.transition = 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)';
          orb.style.transform = 'scale(1.1)';
          setTimeout(function() { orb.style.transform = 'scale(1)'; }, 200);
          animating = false;
          return;
        }
        var rot = (Math.random() - 0.5) * 30;
        var tx = (Math.random() - 0.5) * 8;
        var ty = (Math.random() - 0.5) * 8;
        orb.style.transform = 'translate(' + tx + 'px,' + ty + 'px) rotate(' + rot + 'deg)';
        count++;
        setTimeout(shake, 40);
      }
      shake();
    });

    // Hover tooltip
    var tooltip = document.createElement('div');
    tooltip.id = 'p31-theme-tooltip';
    tooltip.style.cssText =
      'position:fixed;bottom:84px;right:24px;' +
      'padding:8px 12px;border-radius:8px;' +
      'background:var(--p31-surface,oklch(NaN NaN NaN));' +
      'border:1px solid var(--p31-glass-border,oklch(NaN NaN NaN));' +
      'color:var(--p31-text-secondary);font-size:11px;' +
      'opacity:0;transition:opacity 0.2s ease;' +
      'pointer-events:none;z-index:9998;' +
      'white-space:nowrap;backdrop-filter:blur(8px);';
    tooltip.textContent = '🎲 Shake me — new look!';
    document.body.appendChild(tooltip);
    document.body.appendChild(orb);

    orb.addEventListener('mouseenter', function() { tooltip.style.opacity = '1'; });
    orb.addEventListener('mouseleave', function() { tooltip.style.opacity = '0'; });

    // Dismiss tooltip after first click
    orb.addEventListener('click', function() {
      tooltip.style.opacity = '0';
      setTimeout(function() {
        tooltip.textContent = '✨ ' + THEMES[currentTheme].label;
        setTimeout(function() { tooltip.textContent = '🎲 Shake me — new look!'; }, 2000);
      }, 500);
    }, { once: true });
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      // Apply saved theme
      var saved = localStorage.getItem('p31-theme');
      if (saved && THEMES[saved]) applyTheme(saved);
      injectOrb();
    });
  } else {
    var saved = localStorage.getItem('p31-theme');
    if (saved && THEMES[saved]) applyTheme(saved);
    injectOrb();
  }
})();
