export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/health' || url.pathname === '/api/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'willow',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
    return env.ASSETS.fetch(request);
  },
};
