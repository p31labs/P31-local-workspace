import { useState, useEffect } from 'react';

const ENV = (import.meta as any).env || {};
const API_URL: string = ENV.VITE_API_URL || '';

export function useUserTestStream() {
  const [signals, setSignals] = useState<any>({});
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const es = new EventSource(`${API_URL}/usertest/stream`);
    es.onopen = () => setConnected(true);
    es.onmessage = (e) => {
      try {
        setSignals(JSON.parse(e.data));
      } catch {
        /* ignore malformed frame */
      }
    };
    es.onerror = () => {
      setConnected(false);
      es.close();
    };
    return () => es.close();
  }, [API_URL]);

  return { signals, connected };
}
