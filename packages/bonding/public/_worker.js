export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        version: '0.1.0',
        timestamp: new Date().toISOString(),
        service: 'bonding',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return env.ASSETS.fetch(request);
  },
};
