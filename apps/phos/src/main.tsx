import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { GreyRock } from '@p31/ui/adaptive/GreyRock';
import { useNeuroAdapter } from '@p31/ui/adaptive/NeuroAdapter';
import { PhosShell } from './components/PhosShell';
import { useWebMCP } from './hooks/useWebMCP';
import { routes } from './routes';
import './styles/globals.css';
import '@p31/ui/chrome.css';

function SurfaceSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] text-cloud/30">
      <div className="glass-panel p-8 text-center">
        <div className="w-8 h-8 border-2 border-quantum-cyan/30 border-t-quantum-cyan rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-mono">Loading surface...</p>
      </div>
    </div>
  );
}

function AdaptiveRoot({ children }: { children: React.ReactNode }) {
  useNeuroAdapter({ emitInterval: 2000 });
  useWebMCP();
  return (
    <GreyRock passport={null}>
      {children}
    </GreyRock>
  );
}

const router = createBrowserRouter(routes, {
  basename: import.meta.env.BASE_URL,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AdaptiveRoot>
      <Suspense fallback={<SurfaceSkeleton />}>
        <RouterProvider router={router} />
      </Suspense>
    </AdaptiveRoot>
  </StrictMode>,
);
