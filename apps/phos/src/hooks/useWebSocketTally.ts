import { useEffect, useState, useRef, useCallback } from 'react';
import { endpoints } from '../config/endpoints';

interface TallyData {
  counts: { for: number; against: number; abstain: number };
  totalWeighted: number;
  timestamp: number;
}

export function useWebSocketTally(proposalId: string | null) {
  const [tally, setTally] = useState<TallyData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const pollTimerRef = useRef<number | null>(null);

  const connect = useCallback((proposalId: string) => {
    const wsHost = endpoints.governanceEngine.replace(/^https?:\/\//, '');
    const wsProtocol = endpoints.governanceEngine.startsWith('https') ? 'wss' : 'ws';
    const ws = new WebSocket(`${wsProtocol}://${wsHost}/tally?proposalId=${encodeURIComponent(proposalId)}`);

    ws.onopen = () => { setIsConnected(true); setError(null); };
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === 'tally_update') setTally(data.tally);
      } catch {}
    };
    ws.onclose = () => {
      setIsConnected(false);
      wsRef.current = null;
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = window.setTimeout(() => connect(proposalId), 3000);
    };
    ws.onerror = () => setError('WebSocket error — falling back to polling');
    wsRef.current = ws;
  }, []);

  const startPolling = useCallback((proposalId: string) => {
    if (pollTimerRef.current) return;
    pollTimerRef.current = window.setInterval(async () => {
      try {
        const res = await fetch(`${endpoints.governanceEngine}/proposals/${encodeURIComponent(proposalId)}/tally`);
        const data = await res.json();
        setTally({
          counts: data.weightedVotes,
          totalWeighted: data.totalWeighted,
          timestamp: Date.now(),
        });
      } catch {}
    }, 3000);
  }, []);

  useEffect(() => {
    if (!proposalId) return;
    let fallbackTimer: number;

    connect(proposalId);
    fallbackTimer = window.setTimeout(() => {
      if (!isConnected) startPolling(proposalId);
    }, 4000);

    return () => {
      wsRef.current?.close();
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
      window.clearTimeout(fallbackTimer);
    };
  }, [proposalId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { tally, isConnected, error };
}
