/**
 * @p31ca/ui K4 Hero — vanilla SVG renderer.
 *
 * Usage (any framework):
 *   import { renderK4Hero } from '@p31ca/ui/k4-hero';
 *   import '@p31ca/ui/k4-hero.css';
 *   renderK4Hero(document.getElementById('k4-container'));
 *
 * Or inline:
 *   <div id="k4-container"></div>
 *   <script type="module">
 *     import { renderK4Hero } from '@p31ca/ui/k4-hero';
 *     import '@p31ca/ui/k4-hero.css';
 *     renderK4Hero(document.getElementById('k4-container'));
 *   </script>
 */

const K4_SVG = `
<svg class="k4-mesh" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="K4 tetrahedron">
  <defs>
    <filter id="k4-glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge><feMergeNode in="blur" /><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <filter id="k4-glow-violet" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feMerge><feMergeNode in="blur" /><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <filter id="k4-chromatic" x="-20%" y="-20%" width="140%" height="140%">
      <feOffset in="SourceGraphic" dx="1" dy="0" result="red" />
      <feOffset in="SourceGraphic" dx="-1" dy="0" result="blue" />
      <feMerge><feMergeNode in="red" /><feMergeNode in="SourceGraphic" /><feMergeNode in="blue" /></feMerge>
    </filter>
    <radialGradient id="k4-orbital-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#00f0ff" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="k4-superposition" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#b53cff" stop-opacity="0.9" />
      <stop offset="50%" stop-color="#00f0ff" stop-opacity="0.5" />
      <stop offset="100%" stop-color="#b53cff" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="k4-edge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#b53cff" />
      <stop offset="50%" stop-color="#00f0ff" />
      <stop offset="100%" stop-color="#ffd700" />
    </linearGradient>
  </defs>

  <!-- Orbital glow ellipses (3 rings) -->
  <ellipse cx="150" cy="150" rx="120" ry="80" fill="url(#k4-orbital-glow)" opacity="0.3" transform="rotate(30 150 150)">
    <animateTransform attributeName="transform" type="rotate" from="30 150 150" to="390 150 150" dur="12s" repeatCount="indefinite" />
  </ellipse>
  <ellipse cx="150" cy="150" rx="100" ry="70" fill="url(#k4-orbital-glow)" opacity="0.2" transform="rotate(-45 150 150)">
    <animateTransform attributeName="transform" type="rotate" from="-45 150 150" to="315 150 150" dur="18s" repeatCount="indefinite" />
  </ellipse>
  <ellipse cx="150" cy="150" rx="80" ry="60" fill="url(#k4-orbital-glow)" opacity="0.15" transform="rotate(90 150 150)">
    <animateTransform attributeName="transform" type="rotate" from="90 150 150" to="450 150 150" dur="24s" repeatCount="indefinite" />
  </ellipse>

  <!-- Tetrahedron edges (6 edges) -->
  <g stroke="url(#k4-edge-gradient)" stroke-width="2.5" fill="none" filter="url(#k4-glow-cyan)">
    <line x1="150" y1="30" x2="250" y2="210"><animate attributeName="stroke-dasharray" values="10 20; 20 10; 10 20" dur="3s" repeatCount="indefinite" /><animate attributeName="stroke-dashoffset" values="0; -30" dur="3s" repeatCount="indefinite" /></line>
    <line x1="250" y1="210" x2="50" y2="210"><animate attributeName="stroke-dasharray" values="8 24; 24 8; 8 24" dur="4s" repeatCount="indefinite" /><animate attributeName="stroke-dashoffset" values="0; -32" dur="4s" repeatCount="indefinite" /></line>
    <line x1="50" y1="210" x2="150" y2="30"><animate attributeName="stroke-dasharray" values="12 18; 18 12; 12 18" dur="3.5s" repeatCount="indefinite" /><animate attributeName="stroke-dashoffset" values="0; -30" dur="3.5s" repeatCount="indefinite" /></line>
    <line x1="150" y1="30" x2="150" y2="140"><animate attributeName="stroke-dasharray" values="6 30; 30 6; 6 30" dur="5s" repeatCount="indefinite" /><animate attributeName="stroke-dashoffset" values="0; -36" dur="5s" repeatCount="indefinite" /></line>
    <line x1="250" y1="210" x2="150" y2="140"><animate attributeName="stroke-dasharray" values="14 16; 16 14; 14 16" dur="2.8s" repeatCount="indefinite" /><animate attributeName="stroke-dashoffset" values="0; -30" dur="2.8s" repeatCount="indefinite" /></line>
    <line x1="50" y1="210" x2="150" y2="140"><animate attributeName="stroke-dasharray" values="10 22; 22 10; 10 22" dur="3.2s" repeatCount="indefinite" /><animate attributeName="stroke-dashoffset" values="0; -32" dur="3.2s" repeatCount="indefinite" /></line>
  </g>

  <!-- 3 outer nodes -->
  <circle cx="150" cy="30" r="14" fill="url(#k4-superposition)" filter="url(#k4-chromatic)"><animate attributeName="r" values="12; 16; 12" dur="2s" repeatCount="indefinite" /></circle>
  <circle cx="250" cy="210" r="14" fill="url(#k4-superposition)" filter="url(#k4-chromatic)"><animate attributeName="r" values="14; 18; 14" dur="2.5s" repeatCount="indefinite" /></circle>
  <circle cx="50" cy="210" r="14" fill="url(#k4-superposition)" filter="url(#k4-chromatic)"><animate attributeName="r" values="13; 17; 13" dur="2.2s" repeatCount="indefinite" /></circle>

  <!-- Central node -->
  <circle cx="150" cy="140" r="20" fill="url(#k4-superposition)" filter="url(#k4-glow-violet)"><animate attributeName="fill" values="#b53cff; #00f0ff; #b53cff" dur="1.5s" repeatCount="indefinite" /><animate attributeName="r" values="18; 24; 18" dur="1.5s" repeatCount="indefinite" /></circle>

  <!-- 3 particle dots -->
  <g fill="#ffffff" opacity="0.8">
    <circle cx="150" cy="15" r="2"><animate attributeName="cx" values="150; 250; 150" dur="6s" repeatCount="indefinite" /><animate attributeName="cy" values="30; 210; 30" dur="6s" repeatCount="indefinite" /></circle>
    <circle cx="250" cy="210" r="2"><animate attributeName="cx" values="250; 50; 250" dur="7s" repeatCount="indefinite" /><animate attributeName="cy" values="210; 210; 210" dur="7s" repeatCount="indefinite" /></circle>
    <circle cx="50" cy="210" r="2"><animate attributeName="cx" values="50; 150; 50" dur="5s" repeatCount="indefinite" /><animate attributeName="cy" values="210; 30; 210" dur="5s" repeatCount="indefinite" /></circle>
  </g>
</svg>`.trim();

/**
 * Render the K4 tetrahedron into a container element.
 * Creates a wrapper div with class "k4-hero" and inserts the SVG.
 * Returns the wrapper element.
 */
export function renderK4Hero(container: HTMLElement): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'k4-hero';
  wrapper.innerHTML = K4_SVG;
  container.appendChild(wrapper);
  return wrapper;
}

/**
 * Get the raw K4 SVG markup (for frameworks that prefer inline/dangerouslySetInnerHTML).
 */
export function getK4SvgMarkup(): string {
  return K4_SVG;
}

export default renderK4Hero;
