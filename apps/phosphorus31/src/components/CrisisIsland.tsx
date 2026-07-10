import { useEffect, useState } from 'react';
import { CrisisOverlay } from '@p31/interface-generator';

const SPOONS_KEY = 'p31:spoons';

function readSpoons(): string {
  if (typeof document === 'undefined') return '3';
  return (
    document.documentElement.getAttribute('data-spoons') ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem(SPOONS_KEY) : null) ||
    '3'
  );
}

function exitCrisis() {
  if (typeof localStorage !== 'undefined') localStorage.setItem(SPOONS_KEY, '3');
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-spoons', '3');
    document.documentElement.setAttribute('data-theme', 'quantum');
  }
}

// Minimal crisis island for the static marketing site.
// When the document root carries data-spoons="0" (or the persisted spoon
// store is 0) we render the canonical UIG breathing CrisisOverlay with an
// "I'm ready" exit affordance. Otherwise we render nothing.
export default function CrisisIsland() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const check = () => setActive(readSpoons() === '0');
    check();

    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-spoons'],
    });
    window.addEventListener('storage', check);
    return () => {
      observer.disconnect();
      window.removeEventListener('storage', check);
    };
  }, []);

  if (!active) return null;

  return (
    <CrisisOverlay
      onReady={() => {
        exitCrisis();
        setActive(false);
      }}
    />
  );
}
