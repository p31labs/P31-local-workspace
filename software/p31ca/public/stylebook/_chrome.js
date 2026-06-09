/**
 * P31 Stylebook Chrome
 * Shared sidebar, search, layout for all stylebook pages
 */

const NAV_TREE = [
  {
    heading: 'Overview',
    items: [
      { href: '/stylebook/', label: 'Welcome', icon: '◇', id: 'home' },
      { href: '/stylebook/principles.html', label: 'Principles', icon: '◈', id: 'principles' },
      { href: '/stylebook/whats-new.html', label: "What's new", icon: '✦', id: 'whats-new', badge: 'new' }
    ]
  },
  {
    heading: 'Foundations',
    items: [
      { href: '/stylebook/color.html', label: 'Color', icon: '●', id: 'color' },
      { href: '/stylebook/typography.html', label: 'Typography', icon: 'A', id: 'typography' },
      { href: '/stylebook/space.html', label: 'Space', icon: '⫶', id: 'space' },
      { href: '/stylebook/motion.html', label: 'Motion', icon: '↝', id: 'motion' },
      { href: '/stylebook/elevation.html', label: 'Elevation', icon: '▤', id: 'elevation' },
      { href: '/stylebook/iconography.html', label: 'Iconography', icon: '◉', id: 'iconography' }
    ]
  },
  {
    heading: 'Components',
    items: [
      { href: '/stylebook/buttons.html', label: 'Buttons', icon: '⊟', id: 'buttons' },
      { href: '/stylebook/cards.html', label: 'Cards', icon: '◰', id: 'cards' },
      { href: '/stylebook/forms.html', label: 'Forms', icon: '⊞', id: 'forms' },
      { href: '/stylebook/navigation.html', label: 'Navigation', icon: '⊝', id: 'navigation' },
      { href: '/stylebook/feedback.html', label: 'Feedback', icon: '◐', id: 'feedback' },
      { href: '/stylebook/data-display.html', label: 'Data display', icon: '▦', id: 'data' }
    ]
  },
  {
    heading: 'Patterns',
    items: [
      { href: '/stylebook/hero.html', label: 'Hero sections', icon: '⌘', id: 'hero' },
      { href: '/stylebook/dashboards.html', label: 'Dashboards', icon: '◳', id: 'dashboards' },
      { href: '/stylebook/empty-states.html', label: 'Empty states', icon: '○', id: 'empty' },
      { href: '/stylebook/error-pages.html', label: 'Error pages', icon: '⊗', id: 'error-pages' }
    ]
  },
  {
    heading: 'Guidelines',
    items: [
      { href: '/stylebook/sitemap.html', label: 'Site map', icon: '⊞', id: 'sitemap', badge: 'new' },
      { href: '/stylebook/routing.html', label: 'Routing & IA', icon: '↹', id: 'routing', badge: 'new' },
      { href: '/stylebook/accessibility.html', label: 'Accessibility', icon: '◉', id: 'accessibility', badge: 'new' },
      { href: '/stylebook/metadata.html', label: 'SEO & metadata', icon: '⌗', id: 'metadata', badge: 'new' },
      { href: '/stylebook/performance.html', label: 'Performance', icon: '⏵', id: 'performance', badge: 'new' },
      { href: '/stylebook/voice.html', label: 'Voice & tone', icon: '"', id: 'voice', badge: 'new' },
      { href: '/stylebook/brand.html', label: 'Brand', icon: '◈', id: 'brand', badge: 'new' }
    ]
  },
  {
    heading: 'Theme',
    items: [
      { href: '/stylebook/playground.html', label: 'Playground', icon: '⏣', id: 'playground' },
      { href: '/stylebook/themes.html', label: 'Theme catalog', icon: '◑', id: 'themes' }
    ]
  },
  {
    heading: 'Operations',
    items: [
      { href: '/stylebook/nonprofit.html', label: 'Nonprofit scaffold', icon: '◫', id: 'nonprofit', badge: 'new' }
    ]
  },
  {
    heading: 'Resources',
    items: [
      { href: '/stylebook/tokens-reference.html', label: 'Token reference', icon: '⌗', id: 'tokens-ref' },
      { href: '/stylebook/support-matrix.html', label: 'Browser support', icon: '▦', id: 'support' },
      { href: '/stylebook/contributing.html', label: 'Contributing', icon: '⊕', id: 'contributing' },
      { href: '/stylebook/changelog.html', label: 'Changelog', icon: '⏲', id: 'changelog' },
      { href: '/', label: 'Back to hub', icon: '↩', id: 'hub' }
    ]
  }
];

export function renderShell({ activeId, breadcrumb, title, subtitle, meta, content }) {
  const root = document.body;
  
  root.innerHTML = `
    <div class="sb-layout">
      <aside class="sb-sidebar" id="sb-sidebar">
        <a href="/stylebook/" class="sb-topbar-brand" style="padding: 8px 12px; margin-bottom: 16px;">
          <div class="sb-topbar-brand-mark">P31</div>
          <div>
            <div style="font-size: 14px; font-weight: 600;">Stylebook</div>
            <div style="font-size: 11px; color: var(--p31-muted); font-family: var(--p31-font-mono);">v2.0</div>
          </div>
        </a>
        ${renderNav(activeId)}
      </aside>
      
      <header class="sb-topbar">
        <button class="sb-topbar-btn" id="sb-menu-toggle" style="display: none;" aria-label="Toggle menu">☰</button>
        
        <div class="sb-topbar-search">
          <span class="sb-topbar-search-icon">⌕</span>
          <input type="search" placeholder="Search components, tokens, patterns..." id="sb-search">
          <span class="sb-topbar-search-kbd">⌘K</span>
        </div>
        
        <div class="sb-topbar-actions">
          <button class="sb-topbar-btn" id="sb-theme-cycle" title="Cycle theme (T)">◐</button>
          <button class="sb-topbar-btn" id="sb-mode-cycle" title="Cycle mode (M)">⚙</button>
          <a href="https://github.com/p31labs" class="sb-topbar-btn" title="GitHub">⌥</a>
        </div>
      </header>
      
      <main class="sb-main">
        <div class="sb-content">
          ${breadcrumb ? renderBreadcrumb(breadcrumb) : ''}
          ${title ? `<header class="sb-page-header">
            <h1 class="sb-page-title">${title}</h1>
            ${subtitle ? `<p class="sb-page-subtitle">${subtitle}</p>` : ''}
            ${meta ? renderMeta(meta) : ''}
          </header>` : ''}
          ${content || ''}
          ${renderPageNav(activeId)}
        </div>
      </main>
    </div>
    
    <div class="sb-search-overlay" id="sb-search-overlay" style="display: none;"></div>
  `;
  
  attachListeners();
  highlightCode();
  attachCopyButtons();
}

function renderNav(activeId) {
  return NAV_TREE.map(section => `
    <div class="sb-nav-section">
      <div class="sb-nav-heading">${section.heading}</div>
      ${section.items.map(item => `
        <a href="${item.href}" class="sb-nav-link ${item.id === activeId ? 'active' : ''}">
          <span class="sb-nav-icon">${item.icon}</span>
          <span>${item.label}</span>
          ${item.badge ? `<span class="sb-nav-badge ${item.badge}">${item.badge}</span>` : ''}
        </a>
      `).join('')}
    </div>
  `).join('');
}

function renderBreadcrumb(crumbs) {
  return `
    <nav class="sb-breadcrumb" aria-label="Breadcrumb">
      ${crumbs.map((c, i) => `
        ${i > 0 ? '<span class="sb-sep">/</span>' : ''}
        ${c.href ? `<a href="${c.href}">${c.label}</a>` : `<span>${c.label}</span>`}
      `).join('')}
    </nav>
  `;
}

function renderMeta(meta) {
  return `
    <div class="sb-page-meta">
      ${meta.map(m => `
        <div class="sb-page-meta-item">
          <span>${m.label}</span>
          <strong>${m.value}</strong>
        </div>
      `).join('')}
    </div>
  `;
}

function renderPageNav(activeId) {
  const flat = [];
  NAV_TREE.forEach(s => s.items.forEach(i => flat.push(i)));
  const idx = flat.findIndex(i => i.id === activeId);
  if (idx === -1) return '';
  
  const prev = flat[idx - 1];
  const next = flat[idx + 1];
  
  if (!prev && !next) return '';
  
  return `
    <nav class="sb-page-nav" aria-label="Page navigation">
      ${prev ? `
        <a href="${prev.href}" class="sb-page-nav-link prev">
          <span class="sb-page-nav-label">← Previous</span>
          <span class="sb-page-nav-title">${prev.label}</span>
        </a>
      ` : '<div></div>'}
      ${next ? `
        <a href="${next.href}" class="sb-page-nav-link next">
          <span class="sb-page-nav-label">Next →</span>
          <span class="sb-page-nav-title">${next.label}</span>
        </a>
      ` : '<div></div>'}
    </nav>
  `;
}

function attachListeners() {
  // Menu toggle for mobile
  const menuBtn = document.getElementById('sb-menu-toggle');
  const sidebar = document.getElementById('sb-sidebar');
  if (menuBtn && sidebar) {
    if (window.innerWidth <= 900) {
      menuBtn.style.display = 'flex';
    }
    menuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
  }
  
  // Theme cycle
  const themeCycle = document.getElementById('sb-theme-cycle');
  if (themeCycle && window.p31Theme) {
    themeCycle.addEventListener('click', () => window.p31Theme.cycleTheme());
  }
  
  // Mode cycle
  const modeCycle = document.getElementById('sb-mode-cycle');
  if (modeCycle && window.p31Theme) {
    modeCycle.addEventListener('click', () => window.p31Theme.cycleMode());
  }
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('sb-search')?.focus();
    } else if (e.key === 't' && !e.metaKey && !e.ctrlKey) {
      window.p31Theme?.cycleTheme();
    } else if (e.key === 'm' && !e.metaKey && !e.ctrlKey) {
      window.p31Theme?.cycleMode();
    } else if (e.key === '/') {
      e.preventDefault();
      document.getElementById('sb-search')?.focus();
    }
  });
  
  // Search
  const search = document.getElementById('sb-search');
  if (search) {
    search.addEventListener('input', (e) => filterNav(e.target.value));
  }
}

function filterNav(query) {
  const q = query.toLowerCase().trim();
  document.querySelectorAll('.sb-nav-link').forEach(link => {
    const text = link.textContent.toLowerCase();
    link.style.display = !q || text.includes(q) ? '' : 'none';
  });
  document.querySelectorAll('.sb-nav-section').forEach(section => {
    const visibleLinks = section.querySelectorAll('.sb-nav-link:not([style*="none"])');
    section.style.display = visibleLinks.length > 0 ? '' : 'none';
  });
}

// Code highlighting (lightweight)
function highlightCode() {
  document.querySelectorAll('.sb-code-block code').forEach(code => {
    if (code.dataset.highlighted) return;
    code.dataset.highlighted = 'true';
    
    let html = code.innerHTML;
    
    // Already escaped, work with HTML
    const lang = code.parentElement.parentElement.dataset.lang || 'plain';
    
    if (lang === 'css' || lang === 'CSS') {
      html = html.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="tk-comment">$1</span>');
      html = html.replace(/(--[\w-]+)(?=\s*:)/g, '<span class="tk-prop">$1</span>');
      html = html.replace(/(:\s*)(#[\da-fA-F]+|\d+(?:\.\d+)?(?:px|rem|em|%|s|ms|deg)?)/g, '$1<span class="tk-number">$2</span>');
      html = html.replace(/(\bvar\b|\bcalc\b|\bclamp\b|\brgba?\b|\bhsla?\b)/g, '<span class="tk-func">$1</span>');
    } else if (lang === 'js' || lang === 'javascript' || lang === 'mjs') {
      html = html.replace(/(\/\/.*$)/gm, '<span class="tk-comment">$1</span>');
      html = html.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="tk-comment">$1</span>');
      html = html.replace(/\b(import|export|from|const|let|var|function|class|return|if|else|for|while|new|async|await)\b/g, '<span class="tk-keyword">$1</span>');
      html = html.replace(/(['"`])((?:\\.|(?!\1)[^\\])*?)\1/g, '<span class="tk-string">$1$2$1</span>');
    } else if (lang === 'html' || lang === 'HTML') {
      html = html.replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="tk-tag">$2</span>');
      html = html.replace(/([\w-]+)(=)(&quot;[^&]*&quot;)/g, '<span class="tk-attr">$1</span>$2<span class="tk-string">$3</span>');
    }
    
    code.innerHTML = html;
  });
}

function attachCopyButtons() {
  document.querySelectorAll('.sb-code-copy').forEach(btn => {
    btn.addEventListener('click', async () => {
      const block = btn.closest('.sb-code-block');
      const code = block.querySelector('code');
      const text = code.textContent;
      
      try {
        await navigator.clipboard.writeText(text);
        btn.classList.add('copied');
        const original = btn.innerHTML;
        btn.innerHTML = '✓ Copied';
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.innerHTML = original;
        }, 1500);
      } catch (err) {
        console.error('Copy failed:', err);
      }
    });
  });
}

// Helper functions for content authors
export function code(content, lang = 'plain', label = null) {
  const escaped = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `
    <div class="sb-code-block" data-lang="${lang}">
      <div class="sb-code-header">
        <span class="sb-code-lang">${label || lang}</span>
        <button class="sb-code-copy">⎘ Copy</button>
      </div>
      <pre><code>${escaped}</code></pre>
    </div>
  `;
}

export function preview(content, label = 'Preview') {
  return `
    <div class="sb-preview">
      <div class="sb-preview-header">
        <span>${label}</span>
      </div>
      <div class="sb-preview-body">
        ${content}
      </div>
    </div>
  `;
}

export function previewWithCode(html, lang = 'html', label = 'Example') {
  return `
    ${preview(html, label)}
    ${code(html, lang)}
  `;
}

export function callout(type, title, body) {
  const icons = { info: 'ℹ', warn: '⚠', success: '✓' };
  return `
    <div class="sb-callout sb-callout-${type}">
      <span class="sb-callout-icon">${icons[type] || 'ℹ'}</span>
      <div class="sb-callout-content">
        <strong>${title}</strong>
        <p>${body}</p>
      </div>
    </div>
  `;
}

export function section(content) {
  return `<section class="sb-section">${content}</section>`;
}

export { NAV_TREE };
