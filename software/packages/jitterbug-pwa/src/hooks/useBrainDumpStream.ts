import { useEffect, useState, useCallback } from 'react';

interface StreamPayload {
  event: 'status' | 'done' | 'error';
  data?: {
    status: string;
    error?: string;
    axes?: any[];
    convergence?: any;
  };
  message?: string;
}

export function useBrainDumpStream(id: string | null, apiUrl: string) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [eventLog, setEventLog] = useState<StreamPayload[]>([]);

  const connect = useCallback(() => {
    if (!id || !apiUrl) return;

    setLoading(true);
    setEventLog([]);

    const eventSource = new EventSource(`${apiUrl}/api/brain-dump/${id}/stream`);

    eventSource.onmessage = (event) => {
      try {
        const parsed: StreamPayload = JSON.parse(event.data);
        setEventLog((prev) => [...prev.slice(-50), parsed]);

        if (parsed.event === 'status' && parsed.data) {
          setStatus(parsed.data);
        }
        if (parsed.event === 'done') {
          setLoading(false);
          eventSource.close();
        }
        if (parsed.event === 'error') {
          setLoading(false);
          eventSource.close();
        }
      } catch {
        // Ignore parse errors on non-JSON messages
      }
    };

    eventSource.onerror = () => {
      setLoading(false);
      eventSource.close();
    };

    return eventSource;
  }, [id, apiUrl]);

  useEffect(() => {
    const es = connect();
    return () => {
      if (es) es.close();
    };
  }, [connect]);

  return { status, loading, eventLog };
}
