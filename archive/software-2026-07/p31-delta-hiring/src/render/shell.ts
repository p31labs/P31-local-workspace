import { escapeHtml } from '../lib/escape';

const NAV = [
  { id: 'home', href: '#/', label: 'Home' },
  { id: 'roles', href: '#/roles', label: 'Roles' },
  { id: 'wcd', href: '#/wcd', label: 'wcds' },
  { id: 'help', href: '#/help', label: 'Help' },
  { id: 'glossary', href: '#/glossary', label: 'Glossary' },
  { id: 'portfolio', href: '#/portfolio', label: 'My proofs' }
] as const;

const SECONDARY: { id: string; href: string; label: string }[] = [
  { id: 'search', href: '#/search', label: 'Search' },
  { id: 'reviewers', href: '#/reviewers', label: 'For reviewers' },
  { id: 'changelog', href: '#/changelog', label: 'Changelog' },
  { id: 'governance', href: '#/governance', label: 'Governance' }
];

function navItem(active: string, id: string, href: string, label: string): string {
  const current =
    active === id ||
    (id === 'help' && active.startsWith('help')) ||
    (id === 'glossary' && active.startsWith('glossary')) ||
    (id === 'wcd' && active.startsWith('wcd'));
  const cls = current ? ' is-active' : '';
  const ac = current ? ' aria-current="page"' : '';
  return `<a class="${cls}" href="${href}"${ac}>${escapeHtml(label)}</a>`;
}

export function renderShell(activeNav: string, mainHtml: string): string {
  const primary = NAV.map((n) => navItem(activeNav, n.id, n.href, n.label)).join('');
  const sec = SECONDARY.map((n) => navItem(activeNav, n.id, n.href, n.label)).join('');
  return `
  <a class="skip-link" href="#main">Skip to main content</a>
  <div id="sr-announce" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>
  <header class="app-header" role="banner">
    <a href="#/" class="brand" style="text-decoration:none;color:inherit" aria-label="P31 Delta hiring home">
      <div class="brand-mark" aria-hidden="true">Δ</div>
      <div>
        <h1>P31 Delta · Hiring</h1>
        <p>Role packets · wcds · Proofs</p>
      </div>
    </a>
    <nav class="nav-primary" aria-label="Primary">${primary}</nav>
    <nav class="nav-secondary" aria-label="Resources">${sec}</nav>
  </header>
  <main class="layout" id="main" tabindex="-1" role="main">
    ${mainHtml}
  </main>
  <footer class="site" role="contentinfo">Proof drafts stay in this browser until you export JSON. <span class="muted">P31 delta-hiring v1.0.0</span> · <a href="#/governance">Privacy &amp; labor notes</a></footer>
  `;
}

export function activeFromRoute(name: string): string {
  if (name === 'help-list' || name === 'help') return 'help';
  if (name === 'glossary-list' || name === 'glossary') return 'glossary';
  if (name === 'wcd-list' || name === 'wcd') return 'wcd';
  if (name === 'proof' || name === 'proof-new' || name === 'proof-edit') return 'portfolio';
  if (name === 'search') return 'search';
  if (name === 'changelog' || name === 'reviewers' || name === 'governance') return name;
  return name;
}
