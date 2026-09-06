import React, { useEffect, useState } from 'react';

interface BrainDumpSummary {
  id: string;
  project_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  error?: string;
}

interface HistoryViewProps {
  apiUrl: string;
  onSelect: (id: string) => void;
}

export function HistoryView({ apiUrl, onSelect }: HistoryViewProps) {
  const [items, setItems] = useState<BrainDumpSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/brain-dumps`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setItems(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [apiUrl]);

  const statusColor = (s: string) => {
    switch (s) {
      case 'completed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'processing': return 'text-yellow-400';
      default: return 'text-slate-400';
    }
  };

  if (loading) return <div className="text-slate-400">Loading history...</div>;
  if (error) return <div className="text-red-400">Error: {error}</div>;
  if (items.length === 0) return <div className="text-slate-400">No brain dumps yet.</div>;

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold">Brain Dump History</h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="bg-slate-800 border border-slate-700 rounded p-3">
            <button
              onClick={() => onSelect(item.id)}
              className="w-full text-left hover:bg-slate-700 rounded transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium text-white">{item.project_name}</span>
                  {item.error && <span className="ml-2 text-xs text-red-400">(error)</span>}
                </div>
                <span className={`text-xs font-mono ${statusColor(item.status)}`}>{item.status}</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {new Date(item.created_at).toLocaleString()} · ID: {item.id.slice(0, 8)}...
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
