export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (url.pathname === '/health' || url.pathname === '/api/health') {
        return new Response(JSON.stringify({
          status: 'ok',
          service: 'p31-hearing-ops',
          version: '0.0.1',
          timestamp: new Date().toISOString(),
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }
      return env.ASSETS.fetch(request);
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Internal error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
