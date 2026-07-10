import React, { useState } from 'react';
import { CaptureForm } from './components/CaptureForm';
import { StatusDashboard } from './components/StatusDashboard';
import { HistoryView } from './components/HistoryView';
import { useBrainDump } from './hooks/useBrainDump';
import UserTestDashboard from './components/usertest/UserTestDashboard';

type View = 'capture' | 'history' | 'status' | 'usertest';

export function App() {
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [view, setView] = useState<View>('capture');
  const { submitBrainDump, loading, error, saveDraft, loadDraft, clearDraft } = useBrainDump();

  const handleSubmit = async (data: any) => {
    const id = await submitBrainDump(data);
    if (id) {
      setSubmittedId(id);
      setView('status');
    }
  };

  const handleSelectFromHistory = (id: string) => {
    setSubmittedId(id);
    setView('status');
  };

  const API_URL = import.meta.env.VITE_API_URL || '';

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <header className="max-w-3xl mx-auto mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-light tracking-wide">🧠 Jitterbug</h1>
            <p className="text-slate-400 text-sm">Ambient Exocortex — Capture. Orchestrate. Converge.</p>
          </div>
          <nav className="flex gap-2">
            <button
              onClick={() => setView('capture')}
              className={`px-3 py-1 text-sm rounded ${view === 'capture' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              Capture
            </button>
            <button
              onClick={() => { setSubmittedId(null); setView('history'); }}
              className={`px-3 py-1 text-sm rounded ${view === 'history' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              History
            </button>
            <button
              onClick={() => setView('usertest')}
              className={`px-3 py-1 text-sm rounded ${view === 'usertest' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              Testing
            </button>
          </nav>
        </div>
      </header>
      <main className="max-w-3xl mx-auto">
        {view === 'usertest' && <UserTestDashboard />}
        {view === 'capture' && !submittedId && (
          <CaptureForm
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
            saveDraft={saveDraft}
            loadDraft={loadDraft}
            clearDraft={clearDraft}
          />
        )}
        {view === 'history' && !submittedId && (
          <HistoryView apiUrl={API_URL} onSelect={handleSelectFromHistory} />
        )}
        {view === 'status' && submittedId && (
          <StatusDashboard id={submittedId} />
        )}
      </main>
    </div>
  );
}
