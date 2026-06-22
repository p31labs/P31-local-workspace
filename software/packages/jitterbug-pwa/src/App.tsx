import React, { useState } from 'react';
import { CaptureForm } from './components/CaptureForm';
import { StatusDashboard } from './components/StatusDashboard';
import { useBrainDump } from './hooks/useBrainDump';

export function App() {
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const { submitBrainDump, loading, error, saveDraft, loadDraft, clearDraft } = useBrainDump();

  const handleSubmit = async (data: any) => {
    const id = await submitBrainDump(data);
    if (id) setSubmittedId(id);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <header className="max-w-3xl mx-auto mb-8">
        <h1 className="text-3xl font-light tracking-wide">🧠 Jitterbug</h1>
        <p className="text-slate-400 text-sm">Ambient Exocortex — Capture. Orchestrate. Converge.</p>
      </header>
      <main className="max-w-3xl mx-auto">
        {!submittedId ? (
          <CaptureForm
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
            saveDraft={saveDraft}
            loadDraft={loadDraft}
            clearDraft={clearDraft}
          />
        ) : (
          <StatusDashboard id={submittedId} />
        )}
      </main>
    </div>
  );
}
