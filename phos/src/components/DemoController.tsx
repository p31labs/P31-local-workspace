import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAtmosphere } from './AtmosphereProvider';

interface DemoStage {
  surface: string;
  spoons: number;
  title: string;
  description: string;
  highlight: string;
}

const DEMO_STAGES: DemoStage[] = [
  {
    surface: 'GREETING',
    spoons: 3,
    title: 'Spoon-Aware Entry Point',
    description: 'The system recognizes cognitive load capacity in real-time. Users with limited spoons see simplified interfaces, reducing overwhelm while maintaining functionality. This is accessibility architecture.',
    highlight: 'highlight-greeting',
  },
  {
    surface: 'IGNITION',
    spoons: 4,
    title: 'Ignition Core',
    description: 'Primary interaction hub with adaptive complexity. The interface scales based on user energy levels and task demands, preventing cognitive overload during high-stakes moments.',
    highlight: 'highlight-ignition',
  },
  {
    surface: 'BONDING',
    spoons: 2,
    title: 'BONDING Chemistry Game',
    description: 'Molecular bonding activity that generates timestamped engagement logs. Every atom placed equals documented parental contact, creating objective evidence of connection.',
    highlight: 'highlight-bonding',
  },
  {
    surface: 'THE_BUFFER',
    spoons: 3,
    title: 'The Buffer - Communication Processing',
    description: 'Fawn Guard detects people-pleasing patterns. Chaos ingestion converts journal entries into structured data, supporting emotional regulation for neurodivergent users.',
    highlight: 'highlight-buffer',
  },
  {
    surface: 'VAULT',
    spoons: 5,
    title: 'The Vault - Cognitive Heritage',
    description: 'Secure storage for timestamped interactions and generated artifacts. All content is cryptographically verifiable through Genesis Block telemetry.',
    highlight: 'highlight-vault',
  },
  {
    surface: 'SETTINGS',
    spoons: 1,
    title: 'Settings & Customization',
    description: 'User-configurable parameters for spoons, surfaces, and notification thresholds. Changes persist locally and sync across devices via IndexedDB.',
    highlight: 'highlight-settings',
  },
];

export function DemoController() {
  const { setSurface, setSpoons } = useAtmosphere();
  const [stageIndex, setStageIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const stageIndexRef = useRef(stageIndex);
  stageIndexRef.current = stageIndex;

  const advanceToStage = useCallback(
    (index: number) => {
      const stage = DEMO_STAGES[index];
      if (stage) {
        setSurface(stage.surface);
        setSpoons(stage.spoons);
        setStageIndex(index);
      }
    },
    [setSurface, setSpoons],
  );

  const nextStage = useCallback(() => {
    advanceToStage((stageIndexRef.current + 1) % DEMO_STAGES.length);
  }, [advanceToStage]);

  const prevStage = useCallback(() => {
    advanceToStage(stageIndexRef.current === 0 ? DEMO_STAGES.length - 1 : stageIndexRef.current - 1);
  }, [advanceToStage]);

  useEffect(() => {
    if (!playing) return;

    const interval = setInterval(() => {
      nextStage();
    }, 4000);

    return () => clearInterval(interval);
  }, [playing, nextStage]);

  return (
    <div className="w-full max-w-lg">
      <div
        className="bg-gray-900/80 backdrop-blur-md rounded-lg px-4 py-3 border border-gray-700/50 w-full"
        style={{ fontFamily: 'monospace', fontSize: '11px', textTransform: 'uppercase' }}
      >
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => setPlaying(!playing)}
            className="w-6 h-6 flex items-center justify-center rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300"
            aria-label={playing ? 'Pause tour' : 'Play tour'}
          >
            {playing ? '⏸' : '▶'}
          </button>

          <button
            onClick={prevStage}
            className="w-6 h-6 flex items-center justify-center rounded bg-gray-700/50 hover:bg-gray-600/50 text-gray-300"
            aria-label="Previous stage"
          >
            ‹
          </button>

          <button
            onClick={nextStage}
            className="w-6 h-6 flex items-center justify-center rounded bg-gray-700/50 hover:bg-gray-600/50 text-gray-300"
            aria-label="Next stage"
          >
            ›
          </button>

          <div className="flex gap-1.5">
            {DEMO_STAGES.map((_, i) => (
              <button
                key={i}
                onClick={() => advanceToStage(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === stageIndex
                    ? 'bg-emerald-400 w-4'
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
                aria-label={`Go to stage ${i + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="text-gray-300 text-xs leading-relaxed">
          <div className="text-emerald-300 font-medium mb-1">
            {DEMO_STAGES[stageIndex].title}
          </div>
          <div className="text-gray-400 max-w-md">
            {DEMO_STAGES[stageIndex].description}
          </div>
        </div>
      </div>
    </div>
  );
}