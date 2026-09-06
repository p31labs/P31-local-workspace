import { useState, useEffect, useCallback } from 'react';

const ENV = (import.meta as any).env || {};
const API_URL: string = ENV.VITE_API_URL || '';
const PSK: string | undefined = ENV.VITE_API_PSK;

export function useUserTest(endpoint: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (PSK) headers['Authorization'] = `Bearer ${PSK}`;
      const res = await fetch(`${API_URL}/usertest/${endpoint}`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e: any) {
      setError(e.message || 'fetch failed');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const mutate = useCallback(async (method: string, body?: any) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (PSK) headers['Authorization'] = `Bearer ${PSK}`;
    const res = await fetch(`${API_URL}/usertest/${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }, [endpoint]);

  return { data, loading, error, refetch: fetchData, mutate };
}
