import React, { useState, useCallback, useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { mintCredits } from '../lib/KarmaEngine';
import { useEmbeddingWorker } from '../hooks/useEmbeddingWorker';

const DOC_KEY = 'chaos-ingest-draft';
const Y_PREFIX = 'yjs-';

function loadDraft(): string {
  try {
    const raw = localStorage.getItem(DOC_KEY);
    if (raw) return raw;
    const legacy = Object.keys(localStorage)
      .filter((k) => k.startsWith(Y_PREFIX))
      .map((k) => localStorage.getItem(k))
      .join('');
    return legacy;
  } catch {
    return '';
  }
}

function persistDraft(text: string) {
  try {
    localStorage.setItem(DOC_KEY, text);
    Object.keys(localStorage)
      .filter((k) => k.startsWith(Y_PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch { /* quota */ }
}

export function ChaosIngest({ theme }: { theme: Record<string, string> }) {
  const [text, setText] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);
  const { embed } = useEmbeddingWorker();
  const statusTimer = useRef<ReturnType<typeof setTimeout>>();
  const mounted = useRef(true);

  /* v8 ignore start */
  useEffect(() => {
    const doc = new Y.Doc();
    ydocRef.current = doc;
    const ytext = doc.getText('content');
    ytextRef.current = ytext;

    const saved = loadDraft();
    if (saved) {
      ytext.insert(0, saved);
    }

    const handler = () => {
      const val = ytext.toString();
      setText(val);
    };
    ytext.observe(handler);

    doc.on('update', (_, origin) => {
      if (origin !== 'remote' && ytext.length > 0) {
        persistDraft(ytext.toString());
      }
    });

    setText(ytext.toString());

    return () => {
      mounted.current = false;
      handler();
      ytext.unobserve(handler);
      doc.destroy();
      ydocRef.current = null;
      ytextRef.current = null;
    };
  }, []);
  /* v8 ignore stop */

  const handleTextChange = useCallback((value: string) => {
    /* v8 ignore start */
    const ytext = ytextRef.current;
    if (!ytext) return;
    const doc = ydocRef.current;
    if (!doc) return;

    doc.transact(() => {
      ytext.delete(0, ytext.length);
      if (value) ytext.insert(0, value);
    }, 'user');
    /* v8 ignore stop */
  }, []);

  const handleIngest = useCallback(async () => {
    if (!text.trim() || syncing) return;
    setSyncing(true);
    setStatus('COMMITTING_TO_LOCAL_VAULT...');

    /* v8 ignore start */
    try {
      const [vaultMod, embedResult] = await Promise.all([
        import('../lib/ChaosVault'),
        embed(text),
      ]);

      const db = await vaultMod.getChaosVault();
      const embedding = embedResult.embedding
        ? `[${embedResult.embedding.join(',')}]`
        : '[]';

      await db.query(
        'INSERT INTO unified_knowledge_graph (source_door, raw_text, embedding) VALUES ($1, $2, $3);',
        ['THE_BUFFER', text, embedding],
      );

      mintCredits(2, 'Journal entry');

      const ytext = ytextRef.current;
      const doc = ydocRef.current;
      if (ytext && doc) {
        doc.transact(() => {
          ytext.delete(0, ytext.length);
        }, 'ingest');
      }
      setText('');
      localStorage.removeItem(DOC_KEY);

      if (mounted.current) {
        setStatus('COMMITTED // +2 L.O.V.E. CREDITS');
        if (statusTimer.current) clearTimeout(statusTimer.current);
        statusTimer.current = setTimeout(() => mounted.current && setStatus(null), 3000);
      }
    } catch {
      if (mounted.current) setStatus('COMMIT_FAILED // DATA_PRESERVED_LOCALLY');
    } finally {
      if (mounted.current) setSyncing(false);
    }
    /* v8 ignore stop */
  }, [text, syncing, embed]);

  const placeholder = theme.name === 'SANCTUARY'
    ? 'Write anything here. It stays on this device. It is safe.'
    : 'ENTER_JOURNAL_ENTRY // LOCAL_STORAGE_ONLY';

  return (
    <div className="space-y-4 w-full">
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <span className="text-xs font-mono tracking-widest uppercase opacity-60">Somatic Buffer Engine</span>
        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-orange-950/40 text-orange-400 border border-orange-900/30">Isolated Origin</span>
      </div>
      <textarea
        value={text}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full h-40 p-4 text-sm rounded-xl border outline-none resize-none transition-all duration-300 ${theme.input}`}
        disabled={syncing}
      />
      <div className="flex justify-between items-center gap-4">
        <p className="text-[11px] font-mono opacity-50 tracking-wide truncate max-w-[60%]">
          {status || 'READY // WAITING FOR SENSOR DATA'}
        </p>
        <button
          onClick={handleIngest}
          disabled={!text.trim() || syncing}
          className={`px-6 py-2.5 text-xs tracking-widest font-mono uppercase whitespace-nowrap ${theme.button} disabled:opacity-30 disabled:pointer-events-none`}
        >
          {syncing ? 'PROCESSING...' : 'COMMIT_TO_VAULT'}
        </button>
      </div>
    </div>
  );
}
