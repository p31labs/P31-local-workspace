/**
 * @file ChipBar — Pre-cognitive action chips for PHOS conversational shell.
 *
 * Research-backed pattern: action chips ABOVE the input bar eliminate
 * blank-page paralysis (the #1 UX failure in conversational interfaces).
 * Limited to 5 chips max (W3C Cognitive Accessibility guidance).
 *
 * Uses P31-Q tokens from quantum-design-system.css.
 */

import { type CSSProperties } from 'react';

export interface Chip {
  label: string;
  action: string;
  icon?: string;
}

export interface ChipBarProps {
  chips: Chip[];
  onChipClick: (action: string) => void;
  disabled?: boolean;
}

const CHIP_STYLE: CSSProperties = {
  minHeight: 'var(--p31-scale-2xl)',      /* 50px — exceeds WCAG 2.5.5 (44px) */
  minWidth: 'var(--p31-scale-2xl)',
  padding: 'var(--p31-space-sm) var(--p31-space-md)',
  borderRadius: 'var(--p31-radius-full)',
  background: 'var(--p31-surface-card)',
  border: '1px solid var(--p31-surface-border)',
  color: 'var(--p31-text-primary)',
  fontSize: 'var(--p31-type-body)',
  fontWeight: 'var(--p31-weight-medium)',
  fontFamily: 'var(--p31-font-sans)',
  cursor: 'pointer',
  transition: 'all var(--p31-duration-normal) var(--p31-easing-smooth)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--p31-space-xs)',
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

export function ChipBar({ chips, onChipClick, disabled = false }: ChipBarProps) {
  if (!chips.length) return null;

  return (
    <div
      role="group"
      aria-label="Quick actions"
      data-mcp-tool="chipBar"
      data-mcp-target="quick-actions"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--p31-space-sm)',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      {chips.map((chip) => (
        <button
          key={chip.action}
          type="button"
          data-action={chip.action}
          data-mcp-tool="quickChip"
          data-mcp-type="action"
          data-mcp-target={`chip-${chip.action}`}
          onClick={() => onChipClick(chip.action)}
          disabled={disabled}
          aria-label={`${chip.label} — quick action`}
          style={CHIP_STYLE}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--p31-color-amber)';
            e.currentTarget.style.background = 'oklch(65% 0.18 15 / 0.12)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--p31-surface-border)';
            e.currentTarget.style.background = 'var(--p31-surface-card)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--p31-color-amber)';
            e.currentTarget.style.boxShadow = '0 0 0 2px oklch(65% 0.18 15 / 0.3)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--p31-surface-border)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {chip.icon && (
            <span
              aria-hidden="true"
              style={{
                fontSize: 'var(--p31-type-h2)',
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              {chip.icon}
            </span>
          )}
          <span>{chip.label}</span>
        </button>
      ))}
    </div>
  );
}
