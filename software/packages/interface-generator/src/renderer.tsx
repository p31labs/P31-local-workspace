import React, { useEffect } from 'react';
import type { InterfaceDescription, Widget } from './types';

function get(obj: any, path: string | null): any {
  if (!path) return null;
  return path.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), obj);
}

function renderValue(v: any) {
  if (typeof v === 'boolean')
    return v ? <span className="text-quantum-green">✓</span> : <span className="text-quantum-gold">○</span>;
  return String(v);
}

// Full-screen breathing overlay for crisis mode (spoons === 0).
// Rendered by the HOST *outside* any [data-spoons="0"] ancestor so the
// breathing animation is not frozen by the DESIGN.md motion kill-switch.
export function CrisisOverlay({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onReady();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onReady]);

  return (
    <div className="fixed inset-0 bg-void flex items-center justify-center z-50" style={{ margin: 0 }}>
      <style>{`@keyframes uig-breathe { 0%,100% { transform: scale(1); opacity: .7 } 50% { transform: scale(1.18); opacity: 1 } }`}</style>
      <div className="text-center">
        <div
          className="mx-auto w-40 h-40 rounded-full border-2 border-quantum-cyan"
          style={{ animation: 'uig-breathe 4s ease-in-out infinite' }}
        />
        <p className="text-cloud text-sm mt-8">Rest. Breathe. You can exit when ready.</p>
        <button
          onClick={onReady}
          className="mt-8 px-8 py-4 bg-quantum-cyan text-black rounded-xl font-bold text-lg hover:opacity-90"
        >
          I&apos;m Ready
        </button>
      </div>
    </div>
  );
}

export function InterfaceRenderer({ description, data }: { description: InterfaceDescription; data: any }) {
  if (description.crisisMode) return null; // host handles crisis separately
  const { layout, density, widgets, nextStep } = description;

  const container =
    layout === 'single-column'
      ? 'space-y-6'
      : layout === 'two-column'
        ? 'grid md:grid-cols-2 gap-6'
        : layout === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-6';

  const textSize = density === 'minimal' || density === 'moderate' ? 'text-sm' : 'text-base';

  return (
    <div className={`${container} ${textSize}`}>
      {widgets.map((w) => (
        <WidgetView key={w.id} widget={w} data={data} />
      ))}
      {nextStep && (
        <div className="glass-panel p-6 border border-quantum-cyan/30">
          <h3 className="text-sm text-cloud uppercase tracking-wider mb-3">Next Step</h3>
          <button className="w-full py-4 bg-quantum-cyan text-black font-bold rounded-xl hover:opacity-90 transition">
            {nextStep.label}
          </button>
        </div>
      )}
    </div>
  );
}

function WidgetView({ widget, data }: { widget: Widget; data: any }) {
  const value = get(data, widget.dataBinding);

  switch (widget.type) {
    case 'stat-card':
      return (
        <div className="glass-panel p-4 text-center">
          <div className="text-3xl font-mono text-quantum-cyan">{value ?? '—'}</div>
          <div className="text-xs uppercase text-cloud mt-1">{widget.title}</div>
        </div>
      );

    case 'metric-grid': {
      if (!value || typeof value !== 'object') return null;
      return (
        <div className="glass-panel p-4 space-y-2">
          <h3 className="text-sm font-semibold text-white">{widget.title}</h3>
          {Object.entries(value).map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm">
              <span className="text-cloud">{k}</span>
              <span className="text-white font-mono">{renderValue(v)}</span>
            </div>
          ))}
        </div>
      );
    }

    case 'table': {
      if (!Array.isArray(value)) return null;
      const cols: string[] = widget.props?.columns || (value[0] ? Object.keys(value[0]) : []);
      return (
        <div className="glass-panel p-4 overflow-x-auto">
          <h3 className="text-sm font-semibold text-white mb-3">{widget.title}</h3>
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="text-cloud text-xs uppercase border-b border-white/10">
                {cols.map((c) => (
                  <th key={c} className="py-2 px-2">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {value.map((row: any, i: number) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                  {cols.map((c) => (
                    <td key={c} className="py-2 px-2 text-white">
                      {row[c]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case 'alert-list': {
      if (!value || typeof value !== 'object') return null;
      return (
        <div className="glass-panel p-4 space-y-2">
          <h3 className="text-sm font-semibold text-white">{widget.title}</h3>
          {Object.entries(value).map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm">
              <span className="text-cloud">{k}</span>
              <span className="text-white font-mono">{renderValue(v)}</span>
            </div>
          ))}
        </div>
      );
    }

    case 'transaction-feed': {
      if (!Array.isArray(value)) return null;
      return (
        <div className="glass-panel p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white">{widget.title}</h3>
          {value.slice(0, 8).map((item: any) => (
            <div key={item.id} className="flex justify-between items-center border-b border-white/5 py-2">
              <span className="text-white">{item.format || `Phase ${item.phase}`}</span>
              <span className={item.paid ? 'text-quantum-green' : 'text-cloud'}>
                ${item.payment_amount ?? 0}
                {item.paid ? ' · paid' : ' · pending'}
              </span>
            </div>
          ))}
        </div>
      );
    }

    case 'deadline-list': {
      if (!Array.isArray(value)) return null;
      return (
        <div className="glass-panel p-4 space-y-2">
          <h3 className="text-sm font-semibold text-white">{widget.title}</h3>
          {value.map((item: any, i: number) => {
            const name = item.label || item.id;
            const status = item.status ? (
              <span className={item.status === 'ready' ? 'text-quantum-green' : 'text-quantum-gold'}>{item.status}</span>
            ) : item.met ? (
              <span className="text-quantum-green">✓</span>
            ) : (
              <span className="text-cloud">{item.due_date || 'open'}</span>
            );
            return (
              <div key={item.id ?? i} className="flex justify-between items-center border-b border-white/5 py-2">
                <span className="text-white">{name}</span>
                {status}
              </div>
            );
          })}
        </div>
      );
    }

    case 'queue-panel':
      return (
        <div className="glass-panel p-4">
          <h3 className="text-sm font-semibold text-white">{widget.title}</h3>
          <p className="text-2xl font-mono text-quantum-cyan">{value ?? 0}</p>
          <p className="text-xs text-cloud">pending payments</p>
        </div>
      );

    case 'entanglement-graph':
      return (
        <div className="glass-panel p-4">
          <h3 className="text-sm font-semibold text-white mb-3">{widget.title}</h3>
          <svg className="w-full h-32" viewBox="0 0 200 80" role="img" aria-label="Entanglement graph (placeholder)">
            <circle cx="100" cy="40" r="14" className="fill-surface stroke-quantum-cyan" strokeWidth="2" />
            <line x1="60" y1="40" x2="86" y2="40" stroke="#00F0FF" strokeOpacity="0.3" strokeWidth="2" />
            <line x1="114" y1="40" x2="140" y2="40" stroke="#00F0FF" strokeOpacity="0.3" strokeWidth="2" />
            <circle cx="50" cy="40" r="10" className="fill-surface stroke-quantum-cyan" strokeWidth="2" />
            <circle cx="150" cy="40" r="10" className="fill-surface stroke-quantum-cyan" strokeWidth="2" />
          </svg>
        </div>
      );

    case 'action-button':
      return (
        <button className="w-full py-4 bg-quantum-cyan text-black font-bold rounded-xl hover:opacity-90 transition">
          {widget.title}
        </button>
      );

    case 'text-block':
      return (
        <div className="glass-panel p-4">
          <p className="text-cloud">{widget.title}</p>
        </div>
      );

    case 'spacer':
      return <div className="h-6" />;

    case 'node-grid':
    default:
      return null;
  }
}
