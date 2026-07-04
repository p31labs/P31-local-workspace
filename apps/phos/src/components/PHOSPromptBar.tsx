import React, { useState, useRef, useEffect } from 'react';

interface PHOSPromptBarProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

const conflictPatterns = [
  /\byou always\b|\byou never\b|\bnever\b.*\byou\b/i,
  /\b(?!.*not)your fault\b|\bfault\b.*\byours\b/i,
  /\blie\b|\bliar\b|\blying\b/i,
  /\bcontempt\b|\bcourt\b|\bj\s*u\s*d\s*g\s*e\b|\blawyer\b|\battorney\b/i,
  /\byou don'?t understand\b|\byou don'?t care\b/i,
  /\bselfish\b|\bnarcissist\b|\bgaslight\b|\bmanipulat\w+\b/i,
  /\b(?:i'?ll|i will)\s*(?:never|always)\b.*\byou\b/i,
  /\b(?:fuck|shit|bastard|asshole|bitch)\b/i,
  /\b(?:threaten|lawsuit|police|cps|dhr|dfs)\b/i,
];

export default function PHOSPromptBar({ onSend, disabled = false }: PHOSPromptBarProps) {
  const [input, setInput] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (input.trim()) {
      const isConflict = conflictPatterns.some(p => p.test(input));
      setShowWarning(isConflict);
    } else {
      setShowWarning(false);
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSend(input);
    setInput('');
    setShowWarning(false);
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-3">
      {showWarning && (
        <div className="phos-glass-strong rounded-2xl px-5 py-3 text-sm text-[#FFB347] text-center animate-breathe max-w-md">
          This might start an argument. Want me to soften it for you?
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className={`phos-pill w-full flex items-center px-5 py-3.5 phos-transition ${
          showWarning ? 'ring-1 ring-[#FFB347]/40' : ''
        }`}
      >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What's on your mind?"
            disabled={disabled}
            aria-label="Type your message"
            className="flex-1 bg-transparent border-none outline-none text-[var(--phos-text)] placeholder-[var(--phos-text)]/30 text-sm font-body"
          />
           <button
             type="submit"
             aria-label="Send message"
             disabled={!input.trim() || disabled}
             className="ml-2 p-3 rounded-full phos-transition disabled:opacity-20 disabled:cursor-default text-[var(--phos-accent)] hover:bg-white/5 min-w-[44px] min-h-[44px] flex items-center justify-center"
           >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
      </form>
    </div>
  );
}
