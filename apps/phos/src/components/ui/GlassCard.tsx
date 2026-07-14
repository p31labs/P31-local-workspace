import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  className?: string;
}

const paddingMap = {
  none: '',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
};

const variantMap = {
  primary: 'bg-white/[0.04] border border-white/[0.08]',
  secondary: 'bg-white/[0.06] border border-white/[0.12]',
  ghost: 'bg-transparent border border-transparent',
};

/**
 * GlassCard — elevated glass-morphism surface container.
 * All elevated surfaces must use this component.
 */
export function GlassCard({
  children,
  variant = 'primary',
  padding = 'lg',
  rounded = 'lg',
  hover = true,
  className = '',
}: GlassCardProps) {
  const radiusMap = { sm: 'rounded-[8px]', md: 'rounded-[12px]', lg: 'rounded-[24px]' };

  return (
    <div
      className={`
        backdrop-blur-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.15)]
        transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${variantMap[variant]} ${paddingMap[padding]} ${radiusMap[rounded]}
        ${hover ? 'hover:border-white/[0.15] hover:bg-white/[0.06] hover:-translate-y-0.5 hover:shadow-[0_12px_48px_rgba(0,0,0,0.25)]' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
