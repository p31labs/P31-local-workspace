import { useState, useEffect, useCallback } from 'react';
import type { BrainDump } from '@p31/brain-dump-orchestrator';

const STORAGE_KEY = 'jitterbug-draft';
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

export function useBrainDump() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || '';

  // Auto-save draft to localStorage on changes (handled by form component via setDraft)
  const saveDraft = useCallback((data: Partial<BrainDump>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* quota exceeded — silently ignore */ }
  }, []);

  const loadDraft = useCallback((): Partial<BrainDump> | null => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
  }, []);

  const submitBrainDump = async (data: BrainDump) => {
    setLoading(true);
    setError(null);

    let attempt = 0;
    while (attempt < MAX_RETRIES) {
      try {
        const res = await fetch(`${API_URL}/api/brain-dump`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          throw new Error(err.error || err.details || `Submission failed (${res.status})`);
        }

        const { id } = await res.json();
        clearDraft();
        return id;
      } catch (err: any) {
        attempt++;
        const isLast = attempt >= MAX_RETRIES;
        if (isLast) {
          setError(err.message || 'Unknown error');
          return null;
        }
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        console.warn(`[useBrainDump] Retry ${attempt}/${MAX_RETRIES - 1} after ${delay}ms:`, err.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    return null;
  };

  return { submitBrainDump, loading, error, saveDraft, loadDraft, clearDraft };
}
