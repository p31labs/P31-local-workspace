import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAtmosphere } from '../components/AtmosphereProvider';

const TELEMETRY_DB = 'idb://p31-telemetry';
const NAV_LOG_KEY = 'phos-nav-log';
const MAX_LOG = 200;

interface NavEntry {
  from: string;
  to: string;
  spoons: number;
  ts: number;
}

function loadLog(): NavEntry[] {
  try {
    const raw = localStorage.getItem(NAV_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveLog(entries: NavEntry[]) {
  try { localStorage.setItem(NAV_LOG_KEY, JSON.stringify(entries.slice(-MAX_LOG))); } catch { /* */ }
}

function recordNavigation(from: string, to: string, spoons: number) {
  const log = loadLog();
  log.push({ from, to, spoons, ts: Date.now() });
  saveLog(log);
}

/**
 * First-order Markov chain: P(next | current, spoonState).
 * Built from navigation log. Returns ordered destinations by probability.
 */
function predictDestinations(currentSurface: string, spoons: number, allDestinations: string[]): string[] {
  const log = loadLog();
  if (log.length < 5) return allDestinations;

  // Filter entries matching current spoon state (±1)
  const relevant = log.filter((e) => Math.abs(e.spoons - spoons) <= 1 && e.from === currentSurface);
  if (relevant.length < 3) return allDestinations;

  // Build transition counts
  const counts: Record<string, number> = {};
  for (const entry of relevant) {
    counts[entry.to] = (counts[entry.to] || 0) + 1;
  }

  // Sort by probability (count / total)
  const total = relevant.length;
  const scored = allDestinations.map((d) => ({
    dest: d,
    score: (counts[d] || 0) / total,
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.dest);
}

export const CompassSurface: React.FC<{ className?: string }> = ({ className }) => {
  const { grayRock, spoons, setSurface, currentSurface } = useAtmosphere();
  const [orderedDests, setOrderedDests] = useState<string[]>([]);
  const prevSurface = useRef(currentSurface);

  const allDestinations = useMemo(() => [
    { key: 'HEARTH', label: 'Family', icon: '♥' },
    { key: 'THE_BUFFER', label: 'Build', icon: '⚒' },
    { key: 'ARCHIVE', label: 'Knowledge', icon: '◈' },
    { key: 'VAULT', label: 'Safe Room', icon: '◉' },
  ], []);

  useEffect(() => {
    if (prevSurface.current !== currentSurface) {
      recordNavigation(prevSurface.current, currentSurface, spoons);
      prevSurface.current = currentSurface;
    }
  }, [currentSurface, spoons]);

  useEffect(() => {
    const dests = allDestinations.map((d) => d.key);
    const ordered = predictDestinations(currentSurface, spoons, dests);
    setOrderedDests(ordered);
  }, [currentSurface, spoons, allDestinations]);

  const handleNavigate = useCallback((key: string) => {
    recordNavigation(currentSurface, key, spoons);
    setSurface(key);
  }, [currentSurface, spoons, setSurface]);

  const visibleDests = spoons <= 1 ? 2 : 4;
  const orderedAll = orderedDests.length === allDestinations.length
    ? orderedDests
    : allDestinations.map((d) => d.key);

  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-center ${className ?? ''}`}>
      {grayRock ? (
        <p className="font-mono text-xs text-zinc-500">Compass offline.</p>
      ) : (
        <>
          <span className="font-mono text-xs text-purple-400/60 tracking-widest uppercase mb-4">Compass</span>
          <p className="font-mono text-xs text-zinc-500 mb-4">
            {spoons <= 1 ? 'Low energy. Simple choices.' : 'Where do you need to go?'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {orderedAll.slice(0, visibleDests).map((key) => {
              const dest = allDestinations.find((d) => d.key === key);
              if (!dest) return null;
              return (
                <button key={dest.key} onClick={() => handleNavigate(dest.key)}
                  className="px-3 py-2 text-xs font-mono border border-purple-800/40 text-purple-400 rounded hover:bg-purple-900/20 flex items-center gap-2">
                  <span>{dest.icon}</span><span>{dest.label}</span>
                </button>
              );
            })}
          </div>
          {orderedDests.length > 0 && (
            <div className="mt-3 text-[9px] font-mono opacity-20 uppercase tracking-widest">
              Order learned from {loadLog().length} navigations
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CompassSurface;
