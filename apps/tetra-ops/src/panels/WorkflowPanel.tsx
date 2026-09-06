import { useState, useCallback } from 'react';
import { TEMPLATES, executeWorkflow, type WorkflowTemplate, type StepResult } from '../lib/workflowEngine';
import { trackComponentUsage } from '@p31/ui';

const CAT_COLORS: Record<string, string> = {
  app: '#00f0ff',
  worker: '#a78bfa',
  passport: '#34d399',
  governance: '#fbbf24',
  payment: '#fb7185',
};

function paramsToDefaults(t: WorkflowTemplate): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of t.params) out[p.key] = p.default ?? '';
  return out;
}

export function WorkflowPanel() {
  const [selected, setSelected] = useState<WorkflowTemplate | null>(null);
  const [stepResults, setStepResults] = useState<StepResult[]>([]);
  const [running, setRunning] = useState(false);
  const [executionInputs, setExecutionInputs] = useState<Record<string, string>>({});

  const onStep = useCallback((stepId: string, status: StepResult['status'], output?: string) => {
    setStepResults((prev) =>
      prev.map((r) => (r.id === stepId ? { ...r, status, output } : r))
    );
  }, []);

  const handleRun = async () => {
    if (!selected) return;
    setRunning(true);
    trackComponentUsage(selected.name, 'tetra-ops');
    setStepResults(selected.steps.map((s) => ({ id: s.id, status: 'pending' as const })));
    await executeWorkflow(selected, executionInputs, onStep);
    setRunning(false);
  };

  const handleSelect = (t: WorkflowTemplate) => {
    setSelected(t);
    setStepResults([]);
    setExecutionInputs(paramsToDefaults(t));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11 }} data-mcp-tool="workflowPanel" data-mcp-state={selected ? selected.name : 'none'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(240,242,245,0.5)', textTransform: 'uppercase' }}>
          Golden Paths
        </div>
        {TEMPLATES.map((t) => {
          const catColor = CAT_COLORS[t.category] || 'rgba(240,242,245,0.3)';
          return (
          <button
            key={t.name}
            onClick={() => handleSelect(t)}
            data-mcp-tool="selectWorkflow"
            data-mcp-type="control"
            data-mcp-target={`workflow-${t.name}`}
            data-mcp-state={selected?.name === t.name ? 'active' : 'inactive'}
            style={{
              textAlign: 'left', padding: '8px 10px', borderRadius: 6,
              border: `1px solid ${selected?.name === t.name ? 'rgba(0,240,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
              background: selected?.name === t.name ? 'rgba(0,240,255,0.06)' : 'rgba(255,255,255,0.02)',
              color: 'rgba(240,242,245,0.7)', cursor: 'pointer', fontSize: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: catColor }} />
              <div style={{ fontWeight: 600, color: selected?.name === t.name ? '#00f0ff' : 'rgba(240,242,245,0.7)' }}>
                {t.name}
              </div>
              <span style={{ fontSize: 8, color: catColor, textTransform: 'uppercase', marginLeft: 'auto' }}>
                {t.category}
              </span>
            </div>
            <div style={{ fontSize: 9, color: 'rgba(240,242,245,0.35)', marginTop: 2 }}>
              {t.description} — {t.steps.length} steps
            </div>
          </button>
          );
        })}
      </div>

      {selected && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 0' }}>
          {/* Typed parameters */}
          {selected.params.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {selected.params.map((p) => (
                <div key={p.key} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <label style={{ fontSize: 9, color: 'rgba(240,242,245,0.4)' }}>
                    {p.label}{p.required ? ' *' : ''}
                  </label>
                  {p.type === 'select' && p.options ? (
                    <select
                      value={executionInputs[p.key] ?? ''}
                      onChange={(e) => setExecutionInputs((prev) => ({ ...prev, [p.key]: e.target.value }))}
                      data-mcp-tool="setWorkflowParam"
                      data-mcp-type="input"
                      data-mcp-target={`workflow-param-${p.key}`}
                      style={{
                        padding: '4px 8px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(255,255,255,0.03)', color: 'rgba(240,242,245,0.7)', fontSize: 10,
                        fontFamily: 'var(--p31-font-mono, monospace)', outline: 'none',
                      }}
                    >
                      {p.options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={p.type === 'number' ? 'number' : 'text'}
                      placeholder={p.default || p.key}
                      value={executionInputs[p.key] ?? ''}
                      onChange={(e) => setExecutionInputs((prev) => ({ ...prev, [p.key]: e.target.value }))}
                      data-mcp-tool="setWorkflowParam"
                      data-mcp-type="input"
                      data-mcp-target={`workflow-param-${p.key}`}
                      style={{
                        padding: '4px 8px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(255,255,255,0.03)', color: 'rgba(240,242,245,0.7)', fontSize: 10,
                        fontFamily: 'var(--p31-font-mono, monospace)', outline: 'none',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleRun}
            disabled={running}
            data-mcp-tool="runWorkflow"
            data-mcp-type="action"
            data-mcp-target="run-workflow"
            data-mcp-state={running ? 'running' : 'idle'}
            style={{
              padding: '6px 16px', borderRadius: 6, border: 'none',
              background: running ? 'rgba(0,240,255,0.08)' : 'rgba(0,240,255,0.15)',
              color: running ? 'rgba(240,242,245,0.4)' : '#00f0ff',
              fontSize: 10, fontWeight: 600, cursor: running ? 'default' : 'pointer',
              textTransform: 'uppercase',
            }}
          >
            {running ? 'Running…' : '▶ Run'}
          </button>

          {stepResults.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {selected.steps.map((s) => {
                const r = stepResults.find((sr) => sr.id === s.id);
                const status = r?.status ?? 'pending';
                const color = status === 'ok' ? '#34d399' : status === 'failed' ? '#fb7185' : status === 'running' ? '#00f0ff' : 'rgba(240,242,245,0.2)';
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.02)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: status === 'running' ? '0 0 8px #00f0ff' : 'none' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: status === 'ok' ? '#34d399' : status === 'failed' ? '#fb7185' : 'rgba(240,242,245,0.6)', fontWeight: status === 'running' ? 600 : 400 }}>
                        {s.id}
                      </div>
                      {r?.output && <div style={{ fontSize: 8, color: 'rgba(240,242,245,0.3)', fontFamily: 'var(--p31-font-mono, monospace)' }}>{r.output}</div>}
                    </div>
                    <span style={{ fontSize: 9, color: 'rgba(240,242,245,0.25)', textTransform: 'uppercase' }}>{status}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default WorkflowPanel;
