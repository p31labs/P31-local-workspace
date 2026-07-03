import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useQuantumBrainDump, type ResearchDepth } from '../hooks/useQuantumBrainDump';

function ProgressIndicator({ progress }: { progress: { phase: string; completed: number; total: number; currentAxis?: string; message?: string } | null }) {
  if (!progress) return null;
  const pct = Math.min(100, Math.round((progress.completed / Math.max(1, progress.total)) * 100));
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-mono opacity-60">
        <span>{progress.phase}</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      {progress.currentAxis && (
        <div className="text-xs opacity-40 font-mono">⏳ {progress.currentAxis}</div>
      )}
      {progress.message && (
        <div className="text-xs opacity-30 italic">{progress.message}</div>
      )}
    </div>
  );
}

function PlanViewer({ plan }: { plan: { axes: Array<{ id: string; name: string; status: string }> } | null }) {
  if (!plan) return null;
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-mono opacity-60 mb-2">RESEARCH PLAN</div>
      {plan.axes.map((axis) => (
        <div key={axis.id} className="flex items-center gap-2 text-xs">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            axis.status === 'completed' ? 'bg-emerald-500' :
            axis.status === 'running' ? 'bg-yellow-500 animate-pulse' :
            axis.status === 'failed' ? 'bg-red-500' :
            'bg-white/20'
          }`} />
          <span className="opacity-70 truncate">{axis.name}</span>
          <span className="text-[10px] opacity-30 ml-auto font-mono shrink-0">{axis.status}</span>
        </div>
      ))}
    </div>
  );
}

function ReportViewer({ report }: { report: any }) {
  if (!report) return null;
  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {report.raw || `# ${report.title}\n\n## Summary\n\n${report.summary}\n\n${report.sections.map((s: any) => `## ${s.heading}\n\n${s.content}`).join('\n\n')}\n\n## Conclusion\n\n${report.conclusion}`}
      </ReactMarkdown>
      {report.sources && report.sources.length > 0 && (
        <div className="mt-8 pt-4 border-t border-white/10">
          <h4 className="text-xs font-mono opacity-60 mb-2">SOURCES</h4>
          <ul className="text-xs opacity-50 space-y-1">
            {report.sources.map((s: any, i: number) => (
              <li key={i}>{s.title}{s.url ? ` — ${s.url}` : ''}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function QuantumBrainDumpSurface() {
  const [query, setQuery] = useState('');
  const [depth, setDepth] = useState<ResearchDepth>('deep');
  const { status, plan, progress, report, error, startResearch, cancelResearch } = useQuantumBrainDump();
  const inputRef = useRef<HTMLInputElement>(null);

  const isProcessing = status === 'planning' || status === 'executing' || status === 'converging';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isProcessing) return;
    startResearch(query, depth);
  };

  return (
    <div className="flex flex-col h-full w-full p-4 md:p-6 overflow-hidden">
      <h1 className="text-xl font-light tracking-wide mb-4">Quantum Brain Dump</h1>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <div className="flex-1 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a research question…"
            disabled={isProcessing}
            className="flex-1 phos-glass rounded-lg px-4 py-2 text-sm outline-none focus:border-phos-primary/30 disabled:opacity-40"
          />
          {query && !isProcessing && (
            <button
              type="button"
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="px-3 rounded-lg text-xs opacity-40 hover:opacity-80"
            >
              ✕
            </button>
          )}
        </div>
        <select
          value={depth}
          onChange={(e) => setDepth(e.target.value as ResearchDepth)}
          disabled={isProcessing}
          className="phos-glass rounded-lg px-3 py-2 text-sm outline-none disabled:opacity-40"
        >
          <option value="quick">Quick</option>
          <option value="deep">Deep</option>
          <option value="full">Full</option>
        </select>
        <button
          type="submit"
          disabled={!query.trim() || isProcessing}
          className="px-4 py-2 rounded-lg bg-phos-primary text-black text-sm font-medium disabled:opacity-30 transition-opacity hover:opacity-80"
        >
          {isProcessing ? 'Researching…' : 'Research'}
        </button>
        {isProcessing && (
          <button
            type="button"
            onClick={cancelResearch}
            className="px-3 py-2 rounded-lg text-xs text-red-400/60 hover:text-red-400 transition-colors"
          >
            Cancel
          </button>
        )}
      </form>

      <div className="flex-1 overflow-y-auto space-y-6">
        {error && (
          <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400/80 text-sm">
            ⚠️ {error}
          </div>
        )}

        {isProcessing && (
          <div className="space-y-4 p-4 phos-glass rounded-xl">
            <ProgressIndicator progress={progress} />
            {plan && <PlanViewer plan={plan} />}
          </div>
        )}

        {status === 'completed' && report && (
          <div className="p-4 phos-glass rounded-xl">
            <ReportViewer report={report} />
          </div>
        )}

        {status === 'idle' && !query && (
          <div className="flex-1 flex items-center justify-center text-center opacity-30 text-sm">
            <div>
              <div className="text-4xl mb-4">🧠</div>
              <p>Dump your mind. Let the orchestrator sort it.</p>
              <p className="text-xs mt-2">Jitterbug decomposition with sovereign edge fallback</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
