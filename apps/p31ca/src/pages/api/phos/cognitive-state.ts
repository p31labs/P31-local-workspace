import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  return new Response(
    JSON.stringify({
      spoons: 4,
      level: 4,
      source: 'default',
      cognitive_load: 0.5,
      fatigue: 0.3,
      flow: 0.5,
      creativity: 0.5,
      stress: 0.2,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
