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

export function ChaosIngest({ theme, spoons = 5 }: { theme: Record<string, string>; spoons?: number }) {
  const [text, setText] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);
  const { embed } = useEmbeddingWorker();
  const statusTimer = useRef<ReturnType<typeof setTimeout>>();
  const mounted = useRef(true);

  const isCrisis = spoons <= 1;
  const isBridge = spoons >= 2 && spoons <= 3;
  const canCompute = spoons >= 4;

  useEffect(() => {
    const doc = new Y.Doc();
    ydocRef.current = doc;
    const ytext = doc.getText('content');
    ytextRef.current = ytext;

    const saved = loadDraft();
    if (saved && !isCrisis) {
      ytext.insert(0, saved);
    }

    let handler: (() => void) | null = null;
    if (!isCrisis) {
      handler = () => {
        const val = ytext.toString();
        setText(val);
      };
      ytext.observe(handler);
      doc.on('update', (_, origin) => {
        if (origin !== 'remote' && ytext.length > 0 && !isCrisis) {
          persistDraft(ytext.toString());
        }
      });
    }

    setText(isCrisis ? '' : ytext.toString());

    return () => {
      mounted.current = false;
      if (handler) ytext.unobserve(handler);
      doc.destroy();
      ydocRef.current = null;
      ytextRef.current = null;
    };
  }, [isCrisis]);

  const handleTextChange = useCallback((value: string) => {
    const ytext = ytextRef.current;
    if (!ytext || !ydocRef.current) return;
    ydocRef.current.transact(() => {
      ytext.delete(0, ytext.length);
      if (value) ytext.insert(0, value);
    }, 'user');
  }, []);

  const handleIngest = useCallback(async () => {
    if (!text.trim() || syncing) return;
    if (!canCompute) return;
    setSyncing(true);
    setStatus(isBridge ? 'LOCAL_ONLY // Bridge mode' : 'COMMITTING_TO_LOCAL_VAULT...');

    try {
      if (isBridge) {
        if (mounted.current) {
          setStatus('SAVED_LOCALLY // Compute suspended');
          if (statusTimer.current) clearTimeout(statusTimer.current);
          statusTimer.current = setTimeout(() => mounted.current && setStatus(null), 2000);
        }
        setSyncing(false);
        setText('');
        return;
      }

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
  }, [text, syncing, embed, canCompute, isBridge]);

  const placeholder = isCrisis
    ? 'Write anything here. It stays on this device. It is safe.'
    : 'ENTER_JOURNAL_ENTRY // LOCAL_STORAGE_ONLY';

  return (
    <div className="space-y-4 w-full">
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <span className="text-xs font-mono tracking-widest uppercase opacity-60">Somatic Buffer Engine</span>
        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${isCrisis ? 'bg-zinc-800 text-zinc-400 border-zinc-700' : 'bg-orange-950/40 text-orange-400 border-orange-900-30'}`}>
          {isCrisis ? 'Crisis Mode' : 'Isolated Origin'}
        </span>
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
          {status || (isCrisis ? 'CRISIS // Text only, no processing' : isBridge ? 'BRIDGE // Local save only' : 'READY // WAITING FOR SENSOR DATA')}
        </p>
        <button
          onClick={handleIngest}
          disabled={!text.trim() || syncing || !canCompute}
          className={`px-6 py-2.5 text-xs tracking-widest font-mono uppercase whitespace-nowrap ${theme.button} disabled:opacity-30 disabled:pointer-events-none`}
        >
          {syncing ? 'PROCESSING...' : isBridge ? 'SAVE_LOCALLY' : isCrisis ? 'SANCTUARY' : 'COMMIT_TO_VAULT'}
        </button>
      </div>
    </div>
  );
}
