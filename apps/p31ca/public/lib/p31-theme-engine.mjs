/**
 * P31 Theme Engine v2.0
 * Smart theming with adaptive contrast, fluid transitions, and context-aware modes
 * Schema: p31.themeEngine/2.0.0
 */

export const P31_THEMES = {
  // Core hub theme - dark, technical
  hub: {
    id: 'hub',
    label: 'Hub',
    description: 'Technical dark - the default p31ca experience',
    scheme: 'dark',
    colors: {
      void: '#0f1115',
      surface: '#161920',
      surface2: '#1c2028',
      surface3: '#232830',
      cloud: '#d8d6d0',
      paper: '#f4f4f5',
      ink: '#1e293b',
      muted: '#6b7280',
      coral: '#cc6247',
      teal: '#25897d',
      cyan: '#4db8a8',
      butter: '#cda852',
      lavender: '#8b7cc9',
      phosphorus: '#3ba372',
      phosphor: '#00FF88'
    },
    emphasis: { primary: 'teal', secondary: 'coral', accent: 'phosphor' }
  },

  // Org theme - light, public-facing
  org: {
    id: 'org',
    label: 'Org',
    description: 'Public light - warm paper field',
    scheme: 'light',
    colors: {
      void: '#f5f4f0',
      surface: '#ffffff',
      surface2: '#ebeae4',
      surface3: '#e5e4dc',
      cloud: '#1e293b',
      paper: '#fdfcfa',
      ink: '#0f172a',
      muted: '#64748b',
      coral: '#cc6247',
      teal: '#25897d',
      cyan: '#4db8a8',
      butter: '#cda852',
      lavender: '#8b7cc9',
      phosphorus: '#3ba372',
      phosphor: '#00d46a'
    },
    emphasis: { primary: 'coral', secondary: 'teal', accent: 'phosphorus' }
  },

  // Midnight - deep focus mode
  midnight: {
    id: 'midnight',
    label: 'Midnight',
    description: 'Deep focus - minimal, reduced blue',
    scheme: 'dark',
    colors: {
      void: '#0a0c0f',
      surface: '#0f1215',
      surface2: '#15181c',
      surface3: '#1a1e24',
      cloud: '#b8b5ae',
      paper: '#e8e6e1',
      ink: '#1a1d21',
      muted: '#5a5f66',
      coral: '#b85c44',
      teal: '#1f756a',
      cyan: '#3da898',
      butter: '#b89a48',
      lavender: '#7a6db8',
      phosphorus: '#2d8a5e',
      phosphor: '#00cc6a'
    },
    emphasis: { primary: 'cyan', secondary: 'lavender', accent: 'phosphor' }
  },

  // Genesis - high-energy creative
  genesis: {
    id: 'genesis',
    label: 'Genesis',
    description: 'Creative mode - vibrant, playful',
    scheme: 'dark',
    colors: {
      void: '#0d0f12',
      surface: '#12151a',
      surface2: '#1a1f27',
      surface3: '#222935',
      cloud: '#e0ddd5',
      paper: '#f5f3ef',
      ink: '#1e2126',
      muted: '#6b7079',
      coral: '#ff7a5c',
      teal: '#2dbfa3',
      cyan: '#5dffe8',
      butter: '#ffd76f',
      lavender: '#a88fff',
      phosphorus: '#4dff9e',
      phosphor: '#00ffaa'
    },
    emphasis: { primary: 'coral', secondary: 'cyan', accent: 'phosphor' }
  },

  // Paper - reading, accessibility
  paper: {
    id: 'paper',
    label: 'Paper',
    description: 'Reading mode - high contrast, warm',
    scheme: 'light',
    colors: {
      void: '#faf8f3',
      surface: '#ffffff',
      surface2: '#f5f2eb',
      surface3: '#ebe7de',
      cloud: '#0f1115',
      paper: '#fffefd',
      ink: '#0a0a0a',
      muted: '#555555',
      coral: '#c45a3d',
      teal: '#1a6b5f',
      cyan: '#3a9e8f',
      butter: '#b8933f',
      lavender: '#6b5b99',
      phosphorus: '#2a8a5a',
      phosphor: '#009950'
    },
    emphasis: { primary: 'ink', secondary: 'coral', accent: 'teal' }
  },

  // Matrix - retro terminal
  matrix: {
    id: 'matrix',
    label: 'Matrix',
    description: 'Terminal vibes - green on black',
    scheme: 'dark',
    colors: {
      void: '#000000',
      surface: '#0a0f0a',
      surface2: '#141f14',
      surface3: '#1e2f1e',
      cloud: '#a0c0a0',
      paper: '#d0f0d0',
      ink: '#0a0f0a',
      muted: '#405040',
      coral: '#ff6b6b',
      teal: '#00ff88',
      cyan: '#00ffaa',
      butter: '#ffff00',
      lavender: '#ff88ff',
      phosphorus: '#00ff00',
      phosphor: '#00ff41'
    },
    emphasis: { primary: 'phosphorus', secondary: 'cyan', accent: 'phosphor' }
  }
};

// Adaptive modes that modify any theme
export const P31_MODES = {
  default: { contrast: 1, saturation: 1, warmth: 0 },
  focus: { contrast: 1.1, saturation: 0.9, warmth: -5 },
  calm: { contrast: 0.95, saturation: 0.85, warmth: 10 },
  vibrant: { contrast: 1.05, saturation: 1.15, warmth: 0 },
  muted: { contrast: 0.9, saturation: 0.7, warmth: 5 }
};

// Fluid animation timings
export const P31_FLUID = {
  instant: '100ms',
  quick: '150ms',
  smooth: '300ms',
  flowing: '500ms',
  cinematic: '800ms',
  ambient: '1200ms',
  
  easing: {
    linear: 'linear',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    anticipate: 'cubic-bezier(0.2, 0, 0, 1)',
    settle: 'cubic-bezier(0, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    fluid: 'cubic-bezier(0.23, 1, 0.32, 1)',
    snap: 'cubic-bezier(0.77, 0, 0.175, 1)'
  }
};

export class P31ThemeController {
  constructor(options = {}) {
    this.storageKey = options.storageKey || 'p31.theme.v2';
    this.defaultTheme = options.defaultTheme || 'hub';
    this.defaultMode = options.defaultMode || 'default';
    this.autoSync = options.autoSync !== false;
    this.listeners = new Set();
    
    this.state = this.loadState();
    this.init();
  }

  loadState() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return { ...this.getDefaultState(), ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('P31Theme: Could not load saved state');
    }
    return this.getDefaultState();
  }

  getDefaultState() {
    return {
      theme: this.defaultTheme,
      mode: this.defaultMode,
      appearance: 'auto', // auto, light, dark
      accent: null, // override theme accent
      custom: {} // user customizations
    };
  }

  saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {
      console.warn('P31Theme: Could not save state');
    }
  }

  init() {
    if (typeof document !== 'undefined') {
      this.apply();
      this.setupSystemPreferenceListener();
      this.setupReducedMotionListener();
    }
  }

  setupSystemPreferenceListener() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      if (this.state.appearance === 'auto') {
        this.apply();
      }
    });
  }

  setupReducedMotionListener() {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', () => this.apply());
  }

  getEffectiveTheme() {
    let themeId = this.state.theme;
    
    // Handle auto appearance
    if (this.state.appearance === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const currentTheme = P31_THEMES[themeId];
      
      // If current theme doesn't match system preference, find one that does
      if (currentTheme && currentTheme.scheme !== (prefersDark ? 'dark' : 'light')) {
        // Find best matching theme
        const alternatives = Object.values(P31_THEMES).filter(t => 
          t.scheme === (prefersDark ? 'dark' : 'light')
        );
        if (alternatives.length > 0) {
          return alternatives[0];
        }
      }
    }
    
    return P31_THEMES[themeId] || P31_THEMES[this.defaultTheme];
  }

  getModeAdjustments() {
    return P31_MODES[this.state.mode] || P31_MODES.default;
  }

  apply() {
    const theme = this.getEffectiveTheme();
    const mode = this.getModeAdjustments();
    const root = document.documentElement;
    
    // Apply theme colors with mode adjustments
    Object.entries(theme.colors).forEach(([key, hex]) => {
      const adjusted = this.adjustColor(hex, mode);
      root.style.setProperty(`--p31-${key}`, adjusted);
    });

    // Set theme metadata
    root.setAttribute('data-p31-theme', theme.id);
    root.setAttribute('data-p31-scheme', theme.scheme);
    root.setAttribute('data-p31-mode', this.state.mode);
    
    // Apply emphasis colors
    if (theme.emphasis) {
      Object.entries(theme.emphasis).forEach(([role, colorKey]) => {
        const hex = theme.colors[colorKey];
        const adjusted = this.adjustColor(hex, mode);
        root.style.setProperty(`--p31-${role}`, adjusted);
      });
    }

    // Handle custom accent override
    if (this.state.accent) {
      root.style.setProperty('--p31-accent', this.state.accent);
    }

    // Apply reduced motion preference
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.setAttribute('data-p31-motion', reducedMotion ? 'reduced' : 'full');

    // Sync to storage
    if (this.autoSync) {
      this.saveState();
    }

    // Notify listeners
    this.notifyListeners();

    return this;
  }

  adjustColor(hex, mode) {
    if (!hex || mode.contrast === 1 && mode.saturation === 1 && mode.warmth === 0) {
      return hex;
    }

    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;

    // Apply saturation
    if (mode.saturation !== 1) {
      const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
      hsl.s = Math.max(0, Math.min(1, hsl.s * mode.saturation));
      const adjusted = this.hslToRgb(hsl.h, hsl.s, hsl.l);
      rgb.r = adjusted.r;
      rgb.g = adjusted.g;
      rgb.b = adjusted.b;
    }

    // Apply warmth (shift toward orange/blue)
    if (mode.warmth !== 0) {
      rgb.r = Math.max(0, Math.min(255, rgb.r + mode.warmth * 2));
      rgb.b = Math.max(0, Math.min(255, rgb.b - mode.warmth * 2));
    }

    // Apply contrast
    if (mode.contrast !== 1) {
      const factor = mode.contrast;
      rgb.r = Math.max(0, Math.min(255, ((rgb.r / 255 - 0.5) * factor + 0.5) * 255));
      rgb.g = Math.max(0, Math.min(255, ((rgb.g / 255 - 0.5) * factor + 0.5) * 255));
      rgb.b = Math.max(0, Math.min(255, ((rgb.b / 255 - 0.5) * factor + 0.5) * 255));
    }

    return this.rgbToHex(Math.round(rgb.r), Math.round(rgb.g), Math.round(rgb.b));
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h, s, l };
  }

  hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  // Public API
  setTheme(themeId) {
    if (P31_THEMES[themeId]) {
      this.state.theme = themeId;
      this.apply();
    }
    return this;
  }

  setMode(modeId) {
    if (P31_MODES[modeId]) {
      this.state.mode = modeId;
      this.apply();
    }
    return this;
  }

  setAppearance(appearance) {
    if (['auto', 'light', 'dark'].includes(appearance)) {
      this.state.appearance = appearance;
      this.apply();
    }
    return this;
  }

  setAccent(color) {
    this.state.accent = color;
    this.apply();
    return this;
  }

  cycleTheme() {
    const themes = Object.keys(P31_THEMES);
    const currentIndex = themes.indexOf(this.state.theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    return this.setTheme(themes[nextIndex]);
  }

  cycleMode() {
    const modes = Object.keys(P31_MODES);
    const currentIndex = modes.indexOf(this.state.mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    return this.setMode(modes[nextIndex]);
  }

  // Event system
  onChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    const theme = this.getEffectiveTheme();
    this.listeners.forEach(cb => cb({
      theme: theme,
      mode: this.state.mode,
      state: this.state
    }));
  }

  // Utilities
  getThemeList() {
    return Object.values(P31_THEMES).map(t => ({
      id: t.id,
      label: t.label,
      description: t.description,
      scheme: t.scheme
    }));
  }

  getModeList() {
    return Object.entries(P31_MODES).map(([id, mode]) => ({
      id,
      label: id.charAt(0).toUpperCase() + id.slice(1),
      ...mode
    }));
  }

  getCurrentState() {
    return {
      ...this.state,
      effectiveTheme: this.getEffectiveTheme()
    };
  }
}

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
  window.p31Theme = new P31ThemeController();
  
  // Make available for console debugging
  window.P31ThemeController = P31ThemeController;
  window.P31_THEMES = P31_THEMES;
  window.P31_MODES = P31_MODES;
  window.P31_FLUID = P31_FLUID;
}

export default P31ThemeController;
