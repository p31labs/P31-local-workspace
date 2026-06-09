import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAtmosphere } from '../components/AtmosphereProvider';

const PUSH_TOPIC = 'hearth-pain-alert';

interface PainNotification {
  level: number;
  timestamp: number;
  source: string;
}

export function HearthSurface({ theme, spoons }: { theme: Record<string, string>; spoons: number }) {
  const { setSpoons } = useAtmosphere();
  const [activeTab, setActiveTab] = useState('overview');
  const [energyLevel, setEnergyLevel] = useState(5);
  const [recipeScale, setRecipeScale] = useState(4);
  const [swReady, setSwReady] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [lastPainAlert, setLastPainAlert] = useState<PainNotification | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);

  // Service Worker registration + BroadcastChannel for cross-tab pain alerts
  useEffect(() => {
    let cancelled = false;

    /* v8 ignore start */
    async function register() {
      if (!('serviceWorker' in navigator)) return;
      try {
        const reg = await navigator.serviceWorker.register('/sw-hearth.js', { scope: '/' });
        if (!cancelled) {
          setSwReady(true);

          // Listen for messages from SW
          navigator.serviceWorker.addEventListener('message', (e) => {
            if (e.data?.type === 'PAIN_ALERT') {
              handlePainAlert(e.data as PainNotification);
            }
          });

          // Check push subscription
          const sub = await reg.pushManager.getSubscription();
          if (!cancelled) setPushEnabled(!!sub);
        }
      } catch {
        /* SW registration failed — graceful degradation */
      }
    }

    register();

    // BroadcastChannel for cross-tab communication
    const bc = new BroadcastChannel(PUSH_TOPIC);
    bcRef.current = bc;
    bc.onmessage = (e) => {
      if (e.data?.type === 'PAIN_ALERT') {
        handlePainAlert(e.data as PainNotification);
      }
    };
    /* v8 ignore stop */

    // Check for last pain alert from localStorage
    try {
      const stored = localStorage.getItem('hearth-last-pain');
      if (stored) {
        const alert = JSON.parse(stored) as PainNotification;
        if (Date.now() - alert.timestamp < 300000) { // 5 min window
          setLastPainAlert(alert);
        }
      }
    } catch { /* */ }

    return () => {
      cancelled = true;
      bc.close();
    };
  }, []);

  const handlePainAlert = useCallback((alert: PainNotification) => {
    setLastPainAlert(alert);
    if (alert.level >= 7) {
      setSpoons(Math.max(0, spoons - 1));
    }
    try {
      localStorage.setItem('hearth-last-pain', JSON.stringify(alert));
    } catch { /* */ }
  }, [spoons, setSpoons]);

  /* v8 ignore start */
  const triggerPainAlert = useCallback((level: number) => {
    const alert: PainNotification = { level, timestamp: Date.now(), source: 'hearth-manual' };
    handlePainAlert(alert);

    // Broadcast to other tabs
    bcRef.current?.postMessage({ type: 'PAIN_ALERT', ...alert });

    // Send toservice worker for background processing
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'PAIN_ALERT', ...alert });
    }
  }, [handlePainAlert]);

  const requestPushPermission = useCallback(async () => {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      setPushEnabled(true);
      new Notification('Hearth Active', {
        body: 'Pain alerts will trigger spoon drops even when backgrounded.',
        icon: '/icon-192.png',
      });
    }
  }, []);
  /* v8 ignore stop */

  const handleEnergyChange = (level: number) => {
    setEnergyLevel(level);
    if (level <= 3 && spoons > 1) {
      setSpoons(Math.max(1, spoons - 1));
    }
    if (level >= 7) {
      triggerPainAlert(level);
    }
  };

  const energyColor = energyLevel >= 7 ? 'text-emerald-400' : energyLevel >= 4 ? 'text-amber-400' : 'text-red-400';
  const energyLabel = energyLevel >= 7 ? 'Good' : energyLevel >= 4 ? 'Moderate' : 'Low';

  if (spoons <= 2) {
    return (
      <div className="space-y-4 w-full">
        <div className="text-xs font-mono tracking-widest uppercase opacity-60 text-center">Hearth</div>
        <div className="p-4 bg-white/5 border border-white/5 rounded-xl text-center space-y-3">
          <div className="text-xs opacity-70">How are you feeling?</div>
          <input
            type="range"
            min="1"
            max="10"
            value={energyLevel}
            onChange={(e) => handleEnergyChange(Number(e.target.value))}
            className="w-full accent-orange-500"
          />
          <div className={`font-mono text-sm font-bold ${energyColor}`}>
            {energyLevel}/10 — {energyLabel}
          </div>
        </div>
        {lastPainAlert && lastPainAlert.level >= 7 && (
          <div className="text-[10px] font-mono text-amber-400/60 text-center">
            ⚠ Pain alert received: level {lastPainAlert.level} @ {new Date(lastPainAlert.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <span className="text-xs font-mono tracking-widest uppercase opacity-60">Hearth</span>
        <div className="flex items-center gap-2">
          {swReady && <span className="text-[9px] font-mono text-emerald-400">SW</span>}
          {pushEnabled && <span className="text-[9px] font-mono text-emerald-400">PUSH</span>}
        </div>
      </div>

      <div className="flex gap-2">
        {['overview', 'energy', 'kitchen'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-2 py-1 text-[10px] font-mono uppercase border rounded-lg transition-all ${
              activeTab === tab ? 'bg-white/10 border-white/20' : 'border-transparent opacity-60'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-3">
          <div className={`p-3 rounded-xl border border-white/5 bg-white/5`}>
            <span className="text-[9px] font-mono uppercase opacity-40 block mb-1">Current Energy</span>
            <span className="text-lg font-mono font-bold">{energyLevel}/10</span>
            <span className={`ml-2 text-xs font-mono ${energyColor}`}>{energyLabel}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setActiveTab('energy')} className="p-2 text-xs font-mono border border-white/5 rounded-lg hover:bg-white/5">
              ⚡ Log Energy
            </button>
            <button onClick={() => setActiveTab('kitchen')} className="p-2 text-xs font-mono border border-white/5 rounded-lg hover:bg-white/5">
              🍳 Kitchen
            </button>
          </div>
          {!pushEnabled && swReady && (
            <button
              onClick={requestPushPermission}
              className="w-full p-2 text-[10px] font-mono border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-950/20"
            >
              Enable Pain Push Alerts
            </button>
          )}
          {lastPainAlert && (
            <div className="text-[10px] font-mono text-amber-400/60 bg-amber-950/10 p-2 rounded border border-amber-900/20">
              Last pain alert: level {lastPainAlert.level} ({lastPainAlert.source}) @ {new Date(lastPainAlert.timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}

      {activeTab === 'energy' && (
        <div className="space-y-3">
          <span className="text-[10px] font-mono uppercase opacity-40 block">Energy Level</span>
          <input
            type="range"
            min="1"
            max="10"
            value={energyLevel}
            onChange={(e) => handleEnergyChange(Number(e.target.value))}
            className="w-full accent-orange-500"
          />
          <div className={`text-center font-mono text-sm font-bold ${energyColor}`}>
            {energyLevel}/10 — {energyLabel}
          </div>
          {energyLevel <= 3 && (
            <div className="text-[10px] font-mono text-red-400 bg-red-950/10 p-2 rounded border border-red-900/20">
              Energy very low. Consider resting.
            </div>
          )}
        </div>
      )}

      {activeTab === 'kitchen' && (
        <div className="space-y-3">
          <span className="text-[10px] font-mono uppercase opacity-40 block">Recipe Scaling</span>
          <div className="flex gap-1">
            {[1, 2, 4, 8].map((s) => (
              <button
                key={s}
                onClick={() => setRecipeScale(s)}
                className={`px-3 py-1 text-[10px] font-mono border rounded ${
                  recipeScale === s ? 'bg-white/10 border-white/20' : 'border-white/5 opacity-60'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
          <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-2">
            <span className="text-xs font-mono">Sovereign Oat Base</span>
            <div className="text-[10px] font-mono opacity-60 space-y-1">
              <p>{2400 / recipeScale}mL water</p>
              <p>{240 / recipeScale}g oats</p>
              <p>{60 / recipeScale}g honey</p>
            </div>
            <p className="text-[10px] font-mono opacity-30">Instructions:Combine water and oats. {recipeScale > 2 ? 'Long simmer.' : 'Quick stir.'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
