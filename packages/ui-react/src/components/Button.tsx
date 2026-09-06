import React from 'react';
import type { ButtonHTMLAttributes, ReactNode, CSSProperties } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: ReactNode;
  style?: CSSProperties;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  style,
  onClick,
  ...props
}: ButtonProps) {
  const variantClass = {
    primary: 'btn btn-primary',
    secondary: 'btn btn-secondary',
    ghost: 'btn btn-ghost',
  }[variant];

  const sizeClass = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
  }[size];

  return (
    <button
      type="button"
      className={`${variantClass} ${sizeClass} ${className}`.trim()}
      disabled={disabled}
      style={style}
      onClick={onClick as any}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
