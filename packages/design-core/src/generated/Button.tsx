/**
 * @file Button — Button component with primary, secondary, and ghost variants.
 * Auto-generated from components.yml.
 *
 * @a2ui-component Button
 * @a2ui-props label string - Button text
 * @a2ui-props variant "primary" | "secondary" | "ghost" - Visual style
 * @a2ui-props disabled boolean - Disables interaction
 * @a2ui-props action string - Action ID for click events
 * @a2ui-example {"component":"Button","label":"Submit","variant":"primary","action":"submit-form"}
 */

import type { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ children, variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 min-h-[44px] min-w-[44px]';

  const variantClasses = {
    primary: 'bg-accent text-void hover:bg-accent/90 shadow-[0_0_12px_rgba(0,240,255,0.4)] focus-visible:ring-accent',
    secondary: 'bg-void-raised/80 border border-white/10 text-text hover:border-white/20 focus-visible:ring-violet',
    ghost: 'bg-transparent text-text-secondary hover:text-text hover:bg-white/5 focus-visible:ring-white/20',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const cls = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className || ''}`;
  return <button className={cls} {...props}>{children}</button>;
}

export default Button;
