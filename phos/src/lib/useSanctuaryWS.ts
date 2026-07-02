import { useState, useEffect, useRef, useCallback } from 'react';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface SanctuaryMessage {
  type: 'message' | 'ack' | 'joined' | 'join' | 'error' | 'ping' | 'pong';
  from?: string;
  to?: string;
  body?: string;
  timestamp?: number;
  peerDid?: string;
}

interface UseSanctuaryWSOptions {
  roomId: string;
  did: string;
  signingKey: string;
  peerDid?: string;
  onMessage?: (msg: SanctuaryMessage) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
}

function calculateBackoff(
  attempt: number,
  baseDelay: number,
  maxDelay: number
): number {
  const exponential = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  const jitter = exponential * (0.8 + Math.random() * 0.4);
  return jitter;
}

export function useSanctuaryWS({
  roomId,
  did,
  signingKey,
  peerDid: initialPeerDid,
  onMessage,
  onStatusChange,
  autoReconnect = true,
  maxReconnectAttempts = 10,
  baseDelay = 1000,
  maxDelay = 30000,
}: UseSanctuaryWSOptions) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [peerDid, setPeerDid] = useState<string | undefined>(initialPeerDid);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageQueue = useRef<SanctuaryMessage[]>([]);
  const isClosing = useRef(false);

  const updateStatus = useCallback(
    (newStatus: ConnectionStatus) => {
      setStatus(newStatus);
      onStatusChange?.(newStatus);
    },
    [onStatusChange]
  );

  const connect = useCallback(() => {
    if (isClosing.current) return;

    const wsUrl = `wss://sovereign-justice-evidence.trimtab-signal.workers.dev/ws/sanctuary/${encodeURIComponent(roomId)}?did=${encodeURIComponent(did)}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      updateStatus('connected');
      reconnectAttempts.current = 0;

      const joinMsg: SanctuaryMessage = {
        type: 'join',
        from: did,
        to: peerDid || '',
        peerDid: peerDid || '',
      };
      ws.send(JSON.stringify(joinMsg));

      while (messageQueue.current.length > 0) {
        const msg = messageQueue.current.shift();
        if (msg) ws.send(JSON.stringify(msg));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as SanctuaryMessage;
        onMessage?.(data);

        if (data.type === 'joined' && data.peerDid) {
          setPeerDid(data.peerDid);
        }
      } catch {
        // non-JSON message (e.g., server ping) — ignore
      }
    };

    ws.onclose = () => {
      updateStatus('disconnected');
      wsRef.current = null;

      if (autoReconnect && !isClosing.current) {
        const delay = calculateBackoff(
          reconnectAttempts.current,
          baseDelay,
          maxDelay
        );

        reconnectTimer.current = setTimeout(() => {
          reconnectAttempts.current += 1;
          if (reconnectAttempts.current <= maxReconnectAttempts) {
            connect();
          } else {
            updateStatus('error');
          }
        }, delay);
      }
    };

    ws.onerror = () => {
      updateStatus('error');
    };

    wsRef.current = ws;
  }, [roomId, did, peerDid, updateStatus, autoReconnect, maxReconnectAttempts, baseDelay, maxDelay, onMessage]);

  const sendMessage = useCallback(
    (msg: SanctuaryMessage) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(msg));
        return true;
      }
      messageQueue.current.push(msg);
      return false;
    },
    []
  );

  const joinRoom = useCallback(
    (peer: string) => {
      setPeerDid(peer);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const joinMsg: SanctuaryMessage = {
          type: 'join',
          from: did,
          to: peer,
          peerDid: peer,
        };
        wsRef.current.send(JSON.stringify(joinMsg));
      }
    },
    [did]
  );

  const disconnect = useCallback(() => {
    isClosing.current = true;
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    updateStatus('disconnected');
  }, [updateStatus]);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    status,
    peerDid,
    sendMessage,
    joinRoom,
    disconnect,
    reconnect: connect,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
  };
}

export default useSanctuaryWS;
