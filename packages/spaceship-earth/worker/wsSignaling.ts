// spaceship-relay WebSocket signaling handler — used by kenosisMesh y-webrtc

import type { WebSocket as WSWebSocket } from 'ws';
// In Cloudflare Workers, WebSocket is available globally.

// Track active WebSocket connections per room
const rooms = new Map<string, Set<any>>();

function wsSignaling(ws: any, request: Request) {
  const url = new URL(request.url);
  const room = url.searchParams.get('room') || 'default';

  if (!rooms.has(room)) rooms.set(room, new Set());
  rooms.get(room)!.add(ws);

  ws.addEventListener('message', (event: MessageEvent) => {
    // Relay y-webrtc signaling messages (SDP/ICE) to all other peers in the room
    const peers = rooms.get(room);
    if (!peers) return;
    for (const peer of peers) {
      if (peer !== ws && peer.readyState === (ws as any).readyState) {
        try { peer.send(event.data); } catch {}
      }
    }
  });

  ws.addEventListener('close', () => {
    rooms.get(room)?.delete(ws);
    if (rooms.get(room)?.size === 0) rooms.delete(room);
  });

  ws.addEventListener('error', () => {
    rooms.get(room)?.delete(ws);
  });

  ws.accept();
}

export function handleWebSocket(request: Request): Response | null {
  if (request.headers.get('Upgrade') !== 'websocket') return null;

  const pair = (globalThis as any).WebSocketPair ? new (globalThis as any).WebSocketPair() : null;
  if (!pair) return new Response('WebSocket not supported', { status: 500 });

  const [client, server] = Object.values(pair);
  wsSignaling(server, request);

  return new Response(null, { status: 101, webSocket: client });
}
