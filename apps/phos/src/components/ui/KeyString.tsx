import React, { useState } from 'react';

interface KeyStringProps {
  code: string;
  label?: string;
  truncate?: boolean;
  maxLength?: number;
  className?: string;
}

/**
 * KeyString — cryptographic key display (monospace, copyable).
 * Truncates long keys with expand toggle.
 */
export function KeyString({
  code,
  label,
  truncate = true,
  maxLength = 16,
  className = '',
}: KeyStringProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isTruncated = truncate && code.length > maxLength && !expanded;
  const displayCode = isTruncated ? `${code.slice(0, maxLength)}…` : code;

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
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <span className="text-[12px] uppercase tracking-[0.05em] text-white/40 font-sans">
          {label}
        </span>
      )}
      <div className="flex items-center gap-2">
        <code className="font-mono text-[13px] leading-relaxed text-quantum-cyan break-all">
          {displayCode}
        </code>
        <button
          onClick={handleCopy}
          className="shrink-0 text-[10px] text-white/30 hover:text-white/60 transition-colors"
          aria-label="Copy key"
        >
          {copied ? '✓' : '⎘'}
        </button>
      </div>
      {truncate && code.length > maxLength && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] text-white/30 hover:text-white/50 transition-colors text-left"
          aria-expanded={expanded}
        >
          {expanded ? 'Collapse' : 'Show full'}
        </button>
      )}
    </div>
  );
}
