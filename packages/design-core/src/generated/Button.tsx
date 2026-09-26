/**
 * @file Button — Primary action button.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export function Button({ children, variant = 'primary', disabled, onClick, type = 'button', className }: ButtonProps) {
  const variantCls = {
    primary: 'bg-accent text-void hover:bg-accent/90 shadow-[0_0_12px_color-mix(in_oklch,var(--p31-accent)_40%,transparent)] focus-visible:ring-accent',
    secondary: 'bg-void-raised/80 border border-white/10 text-text hover:border-white/20 focus-visible:ring-violet',
    ghost: 'bg-transparent text-text-secondary hover:text-text hover:bg-white/5 focus-visible:ring-white/20',
  };
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${variantCls[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className || ''}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default Button;
