/**
 * @file GlowButton — Shared glow-accent button (all 4 apps).
 * 5 colors, 3 sizes, 3 variants. Min 44px touch target.
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  color?: 'cyan' | 'violet' | 'gold' | 'green' | 'rose';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
}

const COLOR: Record<string, string> = {
  cyan:   'border-quantum-cyan/30 text-quantum-cyan hover:bg-quantum-cyan/10 glow-cyan',
  violet: 'border-quantum-violet/30 text-quantum-violet hover:bg-quantum-violet/10 glow-violet',
  gold:   'border-quantum-gold/30 text-quantum-gold hover:bg-quantum-gold/10 glow-gold',
  green:  'border-quantum-green/30 text-quantum-green hover:bg-quantum-green/10 glow-green',
  rose:   'border-quantum-rose/30 text-quantum-rose hover:bg-quantum-rose/10 glow-rose',
};

const SIZE: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function GlowButton({ children, color = 'cyan', size = 'md', variant = 'primary', className, ...props }: GlowButtonProps) {
  const variantClass = variant === 'secondary' ? 'bg-void-raised/40 hover:bg-void-raised/60' : variant === 'ghost' ? 'bg-transparent hover:bg-white/5' : '';
  const cls = `rounded-xl font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] min-h-[44px] min-w-[44px] ${COLOR[color]} ${SIZE[size]} ${variantClass} ${className || ''}`;
  return <button className={cls} {...props}>{children}</button>;
}

export default GlowButton;
