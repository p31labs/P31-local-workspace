import { useState, useCallback } from 'react';
import {
  CrisisOverlay,
  type InterfaceDescription,
  type Widget,
  generateInterfaceFromIntent,
} from '@p31/interface-generator';

interface BondingUIGSurfaceProps {
  spoons: number;
  description?: InterfaceDescription;
  onReady?: () => void;
  intentPrompt?: string;
}

function getVal(viewData: any, binding: string | null): any {
  if (!binding) return undefined;
  return viewData ? viewData[binding] : undefined;
}

function WidgetCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-4" style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
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
          <div className="text-2xl font-mono" style={{ color: '#00F0FF' }}>{val ?? '—'}</div>
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
    case 'text-block':
      return (
        <WidgetCard title={w.title}>
          <p className="text-sm opacity-80">{val ?? w.title ?? ''}</p>
        </WidgetCard>
      );
    case 'action-button':
      return (
        <button className="px-4 py-2 text-sm rounded-lg" type="button" style={{
          background: 'rgba(0,240,255,0.15)', color: '#00F0FF',
        }}>
          {w.title ?? 'Action'}
        </button>
      );
    case 'queue-panel':
      return (
        <WidgetCard title={w.title}>
          <div className="text-lg font-mono" style={{ color: '#00F0FF' }}>{val ?? 0} pending</div>
        </WidgetCard>
      );
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
    case 'spacer':
      return <div className="h-4" />;
    default:
      return (
        <WidgetCard title={w.title}>
          <div className="text-xs opacity-40">Widget: {w.type}</div>
        </WidgetCard>
      );
  }
}

function layoutClass(layout: string): string {
  switch (layout) {
    case 'two-column':
      return 'grid grid-cols-1 md:grid-cols-2 gap-4';
    case 'grid':
      return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';
    case 'focus-mode':
      return 'flex flex-col items-center justify-center gap-4';
    case 'single-column':
    case 'guided':
    default:
      return 'flex flex-col gap-4';
  }
}

export function BondingUIGSurface({ spoons, description, onReady, intentPrompt }: BondingUIGSurfaceProps) {
  const baseDesc: InterfaceDescription = description ?? generateInterfaceFromIntent({
    prompt: intentPrompt ?? 'molecular bonding workspace',
    spoons,
    role: 'participant',
  });

  const [activeDesc, setActiveDesc] = useState<InterfaceDescription>(baseDesc);
  const [prompt, setPrompt] = useState(intentPrompt ?? '');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    const genDesc = generateInterfaceFromIntent({ prompt: prompt.trim(), spoons, role: 'participant' });
    setActiveDesc(genDesc);
    setIsGenerating(false);
  }, [prompt, spoons]);

  if (activeDesc.crisisMode) return <CrisisOverlay onReady={onReady ?? (() => {})} />;

  return (
    <div className="h-full overflow-auto">
      {intentPrompt !== undefined && (
        <div className="mb-4 rounded-2xl p-3 flex gap-2 items-center" style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
            placeholder="Describe what you want to see..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-30"
            aria-label="Generate interface from natural language prompt"
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="px-3 py-1.5 text-xs font-medium rounded-lg disabled:opacity-30"
            style={{ background: 'rgba(0,240,255,0.15)', color: '#00F0FF' }}
            type="button"
            aria-label="Generate UI from prompt"
          >
            {isGenerating ? '...' : 'Generate'}
          </button>
        </div>
      )}
      <div className="text-[10px] uppercase tracking-widest opacity-40 mb-3">
        Adaptive · participant · spoons {spoons} · {activeDesc.layout}
      </div>
      <div className={layoutClass(activeDesc.layout)}>
        {activeDesc.widgets.map((w) => (
          <div key={w.id}>{renderWidget(w, null)}</div>
        ))}
      </div>
      {activeDesc.nextStep && (
        <div className="mt-4 inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg" style={{
          background: 'rgba(0,240,255,0.1)', color: '#00F0FF',
        }}>
          <span className="opacity-60">Next:</span>
          <span>{activeDesc.nextStep.label}</span>
        </div>
      )}
    </div>
  );
}

export default BondingUIGSurface;
