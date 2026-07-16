export const prerender = false;

export async function GET() {
  return new Response(
    JSON.stringify({
      ok: true,
      surface: 'p31ca',
      version: '0.0.1',
      timestamp: new Date().toISOString(),
      status: 'operational',
      services: {
        starfield: 'canvas2d',
        molecularField: 'dom+svg',
        k4Hero: 'svg',
      },
    }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'public, max-age=60',
      },
    },
  );
}
