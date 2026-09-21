/**
 * The music maker — ZonePanel.
 *
 * The hybrid 2D/3D control (the TimbreSpace pattern): a zone is manipulated in
 * 3D space (tap to select, trigger), and its SOUND is edited in a 2D panel.
 * Per-zone pitch/brightness/duration would need new canon event kinds — that
 * is deliberately deferred (a committed-scope decision, not a silent gap). The
 * honest committed surface here is the zone's TIMBRE (set at placement) and
 * its NAME (committed via instrument.zone.name), both of which are real log
 * entries the family can revisit. A rename announces through the live region
 * and is provenance-tracked like every other composition change.
 *
 * 48px touch targets on every control (the family floor). The panel is
 * readable, mobile-friendly, and anchored to the selection — it does not
 * replace the 3D surface, it completes it.
 */
import { useCallback, useRef, useState } from 'react';
import type { MusicZone } from '../scene/musicZone';

export interface ZonePanelProps {
  zone: MusicZone | null;
  /** Commit a rename — the same committed path as the Loom's log. */
  onRename: (id: string, name: string) => void;
  announce: (text: string) => void;
}

export function ZonePanel({ zone, onRename, announce }: ZonePanelProps) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Reset the draft when the selection changes to a different zone.
  const lastIdRef = useRef<string | null>(null);
  if (zone && zone.id !== lastIdRef.current) {
    lastIdRef.current = zone.id;
    setDraft(zone.name || zone.id);
  } else if (!zone) {
    lastIdRef.current = null;
  }

  const submit = useCallback(() => {
    if (!zone) return;
    const name = draft.trim();
    if (name && name !== (zone.name || zone.id)) {
      onRename(zone.id, name);
      announce(`this zone is now called ${name}`);
    }
  }, [zone, draft, onRename, announce]);

  if (!zone) return null;

  return (
    <aside className="mm-zone-panel" aria-label={`zone ${zone.name || zone.id}`}>
      <h2 className="mm-zone-panel-title">{zone.name || zone.id}</h2>
      <div className="mm-zone-panel-row">
        <span className="mm-zone-panel-key">timbre</span>
        <span className="mm-zone-panel-val">{zone.timbre}</span>
      </div>
      {zone.author && (
        <div className="mm-zone-panel-row">
          <span className="mm-zone-panel-key">placed by</span>
          <span className="mm-zone-panel-val">{zone.author}</span>
        </div>
      )}
      <form
        className="mm-zone-panel-row"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="mm-zone-name" className="mm-zone-panel-key">name</label>
        <input
          ref={inputRef}
          id="mm-zone-name"
          className="mm-zone-panel-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label="rename this zone"
        />
        <button
          type="submit"
          className="mm-btn"
          data-agent-kind="action"
          data-agent-action="instrument.zone.name"
          data-agent-danger="none"
          data-agent-confirm="never"
        >
          rename
        </button>
      </form>
    </aside>
  );
}