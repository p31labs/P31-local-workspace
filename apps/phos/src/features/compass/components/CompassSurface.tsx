import { useState, useRef, useEffect } from 'react';
import { GlassCard } from '@p31/ui/chrome';
import { GlowButton } from '@p31/ui/chrome';

interface Waypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  emoji: string;
  note: string;
  createdAt: number;
}

const defaultWaypoints: Waypoint[] = [
  { id: '1', name: 'Home', lat: 0, lng: 0, emoji: '🏠', note: 'Starting point', createdAt: Date.now() - 86400000 },
  { id: '2', name: 'Park', lat: 0.001, lng: 0.001, emoji: '🌳', note: 'Peaceful spot', createdAt: Date.now() - 43200000 },
];

export function CompassSurface() {
  const [waypoints, setWaypoints] = useState<Waypoint[]>(() => {
    try { return JSON.parse(localStorage.getItem('phos:waypoints') || 'null') || defaultWaypoints; }
    catch { return defaultWaypoints; }
  });
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [heading, setHeading] = useState(0);
  const [selected, setSelected] = useState<Waypoint | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({ name: '', emoji: '📍', note: '' });

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      pos => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true }
    );

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha != null) setHeading(Math.round(e.alpha));
    };
    window.addEventListener('deviceorientation', handleOrientation);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  const addWaypoint = () => {
    if (!draft.name.trim()) return;
    const wp: Waypoint = {
      id: crypto.randomUUID(),
      name: draft.name.trim(),
      lat: position?.lat || 0,
      lng: position?.lng || 0,
      emoji: draft.emoji,
      note: draft.note.trim(),
      createdAt: Date.now(),
    };
    const updated = [wp, ...waypoints];
    setWaypoints(updated);
    localStorage.setItem('phos:waypoints', JSON.stringify(updated));
    setDraft({ name: '', emoji: '📍', note: '' });
    setShowAdd(false);
  };

  const deleteWaypoint = (id: string) => {
    const updated = waypoints.filter(w => w.id !== id);
    setWaypoints(updated);
    localStorage.setItem('phos:waypoints', JSON.stringify(updated));
    setSelected(null);
  };

  const compassRose = () => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const idx = Math.round(heading / 45) % 8;
    return dirs[idx];
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6" data-mcp-tool="compassSurface" data-mcp-state={showAdd ? 'adding' : selected ? 'viewing' : 'idle'}>
      <GlassCard className="p-6">
        <h1 className="text-2xl font-bold text-quantum-cyan font-mono-tech mb-1">Compass</h1>
        <p className="text-cloud/50 text-sm">Navigation, waypoints, and orientation.</p>
      </GlassCard>

      <GlassCard className="p-6 text-center" strong>
        <div className="w-32 h-32 mx-auto rounded-full border-2 border-quantum-cyan/30 relative mb-4">
          <div
            className="absolute inset-2 rounded-full border border-white/10 flex items-center justify-center"
            style={{ transform: `rotate(-${heading}deg)` }}
          >
            <div className="w-0.5 h-8 bg-quantum-cyan absolute top-2 rounded-full" />
            <span className="text-xs text-quantum-cyan font-mono-tech absolute top-1">N</span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-quantum-cyan font-mono-tech">{compassRose()}</span>
          </div>
        </div>
        <p className="text-sm text-cloud/40 font-mono-tech">Heading: {heading}°</p>
        {position && (
          <p className="text-xs text-cloud/30 font-mono-tech mt-1">
            {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
          </p>
        )}
      </GlassCard>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-ink">Waypoints ({waypoints.length})</h2>
          <GlowButton color="cyan" size="sm" onClick={() => setShowAdd(!showAdd)} data-mcp-tool="toggleAddWaypoint" data-mcp-type="action" data-mcp-target="compass-add-toggle" data-mcp-state={showAdd ? 'adding' : 'idle'}>
            {showAdd ? 'Cancel' : '+ Add'}
          </GlowButton>
        </div>

        {showAdd && (
          <div className="space-y-3 mb-4 p-4 rounded-xl bg-void-surface/50 border border-white/[0.06]">
            <input type="text" value={draft.name} onChange={e => setDraft(p => ({ ...p, name: e.target.value }))} placeholder="Name" className="w-full bg-void border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-ink placeholder:text-cloud/30 outline-none" data-mcp-tool="waypointName" data-mcp-type="input" data-mcp-target="waypoint-name" />
            <input type="text" value={draft.emoji} onChange={e => setDraft(p => ({ ...p, emoji: e.target.value }))} placeholder="Emoji" className="w-full bg-void border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-ink placeholder:text-cloud/30 outline-none" data-mcp-tool="waypointEmoji" data-mcp-type="input" data-mcp-target="waypoint-emoji" />
            <input type="text" value={draft.note} onChange={e => setDraft(p => ({ ...p, note: e.target.value }))} placeholder="Note" className="w-full bg-void border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-ink placeholder:text-cloud/30 outline-none" data-mcp-tool="waypointNote" data-mcp-type="input" data-mcp-target="waypoint-note" />
            <GlowButton color="cyan" size="md" onClick={addWaypoint} className="w-full" data-mcp-tool="saveWaypoint" data-mcp-type="action" data-mcp-target="waypoint-save">Save Waypoint</GlowButton>
          </div>
        )}

        <div className="space-y-2">
          {waypoints.map(wp => (
            <button
              key={wp.id}
              onClick={() => setSelected(selected?.id === wp.id ? null : wp)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                selected?.id === wp.id ? 'bg-quantum-cyan/5 border-quantum-cyan/20' : 'bg-void-surface/50 border-white/[0.04] hover:border-white/[0.08]'
              }`}
              data-mcp-tool="selectWaypoint"
              data-mcp-target={`waypoint-${wp.id}`}
              data-mcp-state={selected?.id === wp.id ? 'selected' : 'unselected'}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{wp.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm text-ink">{wp.name}</p>
                  <p className="text-xs text-cloud/30 font-mono-tech">{wp.lat.toFixed(4)}, {wp.lng.toFixed(4)}</p>
                </div>
                {wp.note && <p className="text-xs text-cloud/40">{wp.note}</p>}
              </div>
            </button>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
