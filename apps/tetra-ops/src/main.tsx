import React from 'react';
import { createRoot } from 'react-dom/client';
import '@p31/design-core/css/all.css';
import './styles/app.css';
import { App } from './App';
import { applySkin, getCurrentSkin } from '@p31/skin-system';

// Skin init — apply saved skin from data-p31-skin (set by inline script)
const initialSkin = document.documentElement.getAttribute('data-p31-skin') || 'cipher';
applySkin(initialSkin);

// Listen for orb clicks from inline script
window.addEventListener('skin:request', ((e: CustomEvent) => {
  const skinId = e.detail?.skin;
  if (skinId && applySkin(skinId)) {
    document.documentElement.setAttribute('data-p31-skin', skinId);
    window.dispatchEvent(new CustomEvent('skin:changed', { detail: { skin: skinId } }));
  }
}) as EventListener);

// Spoon init
const raw = localStorage.getItem('p31:spoons');
const spoons = /^[0-5]$/.test(raw || '') ? (raw as string) : '3';
document.documentElement.setAttribute('data-spoons', spoons);

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
