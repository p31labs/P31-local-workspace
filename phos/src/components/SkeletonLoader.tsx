import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function SkeletonPulse({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse bg-white/5 rounded ${className}`} />;
}

export function SurfaceSkeleton() {
  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center gap-3 mb-2">
        <SkeletonPulse className="h-4 w-32" />
        <SkeletonPulse className="h-3 w-16 ml-auto" />
      </div>
      <SkeletonPulse className="h-6 w-3/4" />
      <SkeletonPulse className="h-4 w-full" />
      <SkeletonPulse className="h-4 w-5/6" />
      <div className="grid grid-cols-2 gap-3 mt-4">
        <SkeletonPulse className="h-20" />
        <SkeletonPulse className="h-20" />
      </div>
    </div>
  );
}

export function DemoSkeleton() {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-gray-900/80 backdrop-blur-md rounded-lg px-4 py-3 border border-gray-700/50">
        <div className="flex items-center gap-3">
          <SkeletonPulse className="h-6 w-6" />
          <SkeletonPulse className="h-6 w-20" />
        </div>
      </div>
    </div>
  );
}
