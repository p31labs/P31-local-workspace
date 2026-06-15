import React from 'react';
import ReactDOM from 'react-dom/client';

const vscode = (window as any).acquireVsCodeApi?.();

const BusBarService: React.FC = () => {
  const [activeContext, setActiveContext] = React.useState<string>('No active file context.');
  const [fileName, setFileName] = React.useState<string>('Awaiting telemetry...');

  React.useEffect(() => {
    const handler = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === 'activeEditorChange') {
        setFileName(message.payload.fileName);
        setActiveContext(message.payload.content);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-emerald-400 font-mono p-4">
      <header className="border-b border-emerald-900/50 pb-4 mb-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔺</span>
          <h1 className="text-lg uppercase tracking-widest font-bold">P31 Copilot</h1>
        </div>
        <span className="text-xs bg-emerald-900/30 px-2 py-1 rounded">LAW FACET ACTIVE</span>
      </header>

      <div className="mb-6">
        <div className="text-xs text-emerald-500 mb-1">Active Workspace Context</div>
        <div className="bg-black/50 p-3 rounded border border-emerald-900/30 text-sm font-mono">
          <div className="text-emerald-400">File: {fileName}</div>
          <pre className="mt-2 text-emerald-600 text-xs overflow-auto max-h-60">
            {activeContext.slice(0, 2000)}
            {activeContext.length > 2000 && '...'}
          </pre>
        </div>
      </div>

      <footer className="mt-6 pt-4 border-t border-emerald-900/50 text-xs text-emerald-600 flex justify-between">
        <span>SECURED LOCALLY VIA ML-KEM-768</span>
        <span className="animate-pulse">🔺</span>
      </footer>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BusBarService />
  </React.StrictMode>
);
