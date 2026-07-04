/**
 * PHOS UI — Voice-first navigation shell
 * Reactive UI components for the PHOS wrapper
 */

import { PHOS_STATES, PHOS_PROFILES } from './p31-phos-core.mjs';

// ═══════════════════════════════════════════════════════════════════════════════
// PHOS Shell Component
// ═══════════════════════════════════════════════════════════════════════════════

export class PHOSShell {
  constructor(container, phosController) {
    this.container = container;
    this.phos = phosController;
    this.unsubscribe = null;
    
    this.render();
    this.bind();
  }
  
  render() {
    this.container.innerHTML = `
      <div id="phos-shell" class="phos-shell">
        <!-- Header -->
        <header class="phos-header">
          <div class="phos-brand" id="phos-brand">
            <div class="phos-pulse" id="phos-pulse"></div>
            <span class="phos-brand-text">PHOS // P31</span>
          </div>
          <button class="phos-safe-mode" id="phos-safe-mode" aria-label="Enter safe mode">
            <span class="phos-safe-icon">🛡️</span>
            <span class="phos-safe-text">Safe</span>
          </button>
        </header>
        
        <!-- Main content area -->
        <main class="phos-main" id="phos-main">
          <!-- States render here -->
        </main>
        
        <!-- Voice island (bottom) -->
        <div class="phos-voice-island" id="phos-voice-island">
          <button class="phos-voice-btn" id="phos-voice-btn" aria-label="Speak to navigate">
            <span class="phos-voice-icon" id="phos-voice-icon">🎤</span>
            <span class="phos-voice-text">Or just speak</span>
          </button>
        </div>
        
        <!-- Content mount (for loaded pages) -->
        <div id="phos-content-mount" class="phos-content-mount" hidden></div>
      </div>
    `;
    
    this.elements = {
      shell: document.getElementById('phos-shell'),
      main: document.getElementById('phos-main'),
      pulse: document.getElementById('phos-pulse'),
      brand: document.getElementById('phos-brand'),
      safeMode: document.getElementById('phos-safe-mode'),
      voiceBtn: document.getElementById('phos-voice-btn'),
      voiceIcon: document.getElementById('phos-voice-icon'),
      contentMount: document.getElementById('phos-content-mount'),
    };
  }
  
  bind() {
    // Subscribe to PHOS state changes
    this.unsubscribe = this.phos.subscribe((state) => {
      this.update(state);
    });
    
    // Brand click = reset
    this.elements.brand?.addEventListener('click', () => {
      this.phos.exitUrgentMode();
      this.phos.transitionTo(PHOS_STATES.INTENT);
      this.elements.contentMount.hidden = true;
      this.elements.main.hidden = false;
    });
    
    // Safe mode button
    this.elements.safeMode?.addEventListener('click', () => {
      this.phos.enterUrgentMode();
    });
    
    // Voice button
    this.elements.voiceBtn?.addEventListener('click', () => {
      this.toggleVoice();
    });
  }
  
  update(state) {
    const { state: currentState, profile, intent, urgent } = state;
    
    // Update profile classes
    this.elements.shell.className = `phos-shell ${profile.bg} ${profile.text}`;
    
    // Update pulse color based on state
    if (this.elements.pulse) {
      this.elements.pulse.className = `phos-pulse ${urgent ? 'phos-pulse--urgent' : 'phos-pulse--normal'}`;
    }
    
    // Hide safe mode button when already in urgent mode
    if (this.elements.safeMode) {
      this.elements.safeMode.hidden = urgent;
    }
    
    // Render current state
    switch (currentState) {
      case PHOS_STATES.GREETING:
        this.renderGreeting();
        break;
      case PHOS_STATES.INTENT:
        this.renderIntent(intent);
        break;
      case PHOS_STATES.ROUTING:
        this.renderRouting(intent);
        break;
      case PHOS_STATES.CONTENT:
        this.renderContentState();
        break;
      case PHOS_STATES.URGENT:
        this.renderUrgent();
        break;
    }
  }
  
  renderGreeting() {
    this.elements.main.innerHTML = `
      <div class="phos-greeting">
        <h1 class="phos-greeting-title">Hello.</h1>
        <p class="phos-greeting-subtitle">Initializing P31 Cognitive Architecture...</p>
      </div>
    `;
  }
  
  renderIntent(intent) {
    const chips = intent?.chips || this.getDefaultChips();
    
    const chipsHtml = chips.map((chip, i) => {
      const isPrimary = chip.primary || i === 0;
      const cls = isPrimary ? 'phos-chip phos-chip--primary' : 'phos-chip';
      const iconHtml = chip.icon ? `<span class="phos-chip-icon">${chip.icon}</span>` : '';
      
      if (chip.path) {
        return `<a href="${chip.path}" class="${cls}" data-chip-id="${chip.id}" data-chip-path="${chip.path}">
          ${iconHtml}
          <span class="phos-chip-label">${chip.label}</span>
          ${chip.hint ? `<span class="phos-chip-hint">${chip.hint}</span>` : ''}
        </a>`;
      } else {
        return `<button class="${cls}" data-chip-id="${chip.id}" data-chip-action="${chip.action || 'none'}">
          ${iconHtml}
          <span class="phos-chip-label">${chip.label}</span>
        </button>`;
      }
    }).join('');
    
    this.elements.main.innerHTML = `
      <div class="phos-intent">
        <h2 class="phos-intent-question">Whose mesh are we building today?</h2>
        <div class="phos-chips-grid">
          ${chipsHtml}
        </div>
      </div>
    `;
    
    // Bind chip clicks
    this.elements.main.querySelectorAll('[data-chip-id]').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        
        const chipData = {
          id: chip.dataset.chipId,
          path: chip.dataset.chipPath,
          action: chip.dataset.chipAction,
          label: chip.querySelector('.phos-chip-label')?.textContent,
        };
        
        this.phos.handleChipSelection(chipData);
      });
    });
  }
  
  renderRouting(intent) {
    const label = intent?.label || 'destination';
    
    this.elements.main.innerHTML = `
      <div class="phos-routing">
        <div class="phos-spinner"></div>
        <p class="phos-routing-text">Calibrating to ${label}...</p>
      </div>
    `;
  }
  
  renderContentState() {
    // Main shows the content mount
    this.elements.main.hidden = true;
    this.elements.contentMount.hidden = false;
  }
  
  renderUrgent() {
    this.elements.main.innerHTML = `
      <div class="phos-urgent">
        <div class="phos-urgent-icon">⚠️</div>
        <h2 class="phos-urgent-title">Sensory Safe Mode</h2>
        <p class="phos-urgent-desc">All animations disabled. Minimal interface.</p>
        <div class="phos-urgent-actions">
          <button class="phos-urgent-btn phos-urgent-btn--primary" id="phos-urgent-home">
            Get to safe space →
          </button>
          <button class="phos-urgent-btn" id="phos-urgent-grounding">
            Grounding exercise
          </button>
        </div>
        <button class="phos-urgent-exit" id="phos-urgent-exit">
          Exit safe mode (hold for 2 seconds)
        </button>
      </div>
    `;
    
    // Bind urgent actions
    document.getElementById('phos-urgent-home')?.addEventListener('click', () => {
      window.location.href = '/welcome';
    });
    
    document.getElementById('phos-urgent-grounding')?.addEventListener('click', () => {
      window.location.href = '/layer0';
    });
    
    let exitTimer = null;
    const exitBtn = document.getElementById('phos-urgent-exit');
    if (exitBtn) {
      exitBtn.addEventListener('mousedown', () => {
        exitTimer = setTimeout(() => {
          this.phos.exitUrgentMode();
        }, 2000);
      });
      exitBtn.addEventListener('mouseup', () => {
        if (exitTimer) clearTimeout(exitTimer);
      });
      exitBtn.addEventListener('mouseleave', () => {
        if (exitTimer) clearTimeout(exitTimer);
      });
    }
  }
  
  getDefaultChips() {
    return [
      { id: 'SELF', label: 'For Myself', icon: '🙋', path: '/passport', hint: 'Passport, tools' },
      { id: 'FAMILY', label: 'For My Family', icon: '🏠', path: '/lab', hint: 'Bonding, coordination' },
      { id: 'PRO', label: "I'm a Professional", icon: '💼', path: '/glass-box', hint: 'Research, docs' },
      { id: 'DECIDE', label: 'Help me decide →', icon: '❓', action: 'decide' },
    ];
  }
  
  toggleVoice() {
    if (this.phos.voice?.isListening) {
      this.phos.stopVoice();
      this.elements.voiceIcon.textContent = '🎤';
      this.elements.voiceBtn.classList.remove('phos-voice-btn--listening');
    } else {
      const started = this.phos.startVoice();
      if (started) {
        this.elements.voiceIcon.textContent = '🔴';
        this.elements.voiceBtn.classList.add('phos-voice-btn--listening');
      }
    }
  }
  
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.container.innerHTML = '';
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CSS Injection — Scoped PHOS styles
// ═══════════════════════════════════════════════════════════════════════════════

export function injectPHOSStyles() {
  if (document.getElementById('phos-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'phos-styles';
  style.textContent = `
    .phos-shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      font-family: var(--p31-font-sans, 'Atkinson Hyperlegible', system-ui, sans-serif);
      transition: background-color 0.5s ease, color 0.5s ease;
    }
    
    /* Header */
    .phos-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    }
    
    .phos-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      user-select: none;
    }
    
    .phos-pulse {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      transition: all 0.3s ease;
    }
    
    .phos-pulse--normal {
      background: #22d3ee;
      box-shadow: 0 0 15px rgba(34, 211, 238, 0.6);
      animation: phos-pulse 2s ease-in-out infinite;
    }
    
    .phos-pulse--urgent {
      background: #f87171;
      box-shadow: none;
      animation: none;
    }
    
    @keyframes phos-pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }
    
    .phos-brand-text {
      font-family: var(--p31-font-mono, 'JetBrains Mono', monospace);
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      opacity: 0.8;
    }
    
    .phos-safe-mode {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 0.5rem;
      background: rgba(255, 255, 255, 0.05);
      color: inherit;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .phos-safe-mode:hover {
      border-color: rgba(248, 113, 113, 0.5);
      color: #f87171;
    }
    
    /* Main content */
    .phos-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 2rem;
    }
    
    /* Greeting state */
    .phos-greeting {
      text-align: center;
      animation: phos-fade-in 1s ease-out;
    }
    
    .phos-greeting-title {
      font-size: clamp(2rem, 5vw, 3.5rem);
      font-weight: 300;
      margin: 0 0 1rem;
      letter-spacing: -0.02em;
    }
    
    .phos-greeting-subtitle {
      font-size: 1.125rem;
      opacity: 0.6;
      margin: 0;
    }
    
    /* Intent state */
    .phos-intent {
      width: 100%;
      max-width: 600px;
      text-align: center;
      animation: phos-fade-in-up 0.7s ease-out;
    }
    
    .phos-intent-question {
      font-size: clamp(1.5rem, 4vw, 2.25rem);
      font-weight: 400;
      margin: 0 0 2.5rem;
      line-height: 1.3;
    }
    
    .phos-chips-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1rem;
    }
    
    .phos-chip {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1.5rem 1rem;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 1rem;
      background: rgba(255, 255, 255, 0.04);
      color: inherit;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.25s ease;
      backdrop-filter: blur(10px);
    }
    
    .phos-chip:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(34, 211, 238, 0.4);
      transform: translateY(-2px);
    }
    
    .phos-chip--primary {
      background: rgba(34, 211, 238, 0.15);
      border-color: rgba(34, 211, 238, 0.4);
      font-weight: 600;
    }
    
    .phos-chip--primary:hover {
      background: rgba(34, 211, 238, 0.25);
    }
    
    .phos-chip-icon {
      font-size: 1.5rem;
      line-height: 1;
    }
    
    .phos-chip-label {
      font-size: 1rem;
      font-weight: 500;
    }
    
    .phos-chip-hint {
      font-size: 0.75rem;
      opacity: 0.6;
      font-family: var(--p31-font-mono, 'JetBrains Mono', monospace);
    }
    
    /* Routing state */
    .phos-routing {
      text-align: center;
      animation: phos-fade-in 0.3s ease-out;
    }
    
    .phos-spinner {
      width: 48px;
      height: 48px;
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-top-color: #22d3ee;
      border-radius: 50%;
      animation: phos-spin 1s linear infinite;
      margin: 0 auto 1.5rem;
    }
    
    @keyframes phos-spin {
      to { transform: rotate(360deg); }
    }
    
    .phos-routing-text {
      font-size: 1.125rem;
      opacity: 0.8;
    }
    
    /* Urgent state */
    .phos-urgent {
      text-align: center;
      max-width: 400px;
      padding: 2rem;
    }
    
    .phos-urgent-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    
    .phos-urgent-title {
      font-size: 1.75rem;
      font-weight: 600;
      margin: 0 0 0.5rem;
    }
    
    .phos-urgent-desc {
      font-size: 1rem;
      opacity: 0.7;
      margin: 0 0 2rem;
    }
    
    .phos-urgent-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 2rem;
    }
    
    .phos-urgent-btn {
      padding: 1rem 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 0.75rem;
      background: rgba(255, 255, 255, 0.05);
      color: inherit;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .phos-urgent-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.3);
    }
    
    .phos-urgent-btn--primary {
      background: rgba(34, 211, 238, 0.2);
      border-color: rgba(34, 211, 238, 0.4);
      font-weight: 600;
    }
    
    .phos-urgent-btn--primary:hover {
      background: rgba(34, 211, 238, 0.3);
    }
    
    .phos-urgent-exit {
      padding: 0.75rem;
      border: 1px dashed rgba(255, 255, 255, 0.2);
      border-radius: 0.5rem;
      background: transparent;
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .phos-urgent-exit:active {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.8);
    }
    
    /* Voice island */
    .phos-voice-island {
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 100;
    }
    
    .phos-voice-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 9999px;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(20px);
      color: inherit;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .phos-voice-btn:hover {
      border-color: rgba(34, 211, 238, 0.4);
      background: rgba(34, 211, 238, 0.1);
    }
    
    .phos-voice-btn--listening {
      border-color: rgba(248, 113, 113, 0.5);
      background: rgba(248, 113, 113, 0.1);
      animation: phos-listening 1.5s ease-in-out infinite;
    }
    
    @keyframes phos-listening {
      0%, 100% { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.4); }
      50% { box-shadow: 0 0 0 10px rgba(248, 113, 113, 0); }
    }
    
    .phos-voice-icon {
      font-size: 1.25rem;
      line-height: 1;
    }
    
    .phos-voice-text {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      opacity: 0.7;
    }
    
    /* Content mount */
    .phos-content-mount {
      flex: 1;
      overflow-y: auto;
      padding: 2rem;
    }
    
    .phos-content-mount:not([hidden]) {
      animation: phos-fade-in 0.5s ease-out;
    }
    
    /* Animations */
    @keyframes phos-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes phos-fade-in-up {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .phos-shell *,
      .phos-shell *::before,
      .phos-shell *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
    
    /* Gray rock mode */
    .phos-gray-rock .phos-pulse {
      animation: none !important;
      background: rgba(130, 136, 148, 0.4) !important;
      box-shadow: none !important;
    }
    
    .phos-gray-rock .phos-chip {
      border-color: rgba(255, 255, 255, 0.08) !important;
      background: rgba(255, 255, 255, 0.02) !important;
    }
    
    .phos-gray-rock .phos-chip--primary {
      background: rgba(255, 255, 255, 0.05) !important;
      border-color: rgba(255, 255, 255, 0.15) !important;
    }
  `;
  
  document.head.appendChild(style);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Initialize PHOS on a page
// ═══════════════════════════════════════════════════════════════════════════════

export function initPHOS(containerId = 'phos-root', options = {}) {
  // Inject styles
  injectPHOSStyles();
  
  // Find or create container
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);
  }
  
  // Import and create PHOS controller
  import('./p31-phos-core.mjs').then(({ createPHOS }) => {
    const phos = createPHOS(options);
    const ui = new PHOSShell(container, phos);
    
    // Expose for debugging
    window.p31PHOS = { phos, ui };
    
    console.log('PHOS initialized');
  });
}

// Auto-init if data-phos attribute present
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.querySelector('[data-phos]')) {
        initPHOS();
      }
    });
  } else {
    if (document.querySelector('[data-phos]')) {
      initPHOS();
    }
  }
}

export default { PHOSShell, injectPHOSStyles, initPHOS };
