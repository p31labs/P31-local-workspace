import { useState, useEffect, useCallback, useRef } from 'react';
import { semanticSearch, type SearchResult } from '../lib/semanticSearch';

export function useSemanticSearch() {
  const [isReady, setIsReady] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [count, setCount] = useState(0);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    semanticSearch.init()
      .then(() => semanticSearch.getCount().then(setCount))
      .then(() => setIsReady(true))
      .catch(() => setIsReady(false));
  }, []);

  const search = useCallback(async (query: string, limit = 10) => {
    if (!query.trim() || !isReady) return;
    setIsSearching(true);
    try {
      await semanticSearch.generateEmbedding(query);
      const searchResults = await semanticSearch.search(query, limit);
      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [isReady]);

  const indexContent = useCallback(async (
    id: string,
    content: string,
    sourceType: string,
    sourceId?: string,
    metadata?: any
  ) => {
    if (!isReady) return;
    try {
      await semanticSearch.indexContent(id, content, sourceType, sourceId, metadata);
      const newCount = await semanticSearch.getCount();
      setCount(newCount);
    } catch (error) {
      console.error('Indexing failed:', error);
    }
  }, [isReady]);

  const clearAll = useCallback(async () => {
    if (!isReady) return;
    await semanticSearch.clearAll();
    setCount(0);
    setResults([]);
  }, [isReady]);

  return {
    isReady,
    isSearching,
    results,
    count,
    search,
    indexContent,
    clearAll,
  };
}
