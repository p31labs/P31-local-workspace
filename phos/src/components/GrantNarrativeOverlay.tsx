import React, { useState } from 'react';

export function GrantNarrativeOverlay() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem('phos_demo_dismissed') === 'true';
    } catch {
      return false;
    }
  });
  const [demoStarted, setDemoStarted] = useState(false);

  const handleDismiss = () => {
    localStorage.setItem('phos_demo_dismissed', 'true');
    setDismissed(true);
  };

  const handleBeginDemo = () => {
    setDemoStarted(true);
    setDismissed(true);
  };

  if (dismissed) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div
        className="bg-gray-900/70 backdrop-blur-xl border border-emerald-500/30 rounded-xl p-6 max-w-lg w-full shadow-2xl"
        style={{ fontFamily: 'monospace' }}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-wider">
              PHOS-Sovereign
            </h1>
            <p className="text-cyan-300/70 text-sm mt-1">
              Cognitive Prosthetic Platform — Live Demonstration
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-200 text-lg px-2"
            aria-label="Close overlay"
          >
            ×
          </button>
        </div>

        <ul className="space-y-3 mb-6 text-gray-300 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-0.5">▸</span>
            <span>
              <strong className="text-emerald-300">Spoon-First Architecture:</strong> Real-time cognitive load awareness
              scales UI complexity, preventing overwhelm while preserving function.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400 mt-0.5">▸</span>
            <span>
              <strong className="text-cyan-300">Objective Quality Evidence:</strong> Every interaction is timestamped,
              cryptographically verifiable, and creates auditable proof of engagement.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-0.5">▸</span>
            <span>
              <strong className="text-emerald-300">Four-Node Bridge:</strong> Connects Engineers, Believers,
              Navigators, and Anchors into a delta topology for collective healing.
            </span>
          </li>
        </ul>

        <div className="flex gap-3">
          <button
            onClick={handleBeginDemo}
            className="flex-1 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 text-emerald-300 py-2 px-4 rounded-lg hover:from-emerald-500/30 hover:to-cyan-500/30 transition-all uppercase tracking-wider text-sm font-medium"
          >
            Begin Demo Tour
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 border border-gray-600/50 text-gray-400 rounded-lg hover:bg-gray-800/30 transition-all uppercase tracking-wider text-xs"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}