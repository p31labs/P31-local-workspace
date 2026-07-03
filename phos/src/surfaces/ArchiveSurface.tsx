import React, { useState, useCallback } from 'react';
import { useSemanticSearch } from '../hooks/useSemanticSearch';

export function ArchiveSurface({ spoons }: { spoons: number }) {
  const [query, setQuery] = useState('');
  const {
    isReady,
    isSearching,
    results,
    count,
    search,
    clearAll,
  } = useSemanticSearch();

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      search(query);
    }
  }, [query, search]);

  const handleClear = useCallback(() => {
    setQuery('');
    clearAll();
  }, [clearAll]);

  const isSanctuary = spoons <= 1;

  return (
    <div className={`p-6 ${isSanctuary ? '' : 'bg-purple-950/10'} text-slate-100 min-h-screen font-mono border border-purple-500/20`}>
      <header className="border-b border-purple-500/20 pb-4 mb-6">
        <h1 className="text-2xl text-purple-400 font-bold tracking-wider">SOVEREIGN ARCHIVE</h1>
        <p className="text-xs text-slate-400">
          {isReady ? `${count} memories indexed` : 'Initializing local semantic engine...'}
        </p>
      </header>

      {!isSanctuary && (
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your sovereign memory..."
              disabled={!isReady}
              className="flex-1 phos-glass rounded-xl px-4 py-3 text-sm bg-transparent border-none outline-none text-[var(--phos-text)] placeholder-[var(--phos-text)]/30"
            />
            <button
              type="submit"
              disabled={!query.trim() || !isReady || isSearching}
              className="px-6 py-3 rounded-xl phos-glass text-sm font-mono uppercase tracking-widest disabled:opacity-20 disabled:cursor-default hover:bg-white/5 transition-colors"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
            {count > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-3 rounded-xl phos-glass text-sm font-mono opacity-60 hover:opacity-100 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      )}

      <div className="space-y-3">
        {results.length === 0 && !isSearching && query.trim() && (
          <div className="text-center text-slate-500 py-12">
            <p className="text-sm font-light">No matches found.</p>
            <p className="text-xs opacity-50 mt-1">Try rephrasing your query.</p>
          </div>
        )}
        {results.length === 0 && !isSearching && !query.trim() && (
          <div className="text-center text-slate-500 py-12">
            <p className="text-sm font-light">Search your sovereign memory.</p>
            <p className="text-xs opacity-50 mt-1">All data stays on your device. Zero telemetry.</p>
          </div>
        )}
        {results.map((result) => (
          <div
            key={result.id}
            className="phos-glass rounded-xl p-4 glass-text-scrim"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="text-sm font-light text-slate-200 leading-relaxed">
                  {result.content}
                </div>
                <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-500 font-mono">
                  <span className="uppercase tracking-widest">{result.sourceType}</span>
                  <span>·</span>
                  <span>{(result.similarity * 100).toFixed(1)}% match</span>
                  {result.metadata?.timestamp && (
                    <>
                      <span>·</span>
                      <span>{new Date(result.metadata.timestamp).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </div>
              <div
                className="w-1 self-stretch rounded-full"
                style={{
                  background: `linear-gradient(to bottom, var(--phos-primary), var(--phos-accent))`,
                  opacity: 0.3 + result.similarity * 0.7,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
