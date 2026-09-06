/**
 * @file ChatWidget.tsx — Cross-portal real-time chat via BROS WebSocket rooms.
 *
 * Drop-in component for any P31 portal. Connects to a BROS signaling room
 * and broadcasts messages to all connected portals in the mesh.
 *
 * Usage:
 *   <ChatWidget roomId="family-room" persona="dad" />
 *
 * @a2ui-component ChatWidget
 * @a2ui-props roomId string - Chat room identifier
 * @a2ui-props persona string - Display name for the current user
 * @a2ui-props placeholder string - Input placeholder text
 * @a2ui-props title string - Widget heading
 * @a2ui-example {"component":"ChatWidget","roomId":"family","persona":"willow","title":"Family Chat"}
 */

import { useEffect, useRef, useState } from 'react';

const BROS_WS = 'wss://bros.trimtab-signignal.workers.dev';
const FALLBACK_REPLY = '🌿 Mesh is quiet right now. Try again in a moment.';

export interface ChatWidgetProps {
  roomId: string;
  persona?: string;
  placeholder?: string;
  title?: string;
}

export function ChatWidget({ roomId, persona = 'friend', placeholder = 'Say something...', title = 'Mesh Chat' }: ChatWidgetProps) {
  const [messages, setMessages] = useState<Array<{ from: string; text: string; time: number }>>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    const url = `${BROS_WS}/rooms/${encodeURIComponent(roomId)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.text) {
          setMessages((m) => [...m, { from: data.from || 'mesh', text: data.text, time: Date.now() }]);
        }
      } catch {}
    };

    return () => { ws.close(); };
  }, [roomId]);

  const send = () => {
    const text = input.trim();
    if (!text || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ from: persona, text, time: Date.now() }));
    setMessages((m) => [...m, { from: persona, text, time: Date.now() }]);
    setInput('');
  };

  return (
    <div className="glass-card flex flex-col gap-2" data-mcp-tool="meshChat" data-mcp-state={connected ? 'connected' : 'disconnected'}>
      <div className="flex items-center justify-between">
        <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.8 }}>{title}</div>
        <div className="flex items-center gap-1" style={{ fontSize: 10, opacity: 0.6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? '#34D399' : '#FB7185', display: 'inline-block' }} />
          {connected ? 'live' : 'offline'}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto', padding: '4px 0' }}>
        {messages.length === 0 && (
          <div style={{ fontSize: 12, opacity: 0.5, textAlign: 'center', padding: 16 }}>No messages yet. Start the conversation.</div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ fontSize: 12, padding: '4px 8px', borderRadius: 8, background: m.from === persona ? 'rgba(0,240,255,0.08)' : 'rgba(255,255,255,0.04)', alignSelf: m.from === persona ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
            <div style={{ fontSize: 9, opacity: 0.5, marginBottom: 2 }}>{m.from} · {new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            <div style={{ lineHeight: 1.4 }}>{m.text}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder={placeholder}
          disabled={!connected}
          data-mcp-target="chat-input"
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            padding: '8px 12px',
            color: 'white',
            fontSize: 12,
            outline: 'none',
          }}
        />
        <button
          onClick={send}
          disabled={!connected || !input.trim()}
          data-mcp-tool="chatSend"
          style={{
            background: connected ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${connected ? 'rgba(0,240,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 8,
            padding: '8px 12px',
            color: connected ? '#00F0FF' : 'rgba(255,255,255,0.3)',
            fontSize: 12,
            cursor: connected && input.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
