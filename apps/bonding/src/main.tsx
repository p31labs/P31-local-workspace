import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BondingApp } from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BondingApp />
  </StrictMode>,
);
