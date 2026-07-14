import React, { useRef, useEffect } from 'react';

interface MeshEvent {
  id: string;
  type: 'intercept' | 'sync' | 'error';
  message: string;
  timestamp: Date;
}

interface PHOSMagicDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  spoons: number;
  selectedModel?: string;
  onSetModel?: (model: string) => void;
  meshEvents?: MeshEvent[];
  dyslexiaMode?: string;
  reducedMotion?: string;
  onSetDyslexiaMode?: (v: string) => void;
  onSetReducedMotion?: (v: string) => void;
}

export default function PHOSMagicDrawer({
  isOpen, onClose, spoons,
  selectedModel = '',
  onSetModel = () => {},
  meshEvents = [],
  dyslexiaMode = 'false',
  reducedMotion = 'false',
  onSetDyslexiaMode = () => {},
  onSetReducedMotion = () => {},
}: PHOSMagicDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && drawerRef.current) {
      const first = drawerRef.current.querySelector('button, input, [tabindex="0"]');
      if (first) (first as HTMLElement).focus();
    } else if (!isOpen && toggleRef.current) {
      toggleRef.current.focus();
    }
  }, [isOpen]);

  if (spoons === 0) return null;

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40" onClick={onClose} />}
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Mesh Dashboard"
        className={`fixed top-0 right-0 h-full z-50 transition-transform duration-500 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } phos-glass-strong`}
        style={{ width: '20rem', borderLeft: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5 flex-shrink-0">
          <span className="text-xs font-sans tracking-wide" style={{ color: 'var(--phos-primary)' }}>
            Telemetry
          </span>
          <button
            ref={toggleRef}
            onClick={onClose}
            className="p-3 rounded-lg hover:bg-white/5 transition-colors opacity-50 hover:opacity-100 min-w-[48px] min-h-[48px] flex items-center justify-center"
            aria-label="Close Mesh Dashboard"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 glass-text-scrim">
          {/* Cognitive Controls */}
          <div className="space-y-3">
            <h3 className="text-xs font-sans tracking-wide opacity-50">Cognitive Controls</h3>
            <div className="flex gap-2">
              <button
                onClick={() => onSetDyslexiaMode(dyslexiaMode === 'true' ? 'false' : 'true')}
                className={`flex-1 py-2 text-xs rounded border transition-colors ${
                  dyslexiaMode === 'true' ? 'bg-white/10 border-white/20' : 'border-white/5 hover:bg-white/5'
                }`}
                aria-pressed={dyslexiaMode === 'true'}
                aria-label={dyslexiaMode === 'true' ? 'Disable dyslexia mode' : 'Enable dyslexia mode'}
              >
                Dyslexia Mode
              </button>
              <button
                onClick={() => onSetReducedMotion(reducedMotion === 'true' ? 'false' : 'true')}
                className={`flex-1 py-2 text-xs rounded border transition-colors ${
                  reducedMotion === 'true' ? 'bg-white/10 border-white/20' : 'border-white/5 hover:bg-white/5'
                }`}
                aria-pressed={reducedMotion === 'true'}
                aria-label={reducedMotion === 'true' ? 'Enable motion' : 'Reduce motion'}
              >
                Reduce Motion
              </button>
            </div>
          </div>

          {/* Mesh Notifications */}
          <div className="space-y-4">
            <h3 className="text-xs font-sans tracking-wide opacity-50">Mesh Notifications</h3>
            <div className="space-y-3" aria-live="polite" role="log" aria-label="Mesh notifications">
              {meshEvents.length === 0 ? (
                <p className="text-xs opacity-40 font-light">Network is quiet.</p>
              ) : (
                meshEvents.map(event => (
                  <div key={event.id} className="text-xs p-3 rounded-lg bg-white/5 flex gap-3 items-start">
                    <span className="mt-0.5 flex-shrink-0" aria-hidden="true" style={{ color: event.type === 'intercept' ? 'var(--phos-accent)' : 'var(--phos-primary)' }}>
                      {event.type === 'intercept' ? '◆' : '●'}
                    </span>
                    <span className="opacity-80 font-light leading-relaxed">{event.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* The Delta Way */}
          <div className="pt-6 border-t border-white/5">
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,179,71,0.05)', border: '1px solid rgba(255,179,71,0.1)' }}>
              <h4 className="text-xs font-sans mb-2" style={{ color: 'var(--phos-accent)' }}>The Delta Way</h4>
              <p className="text-xs opacity-70 mb-4 font-light leading-relaxed">
                Intercepts have saved an estimated $140 in escalation costs this week.
              </p>
              <button className="w-full py-2.5 rounded text-xs font-medium bg-white text-black hover:bg-gray-200 transition-colors" aria-label="Make a donation to support the mesh">
                Fuel the Mesh
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
