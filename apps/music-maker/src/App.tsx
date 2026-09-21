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
 *
 * Re-render discipline: App owns NO per-frame state. The scene runs its own
 * animation loop internally (SpatialScene), so a requestAnimationFrame here
 * would re-render the whole tree at 60fps for nothing — the historical `time`
 * prop was dead state and was removed.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SpatialInstrumentEngine, FAMILY_ZONE_BUDGET, type TimbreProfile } from './audio/SpatialInstrumentEngine';
import { SpatialScene } from './scene/SpatialScene';
import { SoundToggle } from './components/SoundToggle';
import { useInstrumentSound } from './hooks/useInstrumentSound';
import { useMusicSession, unseenRemoteTriggers } from './hooks/useMusicSession';
import { phyllotaxisPosition, type Timbre } from './scene/musicZone';

const TIMBRE_PROFILES: Record<Timbre, TimbreProfile> = {
  hydrogen: { oscType: 'sine', volume: 0.5, attack: 0.02, decay: 1.2, frequency: 863, brightness: 0.2 },
  carbon: { oscType: 'triangle', volume: 0.5, attack: 0.02, decay: 0.9, frequency: 646, brightness: 0.4 },
  oxygen: { oscType: 'sine', volume: 0.5, attack: 0.01, decay: 0.7, frequency: 1081, brightness: 0.6 },
  phosphor: { oscType: 'triangle', volume: 0.55, attack: 0.01, decay: 0.5, frequency: 863, brightness: 0.8 },
};

const RADIUS = 2.2;
/** The family-scale node budget (§5.2) — single source: the engine's. */
const MAX_ZONES = FAMILY_ZONE_BUDGET;

export default function App() {
  const sound = useInstrumentSound();
  const session = useMusicSession();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listener, setListener] = useState<[number, number, number]>([0, 0, 1.8]);
  const [mapping, setMapping] = useState<'pitch' | 'brightness'>('pitch');
  const [announcement, setAnnouncement] = useState<string | null>(null);

  // The audio engine — created once, fed by the session's zone list.
  const engineRef = useRef<SpatialInstrumentEngine | null>(null);
  useEffect(() => {
    const e = new SpatialInstrumentEngine({ radius: RADIUS, masterCeiling: 0.6, panningModel: 'HRTF', maxZones: MAX_ZONES });
    engineRef.current = e;
    return () => {
      e.dispose();
      engineRef.current = null;
    };
  }, []);

  // Sound toggle: the user gesture. The ENGINE owns the single AudioContext —
  // turning ON calls engine.enable(), which creates/resumes it inside this
  // gesture handler. The hook tracks only the preference (no context of its
  // own, so a session never has two).
  const handleToggle = useCallback(() => {
    sound.toggle();
    if (sound.enabled) {
      // Turning OFF.
      engineRef.current?.disable();
    } else {
      // Turning ON — this call IS the user gesture; the engine builds its
      // single graph here.
      engineRef.current?.enable();
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

  // Listener → audio. The engine remembers the position even before the
  // context exists (a silent no-op then) and pushes it on enable().
  useEffect(() => {
    engineRef.current?.setListener(listener[0], listener[1], listener[2]);
  }, [listener]);

  // Reduced motion: the scene draws a static frame; the composition stays
  // fully interactive. No per-frame state lives here.
  const reducedMotion = useMemo(
    () => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  // Announce a zone trigger for screen-reader users — the "every sound has a
  // visual echo" rule's non-visual twin. Debounced: a child mashing zones, or
  // a remote peer triggering rapidly, must not flood a live region. Only local
  // triggers announce; remote echoes announce at a 1-per-2s floor.
  const announceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const announce = useCallback((text: string) => {
    if (announceTimer.current) clearTimeout(announceTimer.current);
    announceTimer.current = setTimeout(() => setAnnouncement(text), 200);
  }, []);
  // C3: the last remote-echo announcement time — remote echoes floor at 2s.
  const remoteAnnounceAt = useRef(0);
  useEffect(() => () => { if (announceTimer.current) clearTimeout(announceTimer.current); }, []);

  const handleZoneTrigger = useCallback(
    (id: string) => {
      const z = session.zones.find((x) => x.id === id);
      const name = session.zoneName(id);
      const p = z ? TIMBRE_PROFILES[z.timbre] ?? TIMBRE_PROFILES.hydrogen : TIMBRE_PROFILES.hydrogen;
      // The glow ALWAYS fires (visual echo); the sound fires only when the
      // engine is enabled. Played/gazed: ephemeral, never committed.
      session.localTrigger(id);
      engineRef.current?.trigger(id, p);
      announce(`${name} played`);
    },
    [session, announce],
  );

  const handleRemoteZoneTrigger = useCallback(
    (id: string) => {
      const z = session.zones.find((x) => x.id === id);
      const p = z ? TIMBRE_PROFILES[z.timbre] ?? TIMBRE_PROFILES.hydrogen : TIMBRE_PROFILES.hydrogen;
      engineRef.current?.trigger(id, p);
      // C3: remote echoes are floored at one announcement per 2s so a peer
      // mashing zones doesn't flood the live region. Local triggers announce
      // immediately (handleZoneTrigger).
      const now = Date.now();
      if (now - remoteAnnounceAt.current >= 2000) {
        remoteAnnounceAt.current = now;
        announce(`someone played ${session.zoneName(id)}`);
      }
    },
    [session, announce],
  );

  // A3: process EVERY new remote trigger since the last run, not just the
  // head. Tracked by monotonic SEQ — the presence list is capped at 8 for
  // display, so tracking by array length would silently stall once the cap
  // drops old entries. unseenRemoteTriggers returns the unseen ones in arrival
  // order; the play order then matches arrival.
  const lastRemoteSeqRef = useRef(0);
  useEffect(() => {
    const unseen = unseenRemoteTriggers(session.remoteTriggers, lastRemoteSeqRef.current);
    for (const t of unseen) {
      lastRemoteSeqRef.current = t.seq;
      handleRemoteZoneTrigger(t.zone);
    }
  }, [session.remoteTriggers, handleRemoteZoneTrigger]);

  // Place a zone at the current phyllotaxis slot for the count. Refuses past
  // the node budget with a clear message — the family-scale baseline is 8–16.
  const handlePlace = useCallback(() => {
    if (session.zones.length >= MAX_ZONES) {
      announce(`the instrument is full at ${MAX_ZONES} zones. clear one first.`);
      return;
    }
    const pos = phyllotaxisPosition(session.zones.length, Math.max(16, session.zones.length + 1), RADIUS);
    void session.placeZone(pos, 'hydrogen');
  }, [session, announce]);

  const handleClear = useCallback(() => {
    if (selectedId) void session.clearZone(selectedId);
  }, [selectedId, session]);

  // ── Named accessibility gaps (tracked, not silently deferred) ─────────────
  // 1. Vertical encoding has no NON-AUDIO fallback. The height→pitch /
  //    height→timbre channel carries the axis stereo pan cannot — but a user
  //    who cannot hear pan (deaf, or mono-only) cannot localize height at all.
  //    Research frontier is vibrotactile (NIME 2026 bHaptics TactSuit study);
  //    hardware-gated, so it is a named gap, not v1 scope.
  // 2. Web MIDI is intentionally absent. Safari (desktop + iOS) does not
  //    support it, and Chrome 124+ requires a permission prompt. Touch/pointer
  //    is primary; MIDI would only AUGMENT it via feature detection, and must
  //    never gate the core loop. (verified against caniuse / Chrome for
  //    Developers as of 2026-09).

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
          reducedMotion={reducedMotion}
        />
        <div className="mm-readout">
          <span className="mm-strong">{session.zones.length}</span> / {MAX_ZONES} zones · sound {sound.enabled ? 'on' : 'off'} ·
          drag to look · one-finger drag is <em>you</em>
        </div>
      </main>

      {/* The trigger announcements — the screen-reader twin of the visual echo.
          role="status" + aria-live="polite": announced without interrupting.
          Debounced in the handler so a mash of zones produces one line, not a
          flood. */}
      <div className="mm-live" role="status" aria-live="polite">
        {announcement ?? ''}
      </div>
    </div>
  );
}