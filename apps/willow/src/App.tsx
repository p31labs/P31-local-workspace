import { useState, useEffect } from 'react';
import Companion from './components/Companion';
import VoiceScreen from './components/VoiceScreen';
import DrawScreen from './components/DrawScreen';
import MoodTracker from './components/MoodTracker';
import { K4Hero } from '@p31/ui/K4Hero';
import '@p31/ui/k4-hero.css';
import FamilyScreen from './components/FamilyScreen';
import { UIGWillowWrapper } from './components/UIGWillowWrapper';

const HUB_ORIGINS = ['https://p31ca.org', 'https://phos.p31ca.org', 'https://willow.p31ca.org'];

const postToHub = (message: Record<string, unknown>, targetOrigin?: string) => {
  const origin = targetOrigin || window.location.origin;
  try {
    window.parent.postMessage(message, origin);
  } catch {
    // silently ignore
  }
};

const listenToHub = (callback: (msg: Record<string, unknown>) => void) => {
  const handler = (event: MessageEvent) => {
    if (!HUB_ORIGINS.includes(event.origin)) return;
    if (event.data && typeof event.data === 'object' && 'type' in event.data) {
      callback(event.data as Record<string, unknown>);
    }
  };
  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
};

type Panel = 'voice' | 'draw' | 'magic' | 'feelings' | 'family' | null;

const THEME_MAP: Record<number, string> = {
  0: 'crisis', 1: 'sanctuary', 2: 'sanctuary', 3: 'bridge', 4: 'quantum', 5: 'quantum',
};

export default function App() {
  const [activePanel, setActivePanel] = useState<Panel>(null);
  const [showCompanion, setShowCompanion] = useState(false);
  const [spoons, setSpoons] = useState(() => parseInt(localStorage.getItem('p31:spoons') || '3', 10));

  useEffect(() => {
    const html = document.documentElement;
    const currentSpoons = parseInt(html.getAttribute('data-spoons') || '3', 10);
    setSpoons(currentSpoons);
    postToHub({
      type: 'PRESENCE_PING',
      source: 'WILLOW',
      payload: { status: 'active', version: '1.0.0' },
      timestamp: Date.now(),
    });

    const unsubscribe = listenToHub((msg) => {
      if (msg.type === 'SETTINGS_UPDATE' && msg.source === 'PHOS') {
        const { theme, spoonLevel } = msg.payload as Record<string, unknown>;
        if (theme) (document.documentElement as HTMLElement).setAttribute('data-theme', theme as string);
        if (spoonLevel) (document.documentElement as HTMLElement).setAttribute('data-spoon', String(spoonLevel));
      }
    });

    return unsubscribe();
  }, []);

  const openPanel = (panel: Panel) => {
    setActivePanel(panel);
    postToHub({
      type: 'SURFACE_CHANGE',
      source: 'WILLOW',
      payload: { panel },
      timestamp: Date.now(),
    });
  };

  const handleCrisisExit = () => {
    setSpoons(3);
    document.documentElement.setAttribute('data-spoons', '3');
    document.documentElement.setAttribute('data-theme', THEME_MAP[3] || 'quantum');
    localStorage.setItem('p31:spoons', '3');
  };

  return (
    <UIGWillowWrapper spoons={spoons} onCrisisExit={handleCrisisExit}>
      <a href="#main-content" style={{ position: 'fixed', top: '-100%', left: 0, zIndex: 9999, padding: '0.75rem 1.5rem', background: '#0ff', color: '#000', fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none', borderRadius: '0 0 8px 0' }} onFocus={(e) => { (e.target as HTMLElement).style.top = '0'; }} onBlur={(e) => { (e.target as HTMLElement).style.top = '-100%'; }}>Skip to main content</a>
      <div className="app">
        <header className="app-header">
          <K4Hero />
          <h1>Willow</h1>
          <p>Tap to play</p>
        </header>

        <div className="spoon-controls">
          {[0, 2, 3, 5].map(level => (
            <button
              key={level}
              onClick={() => {
                setSpoons(level);
                document.documentElement.setAttribute('data-spoons', String(level));
                document.documentElement.setAttribute('data-theme', THEME_MAP[level] || 'quantum');
                localStorage.setItem('p31:spoons', String(level));
              }}
              className="spoon-btn"
              aria-label={`Set spoons to ${level}`}
            >
              {level}
            </button>
          ))}
        </div>

        <main id="main-content" className="activity-grid">
          <button onClick={() => openPanel('voice')} aria-label="voice">Voice</button>
          <button onClick={() => openPanel('draw')} aria-label="draw">Draw</button>
          <button onClick={() => openPanel('magic')} aria-label="magic">Magic</button>
          <button onClick={() => openPanel('feelings')} aria-label="feelings">Feelings</button>
          <button onClick={() => openPanel('family')} aria-label="family">Family</button>
        </main>

        <button
          className="companion-fab"
          onClick={() => setShowCompanion(!showCompanion)}
          aria-label="open chat companion"
        >
          Companion
        </button>

        {showCompanion && <Companion onClose={() => setShowCompanion(false)} />}

        {activePanel === 'voice' && <VoiceScreen onBack={() => openPanel(null)} />}
        {activePanel === 'draw' && <DrawScreen onBack={() => openPanel(null)} />}
        {activePanel === 'feelings' && <MoodTracker onBack={() => openPanel(null)} />}
        {activePanel === 'family' && <FamilyScreen onBack={() => openPanel(null)} />}

        <footer>
          <span>P31 Labs</span>
        </footer>
      </div>
    </UIGWillowWrapper>
  );
}
