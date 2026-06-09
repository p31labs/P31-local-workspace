/**
 * Server-Sent Events stream for /api/sse (authenticated via Cloudflare Access).
 */
export async function handleSseStream(request) {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const enc = new TextEncoder();
  const done = { closed: false };

  const close = () => {
    if (done.closed) return;
    done.closed = true;
    void writer.close().catch(() => {});
  };

  request.signal?.addEventListener('abort', close);

  (async function pump() {
    let seq = 0;
    try {
      await writer.write(enc.encode(': stream open\n\n'));
      while (!request.signal?.aborted) {
        const payload = JSON.stringify({ seq: ++seq, ts: new Date().toISOString() });
        await writer.write(enc.encode(`event: heartbeat\ndata: ${payload}\n\n`));
        await new Promise((resolve) => {
          const t = setTimeout(resolve, 20_000);
          request.signal?.addEventListener('abort', () => {
            clearTimeout(t);
            resolve();
          });
        });
        if (request.signal?.aborted) break;
      }
    } catch {
      // client disconnected or backpressure
    } finally {
      close();
    }
  })();

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
