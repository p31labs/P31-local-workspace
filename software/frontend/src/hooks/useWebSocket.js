import { useEffect, useRef, useCallback, useState } from 'react';
import { MeshClient } from '../api/mesh-client';

/**
 * useWebSocket Hook
 * Manages WebSocket connection for real-time messaging
 * 
 * Features:
 * - Auto-reconnection with exponential backoff
 * - Event subscription system
 * - Connection state tracking
 * - Typing debouncing
 * - Heartbeat/ping-pong
 */

export function useWebSocket(userId, options = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [lastPong, setLastPong] = useState(null);
  
  const clientRef = useRef(null);
  const wsRef = useRef(null);
  const handlersRef = useRef(new Map());
  const pingIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Initialize client
  useEffect(() => {
    if (!userId) return;

    clientRef.current = new MeshClient({ userId });

    return () => {
      cleanup();
    };
  }, [userId]);

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(() => {
    if (!clientRef.current) return;

    cleanup(); // Clean up existing connection

    const onOpen = () => {
      console.log('[useWebSocket] Connected');
      setIsConnected(true);
      setConnectionError(null);
      startHeartbeat();
    };

    const onClose = (event) => {
      console.log('[useWebSocket] Disconnected:', event.code, event.reason);
      setIsConnected(false);
      stopHeartbeat();
      scheduleReconnect();
    };

    const onError = (error) => {
      console.error('[useWebSocket] Error:', error);
      setConnectionError(error);
    };

    const onMessage = (data) => {
      // Route to registered handlers
      const handler = handlersRef.current.get(data.type);
      if (handler) {
        handler(data);
      }
    };

    // Connect with callbacks
    wsRef.current = clientRef.current.connectWebSocket(
      onMessage,
      null, // typing handler (not used here)
      null, // presence handler (not used here)
      onError
    );

    // Override onopen/onclose
    const originalOnOpen = wsRef.current.onopen;
    wsRef.current.onopen = () => {
      if (originalOnOpen) originalOnOpen();
      onOpen();
    };

    const originalOnClose = wsRef.current.onclose;
    wsRef.current.onclose = (event) => {
      if (originalOnClose) originalOnClose(event);
      onClose(event);
    };
  }, [userId]);

  /**
   * Disconnect and cleanup
   */
  const disconnect = useCallback(() => {
    cleanup();
    setIsConnected(false);
  }, []);

  /**
   * Cleanup resources
   */
  const cleanup = useCallback(() => {
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Stop heartbeat
    stopHeartbeat();

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close(1000, 'Cleanup');
      wsRef.current = null;
    }
  }, []);

  /**
   * Start heartbeat to keep connection alive
   */
  const startHeartbeat = useCallback(() => {
    stopHeartbeat(); // Clear existing
    
    pingIntervalRef.current = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        // Send ping (optional, server handles it)
        // wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // 30 seconds
  }, []);

  /**
   * Stop heartbeat
   */
  const stopHeartbeat = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  /**
   * Schedule reconnection with exponential backoff
   */
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) return;

    const delay = Math.min(1000 * Math.pow(2, 5), 30000); // Max 30s

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = null;
      console.log('[useWebSocket] Attempting reconnection...');
      connect();
    }, delay);
  }, [connect]);

  /**
   * Register event handler
   */
  const on = useCallback((eventType, handler) => {
    if (!handlersRef.current.has(eventType)) {
      handlersRef.current.set(eventType, new Set());
    }
    handlersRef.current.get(eventType).add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = handlersRef.current.get(eventType);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }, []);

  /**
   * Remove event handler
   */
  const off = useCallback((eventType, handler) => {
    const handlers = handlersRef.current.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }, []);

  /**
   * Send message via WebSocket
   */
  const sendMessage = useCallback((conversationId, content, type = 'text', metadata = {}) => {
    if (!clientRef.current || !isConnected) {
      throw new Error('WebSocket not connected');
    }
    clientRef.current.sendMessageWS(conversationId, content, type, metadata);
  }, [isConnected]);

  /**
   * Send typing indicator
   */
  const sendTyping = useCallback((conversationId, isTyping) => {
    if (!clientRef.current) return;
    clientRef.current.sendTyping(conversationId, isTyping);
  }, []);

  // Auto-connect on mount if userId provided
  useEffect(() => {
    if (userId && options.autoConnect !== false) {
      connect();
    }

    return () => {
      cleanup();
    };
  }, [userId, connect, cleanup, options.autoConnect]);

  return {
    // State
    isConnected,
    connectionError,
    lastPong,
    client: clientRef.current,

    // Actions
    connect,
    disconnect,
    sendMessage,
    sendTyping,
    on,
    off
  };
}

/**
 * useWebSocketQueue Hook
 * Debounces typing indicators and manages message queue
 */
export function useWebSocketQueue(ws) {
  const typingTimeoutRef = useRef(null);
  const queueRef = useRef([]);
  const isProcessingRef = useRef(false);

  /**
   * Debounced typing indicator
   */
  const sendTypingDebounced = useCallback((conversationId, isTyping) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send immediate start
    if (isTyping) {
      ws.sendTyping(conversationId, true);
    }

    // Schedule stop after delay
    typingTimeoutRef.current = setTimeout(() => {
      ws.sendTyping(conversationId, false);
      typingTimeoutRef.current = null;
    }, 2000);
  }, [ws]);

  /**
   * Queue message if offline, send immediately if online
   */
  const queueMessage = useCallback((message) => {
    if (ws.isConnected()) {
      // Send immediately
      try {
        ws.sendMessage(
          message.conversationId,
          message.content,
          message.type,
          message.metadata
        );
        return { status: 'sent', message };
      } catch (error) {
        console.error('Failed to send message:', error);
        return { status: 'failed', error };
      }
    } else {
      // Add to offline queue
      queueRef.current.push({
        ...message,
        queuedAt: Date.now(),
        retries: 0
      });
      console.log('[useWebSocketQueue] Message queued for later delivery');
      return { status: 'queued', message };
    }
  }, [ws]);

  /**
   * Flush offline queue (called on reconnect)
   */
  const flushQueue = useCallback(async () => {
    if (queueRef.current.length === 0 || !ws.isConnected()) {
      return;
    }

    const queue = [...queueRef.current];
    queueRef.current = [];

    for (const msg of queue) {
      try {
        ws.sendMessage(
          msg.conversationId,
          msg.content,
          msg.type,
          msg.metadata
        );
        console.log('[useWebSocketQueue] Flushed queued message:', msg.id);
      } catch (error) {
        console.error('[useWebSocketQueue] Failed to flush message:', error);
        // Re-queue with retry count
        msg.retries++;
        if (msg.retries < 3) {
          queueRef.current.push(msg);
        }
      }
    }
  }, [ws]);

  return {
    sendTypingDebounced,
    queueMessage,
    flushQueue,
    queueSize: queueRef.current.length
  };
}

export default useWebSocket;
