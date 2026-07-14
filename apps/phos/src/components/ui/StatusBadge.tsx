import React from 'react';

interface StatusBadgeProps {
  status: 'ok' | 'warning' | 'error' | 'syncing';
  label: string;
  className?: string;
}

const statusStyles = {
  ok: 'bg-quantum-green/10 text-quantum-green border-quantum-green/20',
  warning: 'bg-quantum-gold/10 text-quantum-gold border-quantum-gold/20',
  error: 'bg-quantum-red/10 text-quantum-red border-quantum-red/20',
  syncing: 'bg-quantum-cyan/10 text-quantum-cyan border-quantum-cyan/20',
};

const statusDots = {
  ok: 'bg-quantum-green',
  warning: 'bg-quantum-gold',
  error: 'bg-quantum-red',
  syncing: 'bg-quantum-cyan animate-pulse',
};

/**
 * StatusBadge — network/identity status indicator.
 * Coloured dot + label for system status displays.
 */
export function StatusBadge({ status, label, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-mono
        border rounded-full
        ${statusStyles[status]} ${className}
      `}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${statusDots[status]}`}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
