/**
 * p31-phos-oracle.mjs — PHOS Akinator Engine v1.0
 * 
 * The WOW-factor upgrade to PHOS. Adds:
 * - Akinator-style app deduction (20 questions to find the right tool)
 * - Particle effects and holographic UI
 * - Proactive suggestions based on time/patterns
 * - Voice synthesis for spoken responses
 * - Easter eggs and delight moments
 * 
 * Extends p31-phos-guide.mjs — can be loaded alongside or as replacement.
 * Schema: p31.phosOracle/1.0.0
 */

const APP_DATABASE = [
  // Productivity
  { id: 'tasks', name: 'Tasks', category: 'productivity', keywords: ['todo', 'list', 'work', 'organize', 'plan', 'schedule', 'remind'], emoji: '✓', description: 'Keep track of what needs doing' },
  { id: 'journal', name: 'Journal', category: 'productivity', keywords: ['diary', 'write', 'thoughts', 'feelings', 'daily', 'entry'], emoji: '📓', description: 'Write about your day' },
  { id: 'notes', name: 'Notes', category: 'productivity', keywords: ['note', 'quick', 'idea', 'jot', 'memo', 'remember'], emoji: '📝', description: 'Quick notes and ideas' },
  { id: 'calendar', name: 'Calendar', category: 'productivity', keywords: ['date', 'event', 'plan', 'schedule', 'appointment', 'when'], emoji: '📅', description: 'See what\'s coming up' },
  { id: 'pomodoro', name: 'Pomodoro', category: 'productivity', keywords: ['focus', 'timer', 'work', 'study', 'concentrate', 'break'], emoji: '🍅', description: 'Focus with timed intervals' },
  { id: 'focus', name: 'Focus Mode', category: 'productivity', keywords: ['write', 'distraction', 'clean', 'simple', 'minimal', 'concentrate'], emoji: '🎯', description: 'Distraction-free writing' },
  
  // Health
  { id: 'water', name: 'Water', category: 'health', keywords: ['drink', 'hydrate', 'thirsty', 'bottle', 'ml', 'hydration'], emoji: '💧', description: 'Track your water intake' },
  { id: 'mood', name: 'Mood', category: 'health', keywords: ['feel', 'emotion', 'happy', 'sad', 'track', 'mental'], emoji: '🎭', description: 'Track how you feel' },
  { id: 'habit', name: 'Habit', category: 'health', keywords: ['routine', 'daily', 'streak', 'build', 'practice', 'habit'], emoji: '🔥', description: 'Build daily habits' },
  { id: 'sleep', name: 'Sleep', category: 'health', keywords: ['tired', 'rest', 'bed', 'wake', 'cycle', 'nap'], emoji: '😴', description: 'Calculate optimal sleep times' },
  { id: 'zen', name: 'Zen', category: 'health', keywords: ['meditate', 'calm', 'breathe', 'relax', 'peace', 'mindful'], emoji: '🧘', description: 'Meditation and breathing' },
  { id: 'meals', name: 'Meals', category: 'health', keywords: ['food', 'eat', 'cook', 'recipe', 'plan', 'nutrition'], emoji: '🥗', description: 'Plan your meals' },
  
  // Creativity
  { id: 'canvas', name: 'Canvas', category: 'creative', keywords: ['draw', 'paint', 'art', 'sketch', 'create', 'doodle'], emoji: '🎨', description: 'Draw and create art' },
  { id: 'book', name: 'Book', category: 'creative', keywords: ['read', 'library', 'novel', 'story', 'author'], emoji: '📚', description: 'Track your reading' },
  { id: 'voice', name: 'Voice Notes', category: 'creative', keywords: ['record', 'speak', 'audio', 'sound', 'memo'], emoji: '🎤', description: 'Record your voice' },
  { id: 'white-noise', name: 'White Noise', category: 'creative', keywords: ['sound', 'sleep', 'focus', 'ambient', 'noise', 'calm'], emoji: '🌊', description: 'Ambient background sounds' },
  { id: 'resonance', name: 'Resonance', category: 'creative', keywords: ['healing', 'frequency', 'binaural', 'therapy', 'sound'], emoji: '🔊', description: 'Therapeutic sound generator' },
  
  // Tools
  { id: 'calc', name: 'Calculator', category: 'tools', keywords: ['math', 'number', 'add', 'subtract', 'calculate', 'sum'], emoji: '🧮', description: 'Do math problems' },
  { id: 'converter', name: 'Converter', category: 'tools', keywords: ['convert', 'unit', 'measure', 'temperature', 'length', 'weight'], emoji: '⚖️', description: 'Convert between units' },
  { id: 'qr', name: 'QR Generator', category: 'tools', keywords: ['code', 'scan', 'share', 'link', 'qr'], emoji: '🔲', description: 'Make QR codes' },
  { id: 'password', name: 'Password', category: 'tools', keywords: ['secure', 'strong', 'safe', 'login', 'protect'], emoji: '🔐', description: 'Check password strength' },
  { id: 'color', name: 'Color Picker', category: 'tools', keywords: ['color', 'hex', 'rgb', 'design', 'palette'], emoji: '🎨', description: 'Pick and mix colors' },
  { id: 'dice', name: 'Dice', category: 'tools', keywords: ['roll', 'random', 'game', 'chance', 'decide'], emoji: '🎲', description: 'Roll the dice' },
  { id: 'decide', name: 'Decide', category: 'tools', keywords: ['choose', 'pick', 'coin', 'flip', 'decision', 'random'], emoji: '🪙', description: 'Make decisions' },
  { id: 'chart', name: 'Chart', category: 'tools', keywords: ['graph', 'data', 'visualize', 'bar', 'pie', 'statistics'], emoji: '📊', description: 'Make simple charts' },
  { id: 'split', name: 'Split', category: 'tools', keywords: ['bill', 'money', 'divide', 'pay', 'share', 'cost'], emoji: '💰', description: 'Split bills fairly' },
  
  // Communication
  { id: 'cipher', name: 'Cipher', category: 'comms', keywords: ['secret', 'code', 'encrypt', 'hide', 'message', 'decode'], emoji: '🔏', description: 'Secret codes' },
  { id: 'echo', name: 'Echo', category: 'comms', keywords: ['speak', 'text', 'voice', 'read', 'aloud', 'tts'], emoji: '🗣️', description: 'Text to speech' },
  { id: 'voice-recognition', name: 'Voice', category: 'comms', keywords: ['transcribe', 'dictate', 'speech', 'write', 'listen'], emoji: '👂', description: 'Speech to text' },
  
  // Exploration
  { id: 'compass', name: 'Compass', category: 'explore', keywords: ['direction', 'north', 'lost', 'navigate', 'orient'], emoji: '🧭', description: 'Find your direction' },
  { id: 'level', name: 'Level', category: 'explore', keywords: ['straight', 'flat', 'bubble', 'align', 'horizontal'], emoji: '📐', description: 'Check if things are level' },
  { id: 'stims', name: 'Stims', category: 'explore', keywords: ['sensory', 'calm', 'breathe', 'visual', 'pattern'], emoji: '✨', description: 'Sensory tools' },
  
  // Fun
  { id: 'pet', name: 'Pet', category: 'fun', keywords: ['virtual', 'tamagotchi', 'care', 'feed', 'play', 'animal'], emoji: '🐣', description: 'Care for a virtual pet' },
  { id: 'fish', name: 'Fish', category: 'fun', keywords: ['aquarium', 'relax', 'watch', 'calm', 'ocean'], emoji: '🐠', description: 'Watch virtual fish' },
  { id: 'quote', name: 'Quote', category: 'fun', keywords: ['inspire', 'wisdom', 'words', 'motivation', 'sayings'], emoji: '💬', description: 'Get inspired' }
];

// Akinator decision tree
const QUESTIONS = [
  { id: 'health', text: 'Is this about your body or how you feel?', filter: (app) => app.category === 'health' },
  { id: 'work', text: 'Is this for getting things done?', filter: (app) => app.category === 'productivity' },
  { id: 'create', text: 'Are you trying to make something?', filter: (app) => app.category === 'creative' },
  { id: 'numbers', text: 'Does it involve numbers or calculations?', filter: (app) => app.category === 'tools' && ['calc', 'converter', 'chart', 'split'].includes(app.id) },
  { id: 'fun', text: 'Is this just for fun or relaxing?', filter: (app) => ['fun', 'creative'].includes(app.category) },
  { id: 'secret', text: 'Is this about secrets or privacy?', filter: (app) => ['cipher', 'password'].includes(app.id) },
  { id: 'time', text: 'Does this involve time or scheduling?', filter: (app) => ['calendar', 'pomodoro', 'sleep'].includes(app.id) },
  { id: 'write', text: 'Does it involve writing or words?', filter: (app) => ['journal', 'notes', 'focus'].includes(app.id) },
  { id: 'sound', text: 'Does this involve sound or listening?', filter: (app) => ['voice', 'white-noise', 'resonance', 'echo', 'voice-recognition'].includes(app.id) },
  { id: 'visual', text: 'Is this about seeing or visuals?', filter: (app) => ['canvas', 'fish', 'color', 'stims'].includes(app.id) }
];

class PhosOracle {
  constructor() {
    this.state = 'idle'; // idle, asking, suggesting, showing
    this.candidates = [...APP_DATABASE];
    this.askedQuestions = new Set();
    this.currentQuestion = null;
    this.score = 0;
    this.particles = [];
    this.confetti = [];
  }

  // Start the Akinator-style questioning
  startOracle() {
    this.state = 'asking';
    this.candidates = [...APP_DATABASE];
    this.askedQuestions.clear();
    return this.nextQuestion();
  }

  // Get next most discriminating question
  nextQuestion() {
    if (this.candidates.length <= 3) {
      return this.showSuggestions();
    }

    // Find question that splits candidates most evenly
    let bestQuestion = null;
    let bestScore = Infinity;

    for (const q of QUESTIONS) {
      if (this.askedQuestions.has(q.id)) continue;
      
      const matching = this.candidates.filter(q.filter).length;
      const nonMatching = this.candidates.length - matching;
      const imbalance = Math.abs(matching - nonMatching);
      
      if (imbalance < bestScore && matching > 0 && nonMatching > 0) {
        bestScore = imbalance;
        bestQuestion = q;
      }
    }

    if (!bestQuestion) {
      return this.showSuggestions();
    }

    this.currentQuestion = bestQuestion;
    this.askedQuestions.add(bestQuestion.id);
    
    return {
      type: 'question',
      text: bestQuestion.text,
      candidates: this.candidates.length,
      questionId: bestQuestion.id
    };
  }

  // Handle yes/no answer
  answer(yes) {
    if (!this.currentQuestion) return null;

    if (yes) {
      this.candidates = this.candidates.filter(this.currentQuestion.filter);
    } else {
      this.candidates = this.candidates.filter(app => !this.currentQuestion.filter(app));
    }

    return this.nextQuestion();
  }

  // Show final suggestions
  showSuggestions() {
    this.state = 'suggesting';
    return {
      type: 'suggestions',
      apps: this.candidates.slice(0, 3).map(app => ({
        ...app,
        confidence: this.calculateConfidence(app)
      }))
    };
  }

  calculateConfidence(app) {
    // Simple confidence based on how many questions matched
    const originalCount = APP_DATABASE.length;
    const currentCount = this.candidates.length;
    return Math.round(((originalCount - currentCount) / originalCount) * 100);
  }

  // Search by keywords
  search(query) {
    const terms = query.toLowerCase().split(/\s+/);
    return APP_DATABASE.map(app => {
      const score = terms.reduce((sum, term) => {
        let termScore = 0;
        if (app.name.toLowerCase().includes(term)) termScore += 10;
        if (app.description.toLowerCase().includes(term)) termScore += 5;
        if (app.keywords.some(k => k.includes(term))) termScore += 3;
        return sum + termScore;
      }, 0);
      return { ...app, score };
    }).filter(a => a.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);
  }

  // Get proactive suggestion based on time
  getProactiveSuggestion() {
    const hour = new Date().getHours();
    const suggestions = [];

    if (hour >= 6 && hour < 9) {
      suggestions.push({ app: 'water', reason: 'Start your day hydrated 💧' });
      suggestions.push({ app: 'habit', reason: 'Check off your morning routine 🔥' });
    } else if (hour >= 9 && hour < 12) {
      suggestions.push({ app: 'pomodoro', reason: 'Focus time 🍅' });
      suggestions.push({ app: 'tasks', reason: 'What needs doing today? ✓' });
    } else if (hour >= 12 && hour < 14) {
      suggestions.push({ app: 'meals', reason: 'Plan lunch 🥗' });
    } else if (hour >= 14 && hour < 17) {
      suggestions.push({ app: 'zen', reason: 'Afternoon reset 🧘' });
    } else if (hour >= 17 && hour < 20) {
      suggestions.push({ app: 'habit', reason: 'Evening routine check 🔥' });
    } else if (hour >= 20 && hour < 23) {
      suggestions.push({ app: 'sleep', reason: 'Plan tomorrow\'s wake time 😴' });
      suggestions.push({ app: 'journal', reason: 'Reflect on your day 📓' });
    } else {
      suggestions.push({ app: 'white-noise', reason: 'Wind down 🌊' });
    }

    return suggestions;
  }

  // Easter egg responses
  getEasterEgg(input) {
    const eggs = {
      'help': { type: 'message', text: 'I\'m here! Want me to find an app for you? 🎯', animate: true },
      'hello': { type: 'message', text: 'Hi! I\'m PHOS. What are you looking for? ✨', animate: true },
      'wow': { type: 'effect', effect: 'sparkle', text: '🌟 WOW indeed!' },
      'thanks': { type: 'message', text: 'You\'re welcome! I\'m always here. 💙', animate: true },
      'bored': { type: 'suggestions', apps: ['pet', 'fish', 'quote', 'dice'] },
      'tired': { type: 'suggestions', apps: ['sleep', 'zen', 'white-noise', 'stims'] },
      'stressed': { type: 'suggestions', apps: ['zen', 'stims', 'white-noise'] },
      'happy': { type: 'effect', effect: 'confetti', text: '🎉 That\'s wonderful!' }
    };

    const key = input.toLowerCase().trim();
    return eggs[key] || null;
  }
}

// Particle system for visual effects
class ParticleSystem {
  constructor(container) {
    this.container = container;
    this.particles = [];
  }

  burst(x, y, count = 20, color = '#22d3ee') {
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: ${4 + Math.random() * 4}px;
        height: ${4 + Math.random() * 4}px;
        background: ${color};
        border-radius: 50%;
        pointer-events: none;
        z-index: 10000;
        opacity: 1;
      `;
      
      const angle = (Math.PI * 2 * i) / count;
      const velocity = 50 + Math.random() * 100;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;
      
      this.container.appendChild(particle);
      
      particle.animate([
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${vx}px, ${vy}px) scale(0)`, opacity: 0 }
      ], {
        duration: 600 + Math.random() * 400,
        easing: 'cubic-bezier(0, .9, .57, 1)'
      }).then(() => particle.remove());
    }
  }

  sparkle(element) {
    const rect = element.getBoundingClientRect();
    const colors = ['#22d3ee', '#fbbf24', '#34d399', '#fb7185'];
    
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        const x = rect.left + Math.random() * rect.width;
        const y = rect.top + Math.random() * rect.height;
        this.burst(x, y, 5, colors[Math.floor(Math.random() * colors.length)]);
      }, i * 50);
    }
  }
}

// Export for use
window.PhosOracle = PhosOracle;
window.PhosParticleSystem = ParticleSystem;

// Auto-initialize if PHOS guide exists
if (window.p31PhosGuide) {
  window.p31PhosOracle = new PhosOracle();
  console.log('[PHOS] Oracle engine loaded ✨');
}
