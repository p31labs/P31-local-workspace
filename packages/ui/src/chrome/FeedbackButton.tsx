/**
 * @file FeedbackButton — Floating feedback launcher for PHOS + WILLOW.
 * Opens Discord invite in a new tab. No PII collected.
 */

import { useState } from 'react';

export function FeedbackButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Send feedback"
        className="ui-chrome fixed bottom-[88px] right-4 z-[55] w-10 h-10 rounded-full flex items-center justify-center border border-white/[0.08] bg-void/80 backdrop-blur-xl text-mist hover:text-ink hover:border-quantum-cyan/40 transition-all text-sm shadow-lg"
      >
        💬
      </button>
      {open && (
        <div
          className="ui-chrome fixed bottom-[138px] right-4 z-[56] w-64 rounded-xl border border-white/10 bg-void/95 backdrop-blur-xl p-4 text-ink font-body shadow-lg"
          style={{ boxShadow: '0 0 30px rgba(0,240,255,0.1)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-quantum-cyan">Feedback</span>
            <button onClick={() => setOpen(false)} className="text-mist hover:text-ink text-xs">✕</button>
          </div>
          <p className="text-xs text-cloud/60 mb-4 leading-relaxed">
            We read every message. No tracking. No analytics. Just real humans.
          </p>
          <a
            href="https://discord.gg/uYW5rTCuZ"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-2.5 rounded-lg border border-quantum-violet/30 bg-quantum-violet/10 text-quantum-violet text-sm font-semibold hover:bg-quantum-violet/20 transition-colors mb-2"
            style={{ textDecoration: 'none' }}
          >
            Join Discord
          </a>
          <a
            href="https://github.com/p31labs/P31-local-workspace/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-2.5 rounded-lg border border-white/10 bg-white/5 text-cloud/60 text-xs hover:text-ink transition-colors"
            style={{ textDecoration: 'none' }}
          >
            Open GitHub Issue
          </a>
        </div>
      )}
    </>
  );
}

export default FeedbackButton;
