import React, { useState, useEffect, useCallback } from 'react';

interface CaptureFormProps {
  onSubmit: (data: any) => void;
  loading: boolean;
  error: string | null;
  saveDraft?: (data: Partial<any>) => void;
  loadDraft?: () => Partial<any> | null;
  clearDraft?: () => void;
}

export function CaptureForm({ onSubmit, loading, error, saveDraft, loadDraft, clearDraft }: CaptureFormProps) {
  const [projectName, setProjectName] = useState('');
  const [coreProblem, setCoreProblem] = useState('');
  const [constraints, setConstraints] = useState('');
  const [assets, setAssets] = useState('');
  const [questions, setQuestions] = useState('');
  const [desiredState, setDesiredState] = useState('');
  const BATCH_STRATEGIES = ['depth-first', 'breadth-first', 'layer-sequential'] as const;
  type BatchStrategy = typeof BATCH_STRATEGIES[number];
  const [maxDepth, setMaxDepth] = useState(3);
  const [batchStrategy, setBatchStrategy] = useState<BatchStrategy>('depth-first');

  // Load draft on mount
  useEffect(() => {
    if (loadDraft) {
      const draft = loadDraft();
      if (draft) {
        if (draft.projectName) setProjectName(draft.projectName);
        if (draft.coreProblem) setCoreProblem(draft.coreProblem);
        if ((draft as any).constraints) setConstraints((draft as any).constraints);
        if ((draft as any).knownAssets) setAssets((draft as any).knownAssets);
        if ((draft as any).openQuestions) setQuestions((draft as any).openQuestions);
        if (draft.desiredEndState?.description) setDesiredState(draft.desiredEndState.description);
        if ((draft as any).recursive?.maxDepth) setMaxDepth((draft as any).recursive.maxDepth);
        if ((draft as any).recursive?.batchStrategy) setBatchStrategy((draft as any).recursive.batchStrategy);
      }
    }
  }, [loadDraft]);

  // Auto-save helper
  const autoSave = useCallback((patch: Partial<any>) => {
    if (saveDraft) saveDraft(patch);
  }, [saveDraft]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      projectName,
      coreProblem,
      constraints: constraints.split('\n').filter(Boolean).map((rule) => ({ id: `C${Math.random()}`, rule, severity: 'strong' })),
      knownAssets: assets.split('\n').filter(Boolean).map((name) => ({ name, description: name })),
      openQuestions: questions.split('\n').filter(Boolean).map((q, i) => ({ id: `Q${i+1}`, question: q, priority: 'medium' })),
      desiredEndState: { description: desiredState, targetStage: 'fruit', measurableCriteria: [], convergenceTarget: desiredState },
      metadata: { capturedAt: new Date().toISOString(), operator: 'pwa', source: 'api', tags: [] },
      recursive: {
        maxDepth,
        branchingFactor: 3,
        batchStrategy: batchStrategy,
        atomicThreshold: 1,
      },
    });
  };

  const formData = {
    projectName, coreProblem, constraints, knownAssets: assets, openQuestions: questions,
    desiredEndState: { description: desiredState }, recursive: { maxDepth, batchStrategy }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300">Project Name</label>
        <input
          type="text"
          value={projectName}
          onChange={(e) => { setProjectName(e.target.value); autoSave(formData); }}
          className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300">Core Problem / Opportunity</label>
        <textarea
          value={coreProblem}
          onChange={(e) => { setCoreProblem(e.target.value); autoSave(formData); }}
          rows={3}
          className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300">Constraints (one per line)</label>
        <textarea
          value={constraints}
          onChange={(e) => { setConstraints(e.target.value); autoSave(formData); }}
          rows={3}
          placeholder="e.g., Zero hardcoded identity"
          className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300">Known Assets (one per line)</label>
        <textarea
          value={assets}
          onChange={(e) => { setAssets(e.target.value); autoSave(formData); }}
          rows={2}
          placeholder="e.g., Cognitive Passport v4.1"
          className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300">Open Questions (one per line)</label>
        <textarea
          value={questions}
          onChange={(e) => { setQuestions(e.target.value); autoSave(formData); }}
          rows={2}
          placeholder="e.g., What is the exact ASAN grant amount?"
          className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300">Desired End State (FRUIT target)</label>
        <input
          type="text"
          value={desiredState}
          onChange={(e) => { setDesiredState(e.target.value); autoSave(formData); }}
          className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300">Max Depth (recursion)</label>
          <input
            type="number"
            min="1"
            max="5"
            value={maxDepth}
            onChange={(e) => { setMaxDepth(Math.min(5, Math.max(1, parseInt(e.target.value) || 1))); autoSave(formData); }}
            className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300">Batch Strategy</label>
          <select
            value={batchStrategy}
            onChange={(e) => { setBatchStrategy(e.target.value as BatchStrategy); autoSave(formData); }}
            className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white"
          >
            {BATCH_STRATEGIES.map((s) => (
              <option key={s} value={s}>{s.replace('-', ' ')}</option>
            ))}
          </select>
        </div>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 rounded font-medium disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Capture Brain Dump'}
      </button>
    </form>
  );
}
