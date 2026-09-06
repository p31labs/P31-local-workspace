/**
 * @file WillowChipBar.tsx — WILLOW voice-first action chips.
 * Pre-cognitive action bar for children: tap a chip to speak or act.
 * Placed directly above the chat input bar.
 */

import { useState } from 'react';

export interface Chip {
  label: string;
  emoji: string;
  action: () => void;
}

const DEFAULT_CHIPS: Chip[] = [
  { label: 'I\'m happy', emoji: '😊', action: () => {} },
  { label: 'I\'m sad', emoji: '😢', action: () => {} },
  { label: 'I\'m tired', emoji: '😴', action: () => {} },
  { label: 'Tell me a joke', emoji: '😂', action: () => {} },
  { label: 'I need help', emoji: '🆘', action: () => {} },
];

interface WillowChipBarProps {
  onSelect: (text: string) => void;
  chips?: Chip[];
}

export function WillowChipBar({ onSelect, chips = DEFAULT_CHIPS }: WillowChipBarProps) {
  const [pressed, setPressed] = useState<string | null>(null);

  const handleTap = (chip: Chip) => {
    setPressed(chip.label);
    onSelect(chip.label);
    setTimeout(() => setPressed(null), 600);
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 pt-1 px-1 no-scrollbar" style={{ minHeight: 64 }}>
      {chips.map((chip) => (
        <button
          key={chip.label}
          onClick={() => handleTap(chip)}
          className="shrink-0 flex items-center gap-1.5 px-4 py-3 rounded-full font-semibold transition-all duration-200 cursor-pointer"
          style={{
            minHeight: 64,
            minWidth: 64,
            background: pressed === chip.label ? 'rgba(52,211,153,0.25)' : 'rgba(52,211,153,0.08)',
            border: `1px solid ${pressed === chip.label ? 'rgba(52,211,153,0.5)' : 'rgba(52,211,153,0.2)'}`,
            color: pressed === chip.label ? 'var(--p31-accent)' : 'var(--p31-text-secondary)',
            transform: pressed === chip.label ? 'scale(1.05)' : 'scale(1)',
          }}
          aria-label={`Say: ${chip.label}`}
        >
          <span style={{ fontSize: 20, lineHeight: 1 }}>{chip.emoji}</span>
          <span style={{ fontSize: 13 }}>{chip.label}</span>
        </button>
      ))}
    </div>
  );
}
