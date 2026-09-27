import { Suspense, lazy } from 'react';
import { GlassCard } from '@p31ca/ui/chrome';

const Dashboard = lazy(() => import('./components/Dashboard'));

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-void flex items-center justify-center">
      <GlassCard className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface2 rounded w-48 mx-auto" />
          <div className="h-4 bg-surface2 rounded w-32 mx-auto" />
        </div>
      </GlassCard>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-void">
      <Suspense fallback={<LoadingFallback />}>
        <Dashboard />
      </Suspense>
    </div>
  );
}
