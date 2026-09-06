import { createRoot } from 'react-dom/client';
import WillowApp from './App';

// Initialize skin from data-theme attribute via skin engine (loaded in index.html)
(async () => {
  try {
    const theme = document.documentElement.getAttribute('data-theme');
    if (theme && typeof (window as any).applySkin === 'function') {
      (window as any).applySkin(theme);
    }
  } catch {
    // Sovereign mode: skin engine not available, fallback to inline CSS
  }
})();

createRoot(document.getElementById('root')!).render(<WillowApp />);
