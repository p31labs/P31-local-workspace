import { useState, useEffect } from 'react';
import { Companion } from './components/Companion';
import { VoiceScreen } from './components/VoiceScreen';
import { DrawScreen } from './components/DrawScreen';
import { MoodTracker } from './components/MoodTracker';
import { FamilyScreen } from './components/FamilyScreen';

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

export default function App() {
  const [activePanel, setActivePanel] = useState<Panel>(null);
  const [showCompanion, setShowCompanion] = useState(false);

  useEffect(() => {
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

  return (
    <div className="app">
      <header className="app-header">
        <h1>Willow</h1>
        <p>Tap to play</p>
      </header>

      <main className="activity-grid">
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
  );
}
