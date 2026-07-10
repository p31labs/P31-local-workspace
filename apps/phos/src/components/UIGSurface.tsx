import React from 'react';
import type { InterfaceDescription, Widget } from '@p31/interface-generator';
import { generatePhosInterface, phosRoleFromIdentity, samplePhosViewData } from '../lib/uig';

interface UIGSurfaceProps {
  surfaceId: string;
  spoons: number;
  // Precomputed by SurfaceContent; if omitted, regenerated from surfaceId + spoons.
  description?: InterfaceDescription;
  viewData?: Record<string, any>;
  // Component-mode surfaces render their existing UI inside the adaptive shell.
  children?: React.ReactNode;
}

const DENSITY_PAD: Record<string, string> = {
  minimal: 'p-3',
  moderate: 'p-4',
  detailed: 'p-5',
  exhaustive: 'p-6',
};
const DENSITY_GAP: Record<string, string> = {
  minimal: 'gap-3',
  moderate: 'gap-4',
  detailed: 'gap-5',
  exhaustive: 'gap-6',
};

function getVal(viewData: any, binding: string | null): any {
  if (!binding) return undefined;
  return viewData ? viewData[binding] : undefined;
}

function WidgetCard({ title, children, size }: { title?: string; children: React.ReactNode; size?: string }) {
  const span = size === 'full' ? 'md:col-span-2 lg:col-span-3' : size === 'large' ? 'md:col-span-2' : '';
  return (
    <div className={`phos-glass rounded-2xl ${DENSITY_PAD.moderate} ${span}`}>
      {title && <div className="text-[10px] uppercase tracking-widest opacity-50 mb-2">{title}</div>}
      {children}
    </div>
  );
}

function renderWidget(w: Widget, viewData: any): React.ReactNode {
  const val = getVal(viewData, w.dataBinding);
  switch (w.type) {
    case 'stat-card':
      return (
        <WidgetCard title={w.title}>
          <div className="text-2xl font-mono" style={{ color: 'var(--phos-accent)' }}>{val ?? '—'}</div>
        </WidgetCard>
      );
    case 'metric-grid': {
      const obj = val && typeof val === 'object' ? val : {};
      return (
        <WidgetCard title={w.title}>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(obj).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-sm">
                <span className="opacity-60">{k}</span>
                <span className="font-mono">{String(v)}</span>
              </div>
            ))}
          </div>
        </WidgetCard>
      );
    }
    case 'deadline-list': {
      const arr = Array.isArray(val) ? val : [];
      return (
        <WidgetCard title={w.title}>
          <ul className="space-y-2">
            {arr.map((d: any, i: number) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span>{d.label}</span>
                <span className="opacity-60 font-mono">{d.due_date ?? ''}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${d.met ? 'opacity-40' : 'phos-pill'}`}>
                  {d.met ? 'met' : 'open'}
                </span>
              </li>
            ))}
          </ul>
        </WidgetCard>
      );
    }
    case 'queue-panel':
      return (
        <WidgetCard title={w.title}>
          <div className="text-lg font-mono" style={{ color: 'var(--phos-accent)' }}>{val ?? 0} pending</div>
        </WidgetCard>
      );
    case 'transaction-feed': {
      const arr = Array.isArray(val) ? val : [];
      return (
        <WidgetCard title={w.title}>
          <ul className="space-y-1 text-sm">
            {arr.map((s: any, i: number) => (
              <li key={i} className="flex items-center justify-between">
                <span className="opacity-70">Phase {s.phase} · {s.format}</span>
                <span className="opacity-50 font-mono">{s.paid ? 'paid' : 'unpaid'}</span>
              </li>
            ))}
          </ul>
        </WidgetCard>
      );
    }
    case 'alert-list': {
      const obj = val && typeof val === 'object' ? val : {};
      return (
        <WidgetCard title={w.title}>
          <ul className="space-y-1 text-sm">
            {Object.entries(obj).map(([k, v]) => (
              <li key={k} className="flex items-center justify-between">
                <span className="opacity-70">{k}</span>
                <span className="font-mono">{String(v)}</span>
              </li>
            ))}
          </ul>
        </WidgetCard>
      );
    }
    case 'table': {
      const arr = Array.isArray(val) ? val : [];
      return (
        <WidgetCard title={w.title}>
          <table className="w-full text-sm">
            <tbody>
              {arr.map((row: any, i: number) => (
                <tr key={i} className="border-t border-[var(--phos-border)]">
                  {Object.values(row).map((cell: any, j: number) => (
                    <td key={j} className="py-1 pr-3 opacity-80">{String(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </WidgetCard>
      );
    }
    case 'text-block':
      return (
        <WidgetCard title={w.title}>
          <p className="text-sm opacity-80">{val ?? w.title ?? ''}</p>
        </WidgetCard>
      );
    case 'action-button':
      return (
        <button className="phos-pill px-4 py-2 text-sm" type="button">
          {w.title ?? 'Action'}
        </button>
      );
    case 'node-grid': {
      const arr = Array.isArray(val) ? val : [];
      return (
        <WidgetCard title={w.title}>
          <div className="grid grid-cols-3 gap-2">
            {arr.map((n: any, i: number) => (
              <div key={i} className="phos-pill text-center text-xs py-2">{n.id ?? n}</div>
            ))}
          </div>
        </WidgetCard>
      );
    }
    case 'entanglement-graph':
      return (
        <WidgetCard title={w.title ?? 'Entanglement'}>
          <div className="text-xs opacity-50">Graph view — wire to PHOS node canvas.</div>
        </WidgetCard>
      );
    case 'spacer':
      return <div className="h-4" />;
    default:
      return null;
  }
}

function layoutClass(layout: string, gap: string): string {
  switch (layout) {
    case 'two-column':
      return `grid grid-cols-1 md:grid-cols-2 ${gap}`;
    case 'grid':
      return `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${gap}`;
    case 'focus-mode':
      return `flex flex-col items-center justify-center ${gap}`;
    case 'single-column':
    case 'guided':
    default:
      return `flex flex-col ${gap}`;
  }
}

function CrisisOverlay() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div
        className="w-40 h-40 rounded-full border-2 mb-8"
        style={{
          borderColor: 'var(--phos-accent)',
          animation: 'phos-breathe 8s ease-in-out infinite',
        }}
      />
      <div className="text-lg" style={{ color: 'var(--phos-accent)' }}>Emergency Rest</div>
      <div className="text-xs opacity-50 mt-2">Press Escape when you are ready.</div>
      <style>{`@keyframes phos-breathe { 0%,100% { transform: scale(0.85); opacity: 0.5 } 50% { transform: scale(1.05); opacity: 1 } }`}</style>
    </div>
  );
}

export function UIGSurface({ surfaceId, spoons, description, viewData, children }: UIGSurfaceProps) {
  const role = phosRoleFromIdentity();
  const data = viewData ?? samplePhosViewData(surfaceId);
  const desc: InterfaceDescription =
    description ?? generatePhosInterface(surfaceId, { spoons, role, viewData: data });

  if (desc.crisisMode) return <CrisisOverlay />;

  const gap = DENSITY_GAP[desc.density] ?? DENSITY_GAP.moderate;
  return (
    <div className="h-full overflow-auto">
      <div className="text-[10px] uppercase tracking-widest opacity-40 mb-3">
        Adaptive · {role} · spoons {spoons} · {desc.layout}
      </div>
      <div className={layoutClass(desc.layout, gap)}>
        {children ?? desc.widgets.map((w) => (
          <React.Fragment key={w.id}>{renderWidget(w, data)}</React.Fragment>
        ))}
      </div>
      {desc.nextStep && (
        <div className="phos-pill mt-4 inline-flex items-center gap-2 text-sm px-4 py-2">
          <span className="opacity-60">Next:</span>
          <span style={{ color: 'var(--phos-accent)' }}>{desc.nextStep.label}</span>
        </div>
      )}
    </div>
  );
}

export default UIGSurface;
