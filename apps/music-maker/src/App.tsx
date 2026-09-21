/**
 * The music maker — App.
 *
 * Wires the three systems together:
 *   • the composition log (useMusicSession) — the score
 *   • the spatial scene (SpatialScene) — the planetarium
 *   • the audio engine (SpatialInstrumentEngine) — the sound
 *
 * The log/presence split is respected end to end: placements/clears/names are
 * committed events; a zone trigger is ephemeral and never committed.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SpatialInstrumentEngine, type TimbreProfile } from './audio/SpatialInstrumentEngine';
import { SpatialScene } from './scene/SpatialScene';
import { SoundToggle } from './components/SoundToggle';
import { useInstrumentSound } from './hooks/useInstrumentSound';
import { useMusicSession } from './hooks/useMusicSession';
import { makeZone, phyllotaxisPosition, type Timbre } from './scene/musicZone';

const TIMBRE_PROFILES: Record<Timbre, TimbreProfile> = {
  hydrogen: { oscType: 'sine', volume: 0.5, attack: 0.02, decay: 1.2, frequency: 863, brightness: 0.2 },
  carbon: { oscType: 'triangle', volume: 0.5, attack: 0.02, decay: 0.9, frequency: 646, brightness: 0.4 },
  oxygen: { oscType: 'sine', volume: 0.5, attack: 0.01, decay: 0.7, frequency: 1081, brightness: 0.6 },
  phosphor: { oscType: 'triangle', volume: 0.55, attack: 0.01, decay: 0.5, frequency: 863, brightness: 0.8 },
};

const RADIUS = 2.2;

export default function App() {
  const sound = useInstrumentSound();
  const session = useMusicSession();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listener, setListener] = useState<[number, number, number]>([0, 0, 1.8]);
  const [time, setTime] = useState(0);
  const [mapping, setMapping] = useState<'pitch' | 'brightness'>('pitch');

  // The audio engine — created once, fed by the session's zone list.
  const engineRef = useRef<SpatialInstrumentEngine | null>(null);
  const [engine, setEngine] = useState<SpatialInstrumentEngine | null>(null);
  useEffect(() => {
    const e = new SpatialInstrumentEngine({ radius: RADIUS, masterCeiling: 0.6, panningModel: 'HRTF' });
    engineRef.current = e;
    setEngine(e);
    return () => {
      e.dispose();
      engineRef.current = null;
    };
  }, []);

  // Sound toggle: the user gesture that may resume audio.
  const handleToggle = useCallback(() => {
    sound.toggle();
    if (!sound.enabled) {
      // Turning ON: resume the context inside this gesture handler.
      sound.resume();
      engineRef.current?.enable();
    } else {
      engineRef.current?.disable();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sound.toggle, sound.enabled]);

  // Keep zones and their voices in sync with the committed log.
  useEffect(() => {
    const e = engineRef.current;
    if (!e) return;
    const known = new Set<string>();
    for (const z of session.zones) {
      known.add(z.id);
      const p = TIMBRE_PROFILES[z.timbre] ?? TIMBRE_PROFILES.hydrogen;
      e.addZone({ id: z.id, x: z.position[0], y: z.position[1], z: z.position[2] }, p);
    }
    // Zones that left the composition are pruned from the audio graph.
    for (const id of e.zoneIds()) {
      if (!known.has(id)) e.removeZone(id);
    }
  }, [session.zones]);

  // Listener → audio (throttled to animation-frame rate by the scene loop).
  useEffect(() => {
    engineRef.current?.setListener(listener[0], listener[1], listener[2]);
  }, [listener]);

  // Reduced motion: the scene draws a static frame; the clock advances
  // slowly (1/4 rate) but the composition stays fully interactive.
  const reducedMotion = useMemo(
    () => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );
  useEffect(() => {
    if (reducedMotion) return;
    const raf = requestAnimationFrame(function tick(now) {
      setTime(now / 1000);
      requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion]);

  const handleZoneTrigger = useCallback(
    (id: string) => {
      const z = session.zones.find((x) => x.id === id);
      const p = z ? TIMBRE_PROFILES[z.timbre] ?? TIMBRE_PROFILES.hydrogen : TIMBRE_PROFILES.hydrogen;
      // The glow ALWAYS fires (visual echo); the sound fires only when the
      // engine is enabled. Played/gazed: ephemeral, never committed.
      session.localTrigger(id);
      engineRef.current?.trigger(id, p);
    },
    [session],
  );

  const handleRemoteZoneTrigger = useCallback(
    (id: string) => {
      const z = session.zones.find((x) => x.id === id);
      const p = z ? TIMBRE_PROFILES[z.timbre] ?? TIMBRE_PROFILES.hydrogen : TIMBRE_PROFILES.hydrogen;
      engineRef.current?.trigger(id, p);
    },
    [session.zones],
  );

  // A remote trigger also plays here (if sound is on this device).
  const lastRemote = session.remoteTriggers[0];
  useEffect(() => {
    if (lastRemote) handleRemoteZoneTrigger(lastRemote.zone);
  }, [lastRemote, handleRemoteZoneTrigger]);

  // Place a zone at the current phyllotaxis slot for the count.
  const handlePlace = useCallback(() => {
    const pos = phyllotaxisPosition(session.zones.length, Math.max(16, session.zones.length + 1), RADIUS);
    void session.placeZone(pos, 'hydrogen');
  }, [session]);

  const handleClear = useCallback(() => {
    if (selectedId) void session.clearZone(selectedId);
  }, [selectedId, session]);

  return (
    <div className="mm-shell" data-motion={reducedMotion ? 'reduced' : 'full'}>
      <header className="mm-topbar">
        <h1 className="mm-title">the spatial instrument</h1>
        <div className="mm-controls">
          <SoundToggle enabled={sound.enabled} onToggle={handleToggle} />
          <button
            type="button"
            className="mm-btn"
            onClick={() => setMapping(mapping === 'pitch' ? 'brightness' : 'pitch')}
            data-agent-kind="action"
            data-agent-action="instrument.mapping.toggle"
            data-agent-danger="none"
            data-agent-confirm="never"
            aria-pressed={mapping === 'brightness'}
          >
            {mapping === 'pitch' ? 'height → pitch' : 'height → timbre'}
          </button>
          <button
            type="button"
            className="mm-btn mm-btn-accent"
            onClick={handlePlace}
            data-agent-kind="action"
            data-agent-action="instrument.zone.place"
            data-agent-danger="low"
            data-agent-confirm="optional"
          >
            place a zone
          </button>
          <button
            type="button"
            className="mm-btn"
            onClick={handleClear}
            disabled={!selectedId}
            data-agent-kind="action"
            data-agent-action="instrument.zone.clear"
            data-agent-danger="medium"
            data-agent-confirm="review"
          >
            clear selected
          </button>
        </div>
      </header>

      <main className="mm-stage">
        <SpatialScene
          zones={session.zones}
          triggers={session.triggers}
          listener={listener}
          onListenerChange={setListener}
          onZoneTrigger={handleZoneTrigger}
          selectedId={selectedId}
          time={time}
          reducedMotion={reducedMotion}
        />
        <div className="mm-readout">
          <span className="mm-strong">{session.zones.length}</span> zones · sound {sound.enabled ? 'on' : 'off'} ·
          drag to look · one-finger drag is <em>you</em>
        </div>
      </main>
    </div>
  );
}