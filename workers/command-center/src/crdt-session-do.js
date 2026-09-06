/**
 * CRDT / collaboration session (WebSocket). Bound as CRDT_SESSION_DO in wrangler.toml.
 * Minimal bridge: accept WebSocket; message handling can be extended for Yjs/automerge.
 */
export class CrdtSessionDO {
  /**
   * @param {DurableObjectState} state
   * @param {Record<string, unknown>} env
   */
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  /**
   * @param {Request} request
   */
  async fetch(request) {
    const upgrade = request.headers.get('Upgrade') || '';
    if (upgrade.toLowerCase() !== 'websocket') {
      return new Response('Expected WebSocket Upgrade', { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.state.acceptWebSocket(server);

    server.addEventListener('message', (event) => {
      try {
        server.send(
          JSON.stringify({ type: 'ack', len: String(event.data).length, ts: new Date().toISOString() })
        );
      } catch {
        // ignore
      }
    });

    return new Response(null, { status: 101, webSocket: client });
  }
}
