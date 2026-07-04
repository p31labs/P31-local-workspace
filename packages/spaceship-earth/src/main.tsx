import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App';
import { initTheme } from './sovereign/useSovereignStore';

// Apply persisted skin + accent before first paint
initTheme();

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
