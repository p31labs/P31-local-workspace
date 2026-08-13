import { useState } from 'react';
import { useDatasetStore } from '../store/datasetStore';

const ONBOARDING_KEY = 'spaceship-earth:onboarded:v1';

const STEPS = [
  'Your data stays on your device only. Nothing is uploaded to a server. No profiling, no cloud sync, no third-party access.',
  'If you enable gaze tracking, your webcam feed is processed locally via MediaPipe and never leaves your device. You can disable it at any time.',
  'Upload a CSV/JSON file — or paste a public data URL. You control what data enters the dome.',
  'Activate the face layer on your dataset to paint the dome.',
  'Watch the dome light up with your data.',
];

export default function Onboarding() {
  const [dismissed, setDismissed] = useState(false);
  const datasetCount = useDatasetStore((s) => s.datasets.length);

  if (typeof localStorage === 'undefined') return null;

  let onboarded = false;
  try {
    onboarded = localStorage.getItem(ONBOARDING_KEY) !== null;
  } catch {
    onboarded = false;
  }
  if (onboarded) return null;

  if (datasetCount > 0) {
    try {
      localStorage.setItem(ONBOARDING_KEY, '1');
    } catch {
      /* ignore storage failures */
    }
    return null;
  }

  if (dismissed) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, '1');
    } catch {
      /* ignore storage failures */
    }
    setDismissed(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Onboarding"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(5,7,10,0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 420,
          maxWidth: '90vw',
          background: 'rgba(6,10,18,0.96)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          padding: 24,
          fontFamily: "'JetBrains Mono', monospace",
          color: '#e0e4ec',
        }}
      >
        <div style={{ color: '#22d3ee', fontSize: 18, fontWeight: 700, marginBottom: 18 }}>
          ✦ Paint the Dome
        </div>

        <div style={{ fontSize: 11, color: '#8fae83', marginBottom: 14, lineHeight: 1.5 }}>
          All data stays local. Gaze tracking is optional and never uploads. You are in control.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 22 }}>
          {STEPS.map((step, i) => (
            <div
              key={step}
              style={{ display: 'flex', gap: 10, alignItems: 'baseline', fontSize: 12 }}
            >
              <span style={{ color: '#22d3ee', fontWeight: 700, flexShrink: 0 }}>
                {i + 1}.
              </span>
              <span>{step}</span>
            </div>
          ))}
        </div>

        <button
          onClick={dismiss}
          style={{
            background: '#22d3ee',
            color: '#05070a',
            fontWeight: 700,
            borderRadius: 8,
            padding: '8px 16px',
            cursor: 'pointer',
            border: 'none',
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
