import React, { useState, useCallback, useRef, useEffect } from 'react';
import { getChaosVault } from '../lib/ChaosVault';

import { endpoints } from '../config/endpoints';

const RAG_PROXY = endpoints.ragProxy;
const STREAM_TIMEOUT = 120_000;

interface SearchResult {
  source_door: string;
  raw_text: string;
  created_at: string;
  score: number;
}

export function ShakeStream({ theme, initialQuery }: { theme: Record<string, string>; initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [streamedText, setStreamedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    return () => {
      mounted.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    if (mounted.current) setLoading(false);
  }, []);

  /* v8 ignore start */
  const executeSearch = useCallback(async (searchText: string) => {
    if (!searchText.trim()) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setResults([]);
    setStreamedText('');
    setSearched(true);
    setError(null);

    try {
      const db = await getChaosVault();
      const res = await db.query(
        'SELECT source_door, raw_text, created_at FROM unified_knowledge_graph WHERE raw_text ILIKE $1 ORDER BY created_at DESC LIMIT 5',
        [`%${searchText}%`],
      );
      const entries = res.rows as SearchResult[];

      if (entries.length === 0) {
        if (mounted.current) {
          setStreamedText('No matching entries found in local vault.');
          setError(null);
        }
        return;
      }

      if (mounted.current) {
        setResults(entries);
      }

      const context = entries
        .map((e) => `[${e.source_door}] ${e.raw_text.substring(0, 200)}`)
        .join('\n\n---\n\n');

      const prompt = `You are the PHOS RAG oracle. Given these journal entries, answer the user's question concisely.\n\nContext:\n${context}\n\nQuestion: ${searchText}`;

      const streamResp = await fetch(`${RAG_PROXY}/api/v3/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen2.5-coder:latest',
          messages: [{ role: 'user', content: prompt }],
          stream: true,
          max_tokens: 512,
        }),
        signal: controller.signal,
      });

      if (!streamResp.ok) throw new Error(`STREAM_ERR_${streamResp.status}`);
      if (!streamResp.body) throw new Error('NO_STREAM_BODY');

      const reader = streamResp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      const streamTimer = setTimeout(() => {
        controller.abort('STREAM_TIMEOUT');
      }, STREAM_TIMEOUT);

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const payload = trimmed.slice(6);
            if (payload === '[DONE]') break;

            try {
              const json = JSON.parse(payload);
              const delta = json.choices?.[0]?.delta?.content ?? '';
              if (delta) {
                accumulated += delta;
                if (mounted.current) setStreamedText(accumulated);
              }
            } catch {
              /* skip malformed SSE lines */
            }
          }
        }
      } finally {
        clearTimeout(streamTimer);
        reader.cancel().catch(() => {});
      }
    } catch (err: unknown) {
      if (!mounted.current) return;
      if (err instanceof DOMException && err.name === 'AbortError') {
        setGenerationCancelled(true);
      } else {
        setError(err instanceof Error ? err.message : 'SEARCH_FAILED');
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);
  /* v8 ignore stop */

  const [generationCancelled, setGenerationCancelled] = useState(false);

  useEffect(() => {
    if (generationCancelled) {
      const t = setTimeout(() => setGenerationCancelled(false), 2000);
      return () => clearTimeout(t);
    }
  }, [generationCancelled]);

  const hasResults = results.length > 0 || streamedText.length > 0;

  return (
    <div className="w-full space-y-3 font-mono text-xs">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && executeSearch(query)}
          placeholder="Search your journal..."
          className="flex-1 px-3 py-2 text-xs rounded-lg border outline-none bg-black/40 border-white/10 text-white/80 placeholder:text-white/30"
        />
        {loading ? (
          <button
            onClick={stopGeneration}
            className="px-4 py-2 text-xs border border-red-500/30 text-red-400 rounded-lg hover:bg-red-900/20"
          >
            STOP
          </button>
        ) : (
          <button
            onClick={() => executeSearch(query)}
            disabled={!query.trim()}
            className="px-4 py-2 text-xs border border-emerald-500/30 text-emerald-400 rounded-lg hover:bg-emerald-900/20 disabled:opacity-30"
          >
            SEARCH
          </button>
        )}
      </div>
      {searched && (
        <div className={`p-4 rounded-xl border max-h-60 overflow-y-auto bg-black/40 border-white/5`}>
          {error && <p className="text-red-400/70">{error}</p>}
          {generationCancelled && <p className="text-amber-400/70 italic">Generation halted.</p>}
          {hasResults && (
            <div className="space-y-3">
              {streamedText && (
                <div className="whitespace-pre-wrap leading-relaxed tracking-wide text-white/90">
                  {streamedText}
                  {loading && <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse ml-1" />}
                </div>
              )}
              {results.length > 0 && (
                <div className="space-y-2 border-t border-white/5 pt-2">
                  {results.map((r, i) => (
                    <div key={i} className="text-white/60 text-[11px]">
                      <span className="text-emerald-400">[{r.source_door}]</span>{' '}
                      {r.raw_text.substring(0, 120)}{r.raw_text.length > 120 ? '...' : ''}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {!hasResults && !loading && !error && (
            <span className="opacity-40 italic">Enter a search term to query your local vault.</span>
          )}
          {loading && !hasResults && (
            <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse" />
          )}
        </div>
      )}
    </div>
  );
}
