// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Text-to-Speech Service: Voice feedback for kids
// Phase 5: Voice Companion
// ═══════════════════════════════════════════════════════

// Pre-reader friendly element names
const ELEMENT_SPEECH_NAMES: Record<string, string> = {
  H: 'Hydrogen',
  C: 'Carbon',
  N: 'Nitrogen',
  O: 'Oxygen',
  Na: 'Sodium',
  P: 'Phosphorus',
  Ca: 'Calcium',
  Cl: 'Chlorine',
  S: 'Sulfur',
  Fe: 'Iron',
  Mn: 'Manganese',
  Ba: 'Bashium',
  Wi: 'Willium',
};

// Molecule display names for speech
const MOLECULE_SPEECH_NAMES: Record<string, string> = {
  H2O: 'water',
  CH4: 'methane',
  NH3: 'ammonia',
  CO2: 'carbon dioxide',
  CO: 'carbon monoxide',
  O2: 'oxygen gas',
  N2: 'nitrogen gas',
  NaCl: 'salt',
  HCl: 'hydrochloric acid',
  H2S: 'hydrogen sulfide',
  H2: 'hydrogen gas',
  C6H12O6: 'glucose',
  CaCO3: 'calcium carbonate',
  CaCl2: 'calcium chloride',
};

// Feedback messages
const MESSAGES = {
  greatJob: ["Great job!", "Awesome!", "You're amazing!", "Way to go!", "Fantastic!"],
  tryConnecting: ["Try connecting {a} to {b}.", "Can you link {a} and {b}?", "Connect {a} to {b}!"],
  youBuilt: ["You built {formula}!", "Look at that! You made {formula}!", "You created {formula}!"],
  newBadge: ["New badge: {badge}!", "You earned {badge}!", "Check it out! {badge}!"],
  selectElement: ["Select {element}.", "Pick {element}.", "{element} please."],
  placeAtom: ["Place it!", "Put it there!", "Drop it!"],
  bondAtoms: ["Now connect them!", "Bond them together!", "Link the atoms!"],
  helpMessage: ["Tap an element, then tap where you want it. Say 'bond' to connect atoms!"],
  celebrateMessage: ["Yay! Awesome!"],
  targetMolecule: ["Let's make {molecule}! You need {elements}."],
  elementNotAllowed: ["Oops! You can't use {element} yet."],
  fullMolecule: ["Your molecule is complete!"],
};

export interface VoiceFeedbackOptions {
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

const DEFAULT_VOICE_OPTIONS: VoiceFeedbackOptions = {
  rate: 0.9,
  pitch: 1.0,
  volume: 1.0,
};

class VoiceFeedbackService {
  private options: VoiceFeedbackOptions;
  private isMuted = false;
  private isSpeaking = false;

  constructor(options: VoiceFeedbackOptions = {}) {
    this.options = { ...DEFAULT_VOICE_OPTIONS, ...options };
  }

  private getSynth(): SpeechSynthesis | null {
    if (typeof window === 'undefined') return null;
    return (window as unknown as { speechSynthesis?: SpeechSynthesis }).speechSynthesis || null;
  }

  private getVoices(): SpeechSynthesisVoice[] {
    const synth = this.getSynth();
    if (!synth) return [];
    try {
      return synth.getVoices() || [];
    } catch {
      return [];
    }
  }

  private createUtterance(text: string): SpeechSynthesisUtterance | null {
    const synth = this.getSynth();
    if (!synth) return null;
    
    // Use the native SpeechSynthesisUtterance constructor
    const SpeechSynthesisUtteranceClass = (window as unknown as { SpeechSynthesisUtterance?: new (text: string) => SpeechSynthesisUtterance }).SpeechSynthesisUtterance;
    if (!SpeechSynthesisUtteranceClass) return null;
    
    const utterance = new SpeechSynthesisUtteranceClass(text);
    return utterance;
  }

  speak(text: string, onEnd?: () => void): void {
    if (this.isMuted) return;

    const synth = this.getSynth();
    if (!synth) return;

    // Cancel any ongoing speech
    synth.cancel();

    const utterance = this.createUtterance(text);
    if (!utterance) return;

    const voices = this.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('English')
    ) || voices[0] || null;

    utterance.lang = 'en-US';
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    utterance.volume = this.options.volume || 1;
    utterance.rate = this.options.rate || 0.9;
    utterance.pitch = this.options.pitch || 1.0;

    utterance.onstart = () => {
      this.isSpeaking = true;
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      onEnd?.();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
    };

    try {
      synth.speak(utterance);
    } catch (e) {
      console.warn('[VoiceFeedback] Failed to speak:', e);
    }
  }

  greatJob(): void {
    const msg = this.randomChoice(MESSAGES.greatJob);
    this.speak(msg);
  }

  tryConnecting(element1: string, element2: string): void {
    const name1 = ELEMENT_SPEECH_NAMES[element1] || element1;
    const name2 = ELEMENT_SPEECH_NAMES[element2] || element2;
    const msg = this.randomChoice(MESSAGES.tryConnecting)
      .replace('{a}', name1)
      .replace('{b}', name2);
    this.speak(msg);
  }

  youBuilt(formula: string): void {
    const name = MOLECULE_SPEECH_NAMES[formula] || formula;
    const msg = this.randomChoice(MESSAGES.youBuilt).replace('{formula}', name);
    this.speak(msg);
  }

  newBadge(badgeName: string): void {
    const msg = this.randomChoice(MESSAGES.newBadge).replace('{badge}', badgeName);
    this.speak(msg);
  }

  selectElement(element: string): void {
    const name = ELEMENT_SPEECH_NAMES[element] || element;
    const msg = this.randomChoice(MESSAGES.selectElement).replace('{element}', name);
    this.speak(msg);
  }

  placeAtom(): void {
    const msg = this.randomChoice(MESSAGES.placeAtom);
    this.speak(msg);
  }

  bondAtoms(): void {
    const msg = this.randomChoice(MESSAGES.bondAtoms);
    this.speak(msg);
  }

  showHelp(): void {
    const msg = this.randomChoice(MESSAGES.helpMessage);
    this.speak(msg);
  }

  celebrate(): void {
    const msg = this.randomChoice(MESSAGES.celebrateMessage);
    this.speak(msg);
  }

  targetMolecule(formula: string): void {
    const name = MOLECULE_SPEECH_NAMES[formula] || formula;
    const elements = this.getElementsForMolecule(formula);
    const msg = this.randomChoice(MESSAGES.targetMolecule)
      .replace('{molecule}', name)
      .replace('{elements}', elements);
    this.speak(msg);
  }

  elementNotAllowed(element: string): void {
    const name = ELEMENT_SPEECH_NAMES[element] || element;
    const msg = this.randomChoice(MESSAGES.elementNotAllowed).replace('{element}', name);
    this.speak(msg);
  }

  fullMolecule(): void {
    const msg = this.randomChoice(MESSAGES.fullMolecule);
    this.speak(msg);
  }

  mute(): void {
    this.isMuted = true;
    this.getSynth()?.cancel();
  }

  unmute(): void {
    this.isMuted = false;
  }

  toggleMute(): boolean {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
    return this.isMuted;
  }

  get muted(): boolean {
    return this.isMuted;
  }

  get speaking(): boolean {
    return this.isSpeaking;
  }

  setRate(rate: number): void {
    this.options.rate = Math.max(0.5, Math.min(2.0, rate));
  }

  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as unknown as { speechSynthesis?: unknown; SpeechSynthesisUtterance?: unknown };
    return !!(win.speechSynthesis && win.SpeechSynthesisUtterance);
  }

  private randomChoice<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  private getElementsForMolecule(formula: string): string {
    const elementMap: Record<string, string> = {
      H2O: 'two hydrogen and one oxygen',
      CH4: 'one carbon and four hydrogen',
      NH3: 'one nitrogen and three hydrogen',
      CO2: 'one carbon and two oxygen',
      NaCl: 'one sodium and one chlorine',
    };
    return elementMap[formula] || formula;
  }
}

export const voiceFeedback = new VoiceFeedbackService();

export function useVoiceFeedback() {
  return {
    speak: (text: string) => voiceFeedback.speak(text),
    greatJob: () => voiceFeedback.greatJob(),
    tryConnecting: (e1: string, e2: string) => voiceFeedback.tryConnecting(e1, e2),
    youBuilt: (formula: string) => voiceFeedback.youBuilt(formula),
    newBadge: (badge: string) => voiceFeedback.newBadge(badge),
    selectElement: (element: string) => voiceFeedback.selectElement(element),
    placeAtom: () => voiceFeedback.placeAtom(),
    bondAtoms: () => voiceFeedback.bondAtoms(),
    showHelp: () => voiceFeedback.showHelp(),
    celebrate: () => voiceFeedback.celebrate(),
    targetMolecule: (formula: string) => voiceFeedback.targetMolecule(formula),
    elementNotAllowed: (element: string) => voiceFeedback.elementNotAllowed(element),
    fullMolecule: () => voiceFeedback.fullMolecule(),
    mute: () => voiceFeedback.mute(),
    unmute: () => voiceFeedback.unmute(),
    toggleMute: () => voiceFeedback.toggleMute(),
    isMuted: () => voiceFeedback.muted,
    isSpeaking: () => voiceFeedback.speaking,
    isSupported: () => voiceFeedback.isSupported(),
  };
}