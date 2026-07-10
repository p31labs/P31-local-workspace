import React from 'react';
import { COLORS } from '../lib/arcade-core/theme';
import { useSpoonStore } from '../lib/arcade-core/spoonStore';
import { generateInterface } from '@p31/interface-generator';
import type { InterfaceDescription } from '@p31/interface-generator';

const DIFFICULTY_LABELS = ['Calm', 'Gentle', 'Balanced', 'Focused', 'Intense'];

function toUig(level: number, max = 12): number {
  return Math.max(0, Math.min(5, Math.round((level / max) * 5)));
}

// Adaptive arcade control panel driven by the Universal Interface Generator.
// Replaces hardcoded difficulty/session sliders: options and granularity scale
// with the player's spoon level; crisis mode (spoons 0) shows rest only.
export default function UIGArcadeControls() {
  const store = useSpoonStore();
  const level = store.level;
  const spoons = toUig(level);

  const viewData = { high_score: 1240, difficulty: spoons, session_length: 10 };
  const description: InterfaceDescription = generateInterface({
    passport: null,
    viewData,
    role: 'coordinator',
    spoons,
  });

  if (description.crisisMode) {
    return (
      <div className="uig-crisis flex items-center justify-center p-6" style={{ color: COLORS.teal }}>
        <div className="text-center">
          <div className="text-lg">Emergency Rest</div>
          <div className="text-xs opacity-60 mt-1">Press Escape when ready.</div>
        </div>
      </div>
    );
  }

  const difficultyIndex = Math.min(4, Math.max(0, spoons));
  // Low spoons → fewer, simpler options (COGA: reduce choice under load).
  const options = spoons <= 2 ? DIFFICULTY_LABELS.slice(0, 3) : DIFFICULTY_LABELS;
  const step = spoons <= 2 ? 5 : 1;

  return (
    <div
      className="uig-arcade-controls p-4 rounded-2xl"
      style={{ border: `1px solid ${COLORS.tealDim}`, background: 'rgba(77,184,168,0.06)' }}
    >
      <div className="text-[10px] uppercase tracking-widest opacity-60 mb-3">
        Adaptive · spoons {spoons} · {description.layout}
      </div>

      <label className="block text-sm mb-1" style={{ color: COLORS.teal }}>Difficulty</label>
      <div className="flex flex-wrap gap-2 mb-4">
        {options.map((opt, i) => (
          <button
            key={opt}
            type="button"
            className="px-3 py-1 rounded-full text-xs"
            style={{
              border: `1px solid ${COLORS.tealDim}`,
              background: i === difficultyIndex ? COLORS.teal : 'transparent',
              color: i === difficultyIndex ? COLORS.void : COLORS.teal,
            }}
          >
            {opt}
          </button>
        ))}
      </div>

      <label className="block text-sm mb-1" style={{ color: COLORS.teal }}>Session length</label>
      <input
        type="range"
        min={5}
        max={30}
        step={step}
        defaultValue={10}
        className="w-full"
        style={{ accentColor: COLORS.teal }}
      />

      <div className="mt-3 text-sm opacity-80">
        High score: <span style={{ color: COLORS.teal }}>{viewData.high_score}</span>
      </div>
    </div>
  );
}
