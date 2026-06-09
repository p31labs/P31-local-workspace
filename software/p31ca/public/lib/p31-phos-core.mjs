/**
 * PHOS (Phosphorus31 Operating System) — Voice-first, inference-driven navigation
 * Core architecture: deterministic routing, progressive disclosure, crisis mode
 * @version 1.0.0
 */

// ═══════════════════════════════════════════════════════════════════════════════
// PHOS State Machine
// ═══════════════════════════════════════════════════════════════════════════════

export const PHOS_STATES = {
  GREETING: 'GREETING',      // Initial state — minimal presence
  INTENT: 'INTENT',          // Asking "who are we building for?"
  ROUTING: 'ROUTING',        // Transition animation
  CONTENT: 'CONTENT',        // Showing the destination
  URGENT: 'URGENT',          // Crisis mode — gray rock, minimal UI
};

export const PHOS_PROFILES = {
  STANDARD: {
    bg: 'bg-slate-950',
    text: 'text-slate-200',
    accent: 'text-cyan-400',
    border: 'border-cyan-500/30',
    animation: true,
  },
  GRAY_ROCK: {
    bg: 'bg-black',
    text: 'text-gray-300',
    accent: 'text-gray-100',
    border: 'border-gray-800',
    animation: false,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Intent Catalog — Deterministic routing (no LLM, no hallucination)
// ═══════════════════════════════════════════════════════════════════════════════

export const INTENT_CATALOG = [
  {
    id: 'SELF',
    patterns: ['myself', 'me', 'i', 'my', 'personal', 'alone', 'individual', 'self'],
    label: 'For Myself',
    icon: '🙋',
    hint: 'Passport, Sovereign Tools',
    destination: '/passport',
    confidence: 0.9,
  },
  {
    id: 'FAMILY',
    patterns: ['family', 'household', 'kids', 'children', 'parents', 'home', 'together', 'us', 'we', 'partner', 'spouse'],
    label: 'For My Family',
    icon: '🏠',
    hint: 'Bonding, Social Molecules',
    destination: '/lab',
    confidence: 0.85,
  },
  {
    id: 'PRO',
    patterns: ['professional', 'work', 'job', 'career', 'developer', 'engineer', 'doctor', 'therapist', 'clinician', 'researcher'],
    label: "I'm a Professional",
    icon: '💼',
    hint: 'Research, Docs, Operator',
    destination: '/glass-box',
    confidence: 0.8,
  },
  {
    id: 'CRISIS',
    patterns: ['help', 'crisis', 'overwhelm', 'panic', 'anxiety', 'emergency', 'too much', 'stop', 'safe', 'calm'],
    label: 'I need help now',
    icon: '🆘',
    hint: 'Safe mode — minimal stimulation',
    destination: '/welcome',
    confidence: 1.0,
    urgent: true,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// Inference Engine — Deterministic pattern matching
// ═══════════════════════════════════════════════════════════════════════════════

export function inferIntent(input, context = {}) {
  if (!input || typeof input !== 'string') {
    return { intent: null, confidence: 0, chips: [] };
  }

  const normalized = input.toLowerCase().trim();
  const words = normalized.split(/\s+/);
  
  let bestMatch = null;
  let bestScore = 0;
  const scores = [];

  for (const intent of INTENT_CATALOG) {
    let score = 0;
    
    // Pattern matching
    for (const pattern of intent.patterns) {
      if (normalized.includes(pattern)) {
        score += pattern.length >= 5 ? 0.3 : 0.2; // Longer matches = higher confidence
      }
    }
    
    // Word boundary matches
    for (const word of words) {
      if (intent.patterns.includes(word)) {
        score += 0.25;
      }
    }
    
    // Exact match bonus
    if (intent.patterns.some(p => p === normalized)) {
      score += 0.5;
    }
    
    scores.push({ intent, score });
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = intent;
    }
  }

  // Crisis detection — immediate override
  const crisisWords = ['help', 'crisis', 'panic', 'emergency', 'stop', 'overwhelm'];
  if (crisisWords.some(w => normalized.includes(w))) {
    const crisisIntent = INTENT_CATALOG.find(i => i.id === 'CRISIS');
    if (crisisIntent) {
      return {
        intent: crisisIntent,
        confidence: 1.0,
        urgent: true,
        chips: generateChips(crisisIntent, scores, context),
      };
    }
  }

  // Confidence threshold
  const confidenceThreshold = context.screenComfort < 30 ? 0.3 : 0.5;
  
  if (bestScore < confidenceThreshold || !bestMatch) {
    return {
      intent: null,
      confidence: 0,
      chips: generateStandardChips(scores, context),
    };
  }

  return {
    intent: bestMatch,
    confidence: Math.min(bestScore + bestMatch.confidence * 0.3, 1.0),
    chips: generateChips(bestMatch, scores, context),
  };
}

function generateChips(bestIntent, allScores, context) {
  const chips = [];
  
  // Primary chip — the best match
  chips.push({
    id: bestIntent.id,
    label: bestIntent.label,
    icon: bestIntent.icon,
    path: bestIntent.destination,
    primary: true,
    confidence: bestIntent.confidence,
  });
  
  // Secondary chips — next best matches
  const secondary = allScores
    .filter(s => s.intent.id !== bestIntent.id && s.score > 0.1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
  
  for (const { intent } of secondary) {
    chips.push({
      id: intent.id,
      label: intent.label,
      icon: intent.icon,
      path: intent.destination,
      primary: false,
    });
  }
  
  // Always include "Help me decide" chip
  chips.push({
    id: 'DECIDE',
    label: 'Help me decide →',
    icon: '❓',
    action: 'decide',
    primary: false,
  });
  
  return chips;
}

function generateStandardChips(scores, context) {
  // Return all intents as chips when no clear match
  return INTENT_CATALOG
    .filter(i => i.id !== 'CRISIS')
    .map(intent => ({
      id: intent.id,
      label: intent.label,
      icon: intent.icon,
      path: intent.destination,
      primary: false,
    }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// Voice Recognition — Web Speech API wrapper
// ═══════════════════════════════════════════════════════════════════════════════

export class PHOSVoice {
  constructor(onResult, onError) {
    this.recognition = null;
    this.onResult = onResult;
    this.onError = onError;
    this.isListening = false;
    
    this.init();
  }
  
  init() {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('PHOS: Speech recognition not supported');
      return;
    }
    
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    
    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      this.isListening = false;
      if (this.onResult) this.onResult(transcript);
    };
    
    this.recognition.onerror = (event) => {
      this.isListening = false;
      if (this.onError) this.onError(event.error);
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
    };
  }
  
  start() {
    if (!this.recognition) {
      this.onError?.('Speech recognition not available');
      return false;
    }
    
    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (err) {
      this.onError?.(err.message);
      return false;
    }
  }
  
  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHOS Controller — State management and transitions
// ═══════════════════════════════════════════════════════════════════════════════

export class PHOSController {
  constructor(options = {}) {
    this.state = PHOS_STATES.GREETING;
    this.profile = PHOS_PROFILES.STANDARD;
    this.currentIntent = null;
    this.contentCache = new Map();
    this.listeners = new Set();
    this.voice = null;
    this.urgentMode = false;
    
    // Context from cognitive passport if available
    this.context = {
      screenComfort: 100,
      soundComfort: 100,
      hasPassport: false,
      ...options.context,
    };
    
    this.init();
  }
  
  init() {
    // Check for urgent mode in URL or passport
    const params = new URLSearchParams(window.location.search);
    if (params.has('urgent') || params.has('safe') || this.context.screenComfort < 20) {
      this.enterUrgentMode();
    }
    
    // Auto-advance from greeting after delay
    if (this.state === PHOS_STATES.GREETING) {
      setTimeout(() => {
        if (this.state === PHOS_STATES.GREETING) {
          this.transitionTo(PHOS_STATES.INTENT);
        }
      }, 2500);
    }
  }
  
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  notify() {
    const state = {
      state: this.state,
      profile: this.profile,
      intent: this.currentIntent,
      context: this.context,
      urgent: this.urgentMode,
    };
    
    for (const listener of this.listeners) {
      listener(state);
    }
    
    // Dispatch global event
    window.dispatchEvent(new CustomEvent('p31:phos-state', { detail: state }));
  }
  
  transitionTo(newState, data = {}) {
    const oldState = this.state;
    this.state = newState;
    
    if (data.intent) {
      this.currentIntent = data.intent;
    }
    
    this.notify();
    
    console.log(`PHOS: ${oldState} → ${newState}`);
    
    // Handle specific transitions
    if (newState === PHOS_STATES.CONTENT && data.destination) {
      this.loadContent(data.destination);
    }
  }
  
  enterUrgentMode() {
    this.urgentMode = true;
    this.profile = PHOS_PROFILES.GRAY_ROCK;
    this.transitionTo(PHOS_STATES.URGENT);
    
    // Apply gray rock to document
    document.documentElement.classList.add('phos-gray-rock');
    document.documentElement.style.setProperty('--phos-animation', 'none');
  }
  
  exitUrgentMode() {
    this.urgentMode = false;
    this.profile = PHOS_PROFILES.STANDARD;
    document.documentElement.classList.remove('phos-gray-rock');
    document.documentElement.style.removeProperty('--phos-animation');
    this.transitionTo(PHOS_STATES.INTENT);
  }
  
  handleVoiceInput(transcript) {
    const inference = inferIntent(transcript, this.context);
    
    if (inference.urgent || inference.intent?.urgent) {
      this.enterUrgentMode();
      return;
    }
    
    if (inference.intent && inference.confidence >= 0.5) {
      this.transitionTo(PHOS_STATES.ROUTING, { intent: inference.intent });
      
      setTimeout(() => {
        this.transitionTo(PHOS_STATES.CONTENT, { 
          destination: inference.intent.destination,
          intent: inference.intent,
        });
      }, 1500);
    } else {
      // Low confidence — show all options
      this.currentIntent = { chips: inference.chips };
      this.notify();
    }
  }
  
  handleChipSelection(chip) {
    if (chip.action === 'decide') {
      // Show decision helper chips
      this.currentIntent = {
        chips: [
          { label: 'For myself', path: '/passport', icon: '🙋' },
          { label: 'For my family', path: '/lab', icon: '🏠' },
          { label: 'As a professional', path: '/glass-box', icon: '💼' },
          { label: '← Back', action: 'back', icon: '←' },
        ],
      };
      this.notify();
      return;
    }
    
    if (chip.action === 'back') {
      this.transitionTo(PHOS_STATES.INTENT);
      return;
    }
    
    if (chip.path) {
      this.transitionTo(PHOS_STATES.ROUTING, { intent: chip });
      
      setTimeout(() => {
        this.transitionTo(PHOS_STATES.CONTENT, { 
          destination: chip.path,
          intent: chip,
        });
      }, 800);
    }
  }
  
  async loadContent(url) {
    // Check cache
    if (this.contentCache.has(url)) {
      this.renderContent(this.contentCache.get(url));
      return;
    }
    
    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'text/html' },
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const html = await response.text();
      
      // Extract body content
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      const content = bodyMatch ? bodyMatch[1] : html;
      
      // Cache it
      this.contentCache.set(url, content);
      
      this.renderContent(content);
    } catch (err) {
      console.error('PHOS: Failed to load content:', err);
      this.renderError(url, err);
    }
  }
  
  renderContent(content) {
    const container = document.getElementById('phos-content-mount');
    if (container) {
      container.innerHTML = content;
      
      // Execute any scripts in the loaded content
      const scripts = container.querySelectorAll('script');
      scripts.forEach(script => {
        const newScript = document.createElement('script');
        if (script.src) {
          newScript.src = script.src;
        } else {
          newScript.textContent = script.textContent;
        }
        document.head.appendChild(newScript);
        document.head.removeChild(newScript);
      });
    }
    
    // Update URL without reload
    const currentUrl = new URL(window.location);
    currentUrl.pathname = this.currentIntent?.destination || '/phos';
    window.history.pushState({}, '', currentUrl);
  }
  
  renderError(url, error) {
    const container = document.getElementById('phos-content-mount');
    if (container) {
      container.innerHTML = `
        <div class="phos-error">
          <h2>Unable to load content</h2>
          <p>The requested page could not be loaded.</p>
          <p class="phos-error-detail">${error.message}</p>
          <button onclick="window.phos.transitionTo('${PHOS_STATES.INTENT}')">
            Return to navigation
          </button>
        </div>
      `;
    }
  }
  
  startVoice() {
    if (!this.voice) {
      this.voice = new PHOSVoice(
        (transcript) => this.handleVoiceInput(transcript),
        (error) => console.error('PHOS Voice error:', error)
      );
    }
    
    return this.voice.start();
  }
  
  stopVoice() {
    if (this.voice) {
      this.voice.stop();
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Global instance
// ═══════════════════════════════════════════════════════════════════════════════

export function createPHOS(options = {}) {
  const phos = new PHOSController(options);
  
  // Expose for debugging (remove in production)
  if (typeof window !== 'undefined') {
    window.phos = phos;
  }
  
  return phos;
}

// Default export
export default { createPHOS, PHOSController, PHOSVoice, inferIntent, INTENT_CATALOG, PHOS_STATES, PHOS_PROFILES };
