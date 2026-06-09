/**
 * P31 Theme Switcher Component
 * Floating widget for theme/mode selection
 * Auto-initializes when imported
 */

import { P31ThemeController, P31_THEMES, P31_MODES } from './p31-theme-engine.mjs';

export class P31ThemeSwitcher {
  constructor(options = {}) {
    this.position = options.position || 'bottom-right'; // bottom-right, bottom-left, top-right, top-left
    this.themeController = options.themeController || window.p31Theme;
    this.widget = null;
    this.panel = null;
    this.isOpen = false;
    
    if (typeof document !== 'undefined') {
      this.init();
    }
  }

  init() {
    this.createWidget();
    this.setupEventListeners();
    this.updateActiveStates();
  }

  createWidget() {
    // Create container
    this.widget = document.createElement('div');
    this.widget.className = 'p31-theme-widget';
    this.widget.setAttribute('role', 'button');
    this.widget.setAttribute('aria-label', 'Open theme settings');
    this.widget.setAttribute('tabindex', '0');
    
    // Position
    const [vertical, horizontal] = this.position.split('-');
    this.widget.style.position = 'fixed';
    this.widget.style[vertical] = '24px';
    this.widget.style[horizontal] = '24px';
    this.widget.style.zIndex = '9999';
    
    // Create trigger button
    const trigger = document.createElement('button');
    trigger.className = 'p31-theme-trigger';
    trigger.innerHTML = this.getThemeIcon();
    trigger.style.cssText = `
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--p31-surface2, #1c2028);
      border: 1px solid var(--p31-border-subtle, rgba(255,255,255,0.06));
      color: var(--p31-cloud, #d8d6d0);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      position: relative;
      overflow: hidden;
    `;
    
    // Add shimmer effect
    const shimmer = document.createElement('div');
    shimmer.style.cssText = `
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
      transform: translateX(-100%);
      transition: transform 0.6s;
    `;
    trigger.appendChild(shimmer);
    
    trigger.addEventListener('mouseenter', () => {
      shimmer.style.transform = 'translateX(100%)';
      trigger.style.transform = 'scale(1.1)';
      trigger.style.boxShadow = '0 15px 50px rgba(0,0,0,0.4)';
    });
    
    trigger.addEventListener('mouseleave', () => {
      shimmer.style.transform = 'translateX(-100%)';
      trigger.style.transform = 'scale(1)';
    });
    
    this.trigger = trigger;
    this.widget.appendChild(trigger);
    
    // Create panel
    this.panel = document.createElement('div');
    this.panel.className = 'p31-theme-panel';
    this.panel.style.cssText = `
      position: absolute;
      ${vertical === 'bottom' ? 'bottom' : 'top'}: calc(100% + 16px);
      ${horizontal === 'right' ? 'right' : 'left'}: 0;
      width: 320px;
      max-height: 70vh;
      overflow-y: auto;
      background: var(--p31-surface, #161920);
      border: 1px solid var(--p31-border-subtle, rgba(255,255,255,0.06));
      border-radius: 20px;
      padding: 20px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.5);
      opacity: 0;
      visibility: hidden;
      transform: translateY(10px) scale(0.95);
      transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
      scrollbar-width: thin;
      scrollbar-color: var(--p31-surface3) transparent;
    `;
    
    this.renderPanel();
    this.widget.appendChild(this.panel);
    
    document.body.appendChild(this.widget);
  }

  getThemeIcon() {
    const theme = this.themeController?.state?.theme || 'hub';
    const icons = {
      hub: '⬡',
      org: '☀️',
      midnight: '🌙',
      genesis: '🔥',
      paper: '📄',
      matrix: '💻'
    };
    return icons[theme] || '🎨';
  }

  renderPanel() {
    const panel = this.panel;
    panel.innerHTML = '';
    
    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--p31-border-subtle);
    `;
    
    const title = document.createElement('h3');
    title.textContent = 'Theme';
    title.style.cssText = `
      font-family: var(--p31-font-sans);
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--p31-paper);
      margin: 0;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: var(--p31-muted);
      cursor: pointer;
      font-size: 1.25rem;
      padding: 4px;
      line-height: 1;
      transition: color 0.2s;
    `;
    closeBtn.addEventListener('click', () => this.close());
    closeBtn.addEventListener('mouseenter', () => closeBtn.style.color = 'var(--p31-cloud)');
    closeBtn.addEventListener('mouseleave', () => closeBtn.style.color = 'var(--p31-muted)');
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    panel.appendChild(header);
    
    // Current theme info
    const currentTheme = this.themeController?.getEffectiveTheme();
    if (currentTheme) {
      const current = document.createElement('div');
      current.style.cssText = `
        padding: 12px;
        background: var(--p31-surface2);
        border-radius: 12px;
        margin-bottom: 16px;
      `;
      current.innerHTML = `
        <div style="font-size: 0.875rem; color: var(--p31-muted); margin-bottom: 4px;">Active</div>
        <div style="font-size: 1rem; font-weight: 500; color: var(--p31-paper);">${currentTheme.label}</div>
        <div style="font-size: 0.75rem; color: var(--p31-muted); margin-top: 4px;">${currentTheme.description}</div>
      `;
      panel.appendChild(current);
    }
    
    // Theme grid
    const themeLabel = document.createElement('div');
    themeLabel.textContent = 'Select Theme';
    themeLabel.style.cssText = `
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--p31-muted);
      margin-bottom: 12px;
    `;
    panel.appendChild(themeLabel);
    
    const themeGrid = document.createElement('div');
    themeGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 20px;
    `;
    
    Object.values(P31_THEMES).forEach(theme => {
      const btn = document.createElement('button');
      btn.className = 'p31-theme-option';
      btn.setAttribute('data-theme', theme.id);
      
      // Create mini preview
      const isActive = this.themeController?.state?.theme === theme.id;
      btn.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 12px 8px;
        border-radius: 12px;
        border: 2px solid ${isActive ? 'var(--p31-primary)' : 'transparent'};
        background: ${isActive ? 'var(--p31-surface3)' : 'var(--p31-surface2)'};
        cursor: pointer;
        transition: all 0.2s;
      `;
      
      const preview = document.createElement('div');
      preview.style.cssText = `
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: linear-gradient(135deg, ${theme.colors.void} 50%, ${theme.colors.primary || theme.colors.teal} 50%);
        border: 1px solid var(--p31-border-subtle);
        position: relative;
      `;
      
      if (isActive) {
        const check = document.createElement('div');
        check.innerHTML = '✓';
        check.style.cssText = `
          position: absolute;
          bottom: -4px;
          right: -4px;
          width: 18px;
          height: 18px;
          background: var(--p31-primary);
          color: var(--p31-void);
          border-radius: 50%;
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        `;
        preview.appendChild(check);
      }
      
      const label = document.createElement('span');
      label.textContent = theme.label;
      label.style.cssText = `
        font-size: 0.75rem;
        color: ${isActive ? 'var(--p31-paper)' : 'var(--p31-cloud)'};
        font-weight: ${isActive ? '500' : '400'};
      `;
      
      btn.appendChild(preview);
      btn.appendChild(label);
      
      btn.addEventListener('click', () => {
        this.themeController?.setTheme(theme.id);
        this.trigger.innerHTML = this.getThemeIcon();
        this.renderPanel();
      });
      
      btn.addEventListener('mouseenter', () => {
        if (!isActive) {
          btn.style.background = 'var(--p31-surface3)';
          btn.style.transform = 'translateY(-2px)';
        }
      });
      
      btn.addEventListener('mouseleave', () => {
        if (!isActive) {
          btn.style.background = 'var(--p31-surface2)';
          btn.style.transform = 'translateY(0)';
        }
      });
      
      themeGrid.appendChild(btn);
    });
    
    panel.appendChild(themeGrid);
    
    // Mode selector
    const modeLabel = document.createElement('div');
    modeLabel.textContent = 'Mode';
    modeLabel.style.cssText = `
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--p31-muted);
      margin-bottom: 12px;
    `;
    panel.appendChild(modeLabel);
    
    const modeRow = document.createElement('div');
    modeRow.style.cssText = `
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
    `;
    
    Object.entries(P31_MODES).forEach(([modeId, mode]) => {
      const isActive = this.themeController?.state?.mode === modeId;
      const btn = document.createElement('button');
      btn.textContent = modeId.charAt(0).toUpperCase() + modeId.slice(1);
      btn.style.cssText = `
        flex: 1;
        padding: 8px 12px;
        border-radius: 8px;
        border: 1px solid ${isActive ? 'var(--p31-primary)' : 'var(--p31-border-subtle)'};
        background: ${isActive ? 'var(--p31-primary)' : 'transparent'};
        color: ${isActive ? 'var(--p31-void)' : 'var(--p31-cloud)'};
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
      `;
      
      btn.addEventListener('click', () => {
        this.themeController?.setMode(modeId);
        this.renderPanel();
      });
      
      modeRow.appendChild(btn);
    });
    
    panel.appendChild(modeRow);
    
    // Appearance selector
    const appearLabel = document.createElement('div');
    appearLabel.textContent = 'Appearance';
    appearLabel.style.cssText = `
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--p31-muted);
      margin-bottom: 12px;
    `;
    panel.appendChild(appearLabel);
    
    const appearRow = document.createElement('div');
    appearRow.style.cssText = `
      display: flex;
      gap: 8px;
      background: var(--p31-surface2);
      padding: 4px;
      border-radius: 10px;
    `;
    
    const appearances = [
      { id: 'auto', icon: '◐', label: 'Auto' },
      { id: 'light', icon: '☀️', label: 'Light' },
      { id: 'dark', icon: '🌙', label: 'Dark' }
    ];
    
    appearances.forEach(app => {
      const isActive = this.themeController?.state?.appearance === app.id;
      const btn = document.createElement('button');
      btn.innerHTML = `${app.icon} ${app.label}`;
      btn.style.cssText = `
        flex: 1;
        padding: 8px;
        border-radius: 8px;
        border: none;
        background: ${isActive ? 'var(--p31-surface3)' : 'transparent'};
        color: ${isActive ? 'var(--p31-paper)' : 'var(--p31-cloud)'};
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      `;
      
      btn.addEventListener('click', () => {
        this.themeController?.setAppearance(app.id);
        this.renderPanel();
      });
      
      appearRow.appendChild(btn);
    });
    
    panel.appendChild(appearRow);
    
    // Keyboard shortcut hint
    const hint = document.createElement('div');
    hint.innerHTML = 'Press <kbd style="padding: 2px 6px; background: var(--p31-surface3); border-radius: 4px; font-family: var(--p31-font-mono); font-size: 0.75rem;">T</kbd> to toggle themes';
    hint.style.cssText = `
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid var(--p31-border-subtle);
      font-size: 0.75rem;
      color: var(--p31-muted);
      text-align: center;
    `;
    panel.appendChild(hint);
  }

  setupEventListeners() {
    // Toggle on trigger click
    this.trigger.addEventListener('click', () => this.toggle());
    
    // Keyboard toggle
    document.addEventListener('keydown', (e) => {
      if (e.key === 't' || e.key === 'T') {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          this.themeController?.cycleTheme();
          this.trigger.innerHTML = this.getThemeIcon();
          this.updateActiveStates();
        }
      }
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
    
    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.widget.contains(e.target)) {
        this.close();
      }
    });
    
    // Update on theme change
    this.themeController?.onChange(() => {
      this.trigger.innerHTML = this.getThemeIcon();
      this.updateActiveStates();
    });
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isOpen = true;
    this.widget.classList.add('open');
    this.panel.style.opacity = '1';
    this.panel.style.visibility = 'visible';
    this.panel.style.transform = 'translateY(0) scale(1)';
    this.renderPanel();
  }

  close() {
    this.isOpen = false;
    this.widget.classList.remove('open');
    this.panel.style.opacity = '0';
    this.panel.style.visibility = 'hidden';
    this.panel.style.transform = 'translateY(10px) scale(0.95)';
  }

  updateActiveStates() {
    // Update trigger icon
    this.trigger.innerHTML = this.getThemeIcon();
    
    // Re-render panel if open
    if (this.isOpen) {
      this.renderPanel();
    }
  }

  destroy() {
    if (this.widget && this.widget.parentNode) {
      this.widget.parentNode.removeChild(this.widget);
    }
  }
}

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
  // Wait for DOM and theme controller
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSwitcher);
  } else {
    initSwitcher();
  }
  
  function initSwitcher() {
    // Small delay to ensure theme controller is ready
    setTimeout(() => {
      if (window.p31Theme && !window.p31ThemeSwitcher) {
        window.p31ThemeSwitcher = new P31ThemeSwitcher({
          themeController: window.p31Theme
        });
      }
    }, 100);
  }
}

export default P31ThemeSwitcher;
