import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { trackWebVitals } from './lib/web-vitals';
import '@p31/canon/tokens.css';
import '@xyflow/react/dist/style.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Core Web Vitals — INP/LCP/CLS, measured locally, beamed to /api/loom/vitals
// if the endpoint exists. See lib/web-vitals.ts.
trackWebVitals();

// Service worker registration — secure contexts only (HTTPS or localhost).
// The worker is a pure static-asset cache; it never touches the log or any
// session state. See public/sw.js for the caching discipline.
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      // Registration failure is non-fatal — the app works without a worker.
    });
  });
}
