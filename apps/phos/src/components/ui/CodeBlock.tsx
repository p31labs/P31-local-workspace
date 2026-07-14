import React, { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  className?: string;
}

/**
 * CodeBlock — syntax-highlighted code with copy button.
 * Void background, JetBrains Mono, radius 12px.
 */
export function CodeBlock({
  code,
  language,
  showLineNumbers = false,
  className = '',
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const lines = code.split('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <div
      className={`
        relative bg-[#0A0A0F] border border-white/10 rounded-[12px] p-4
        font-mono text-[13px] leading-relaxed text-white/80 overflow-x-auto
        ${className}
      `}
    >
      {/* Language tag */}
      {language && (
        <span className="absolute top-2 right-12 text-[10px] uppercase tracking-wider text-white/20">
          {language}
        </span>
      )}

      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-3 text-[10px] text-white/30 hover:text-white/60 transition-colors"
        aria-label="Copy code"
      >
        {copied ? '✓' : '⎘'}
      </button>

      {/* Code content */}
      <pre className="m-0">
        <code>
          {lines.map((line, i) => (
            <div key={i} className="flex">
              {showLineNumbers && (
                <span className="w-8 shrink-0 text-right pr-4 text-white/20 select-none">
                  {i + 1}
                </span>
              )}
              <span>{line}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
