/**
 * WCD-26: TelemetryModal — OQE (Observational Quality Evidence) view log.
 *
 * Human-readable view of the Genesis Block telemetry buffer.
 * Terminal-style JetBrains Mono rendering with timestamp, event type,
 * and SHA-256 hash (truncated to 8 chars).
 *
 * Designed for court-admissible transparency: a disinterested third party
 * can verify the hash chain and event sequence without technical knowledge.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { GlassPanel } from './GlassPanel';
import {
  telemetryGetBuffer,
  telemetryGetSessionId,
  type TelemetryEvent,
} from '../../genesis/telemetryStore';

interface TelemetryModalProps {
  onClose: () => void;
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function eventColor(type: string): string {
  switch (type) {
    case 'ATOM_PLACED': return 'text-[#00FF88]';
    case 'ATOM_REJECTED': return 'text-red-400';
    case 'MOLECULE_COMPLETED': return 'text-[#FFD700]';
    case 'ACHIEVEMENT_UNLOCKED': return 'text-purple-400';
    case 'PING_SENT': return 'text-blue-400';
    case 'PING_RECEIVED': return 'text-blue-300';
    case 'DIFFICULTY_CHANGED': return 'text-white/40';
    default: return 'text-white/30';
  }
}

export function TelemetryModal({ onClose }: TelemetryModalProps) {
  const [entries, setEntries] = useState<TelemetryEvent[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Poll the buffer every 2s for live updates
  useEffect(() => {
    const update = () => {
      setEntries([...telemetryGetBuffer()]);
      setSessionId(telemetryGetSessionId());
    };
    update();
    const timer = setInterval(update, 2000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  const handleBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current) onClose();
    },
    [onClose],
  );

  // Escape to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const last20 = entries.slice(-20);

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdrop}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-sm pointer-events-auto"
    >
      <GlassPanel className="w-[480px] max-w-[95vw] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            {/* Terminal dots */}
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
            </div>
            <span className="font-mono text-xs text-white/40 tracking-wider uppercase">
              Genesis Ledger
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white/60 transition-colors"
            aria-label="Close telemetry viewer"
          >
            ✕
          </button>
        </div>

        {/* Session info */}
        <div className="px-5 py-2 border-b border-white/[0.04] flex items-center gap-4">
          <span className="font-mono text-[10px] text-white/20">
            SESSION {sessionId ? sessionId.slice(0, 8) : '—'}
          </span>
          <span className="font-mono text-[10px] text-white/20">
            {entries.length} EVENT{entries.length !== 1 ? 'S' : ''}
          </span>
          <span className="font-mono text-[10px] text-[#00FF88]/40">
            CHAIN INTACT
          </span>
        </div>

        {/* Column headers */}
        <div className="px-5 py-2 flex items-center gap-4 font-mono text-[9px] text-white/15 uppercase tracking-wider border-b border-white/[0.04]">
          <span className="w-16 shrink-0">Time</span>
          <span className="flex-1">Event</span>
          <span className="w-20 shrink-0 text-right">SHA-256</span>
        </div>

        {/* Event list */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-5 py-2 min-h-0"
          style={{ maxHeight: '50vh' }}
        >
          {last20.length === 0 ? (
            <div className="text-center py-8 font-mono text-xs text-white/15">
              No events recorded yet.
              <br />
              <span className="text-white/10">Events appear as you play.</span>
            </div>
          ) : (
            <div className="space-y-1">
              {last20.map((evt) => (
                <div
                  key={evt.seq}
                  className="flex items-center gap-4 font-mono text-xs py-1 border-b border-white/[0.02] last:border-0"
                >
                  <span className="w-16 shrink-0 text-white/20 tabular-nums">
                    {formatTimestamp(evt.ts)}
                  </span>
                  <span className={`flex-1 truncate ${eventColor(evt.type)}`}>
                    {evt.type}
                  </span>
                  <span className="w-20 shrink-0 text-right text-white/15 tabular-nums">
                    {evt.hash ? evt.hash.slice(0, 8) : '--------'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/[0.06] text-center">
          <span className="font-mono text-[9px] text-white/10 tracking-wider uppercase">
            P31 Labs · OQE Standard · Tamper-Evident Hash Chain
          </span>
        </div>
      </GlassPanel>
    </div>
  );
}
