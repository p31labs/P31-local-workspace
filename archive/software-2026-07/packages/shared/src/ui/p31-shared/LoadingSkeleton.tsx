import * as React from 'react';
import { cn } from './utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'text', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'animate-skeleton-pulse bg-hub-surface2',
          variant === 'text' && 'h-4 w-full rounded',
          variant === 'circular' && 'h-10 w-10 rounded-full',
          variant === 'rectangular' && 'h-24 w-full rounded-lg',
          className
        )}
        {...props}
      />
    );
  }
);
Skeleton.displayName = 'Skeleton';

export interface SkeletonCardProps {
  lines?: number;
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ lines = 3, className }) => (
  <div className={cn('rounded-lg border border-hub-cloud/10 bg-hub-surface p-6 space-y-4', className)}>
    <Skeleton variant="text" className="w-2/3 h-5" />
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} variant="text" className={i === lines - 1 ? 'w-4/5' : 'w-full'} />
    ))}
  </div>
);
SkeletonCard.displayName = 'SkeletonCard';
