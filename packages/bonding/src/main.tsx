import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import './index.css';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { logBirthdayConsole } from './config/easterEggs';

// Initialize Sentry for error tracking
// Set VITE_SENTRY_DSN in your environment variables
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  try {
    Sentry.init({
      dsn: sentryDsn,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      environment: import.meta.env.MODE,
      beforeSend(event) {
        // Add custom tags for Spoon/Voltage metrics if available
        // This would connect to the actual spoon store in a full implementation
        event.tags = {
          ...event.tags,
          app: 'bonding',
          environment: import.meta.env.MODE,
        };
        return event;
      },
    });
  } catch (error) {
    // Sentry initialization failed - fallback gracefully
    console.warn('[Sentry] Failed to initialize, continuing without error tracking:', error);
  }
}

logBirthdayConsole();

// Attempt portrait lock (fails silently on desktop / unsupported)
try {
  const orientation = screen.orientation as { lock?: (o: string) => Promise<void> };
  orientation.lock?.('portrait')?.catch(() => {});
} catch { /* unsupported */ }

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

