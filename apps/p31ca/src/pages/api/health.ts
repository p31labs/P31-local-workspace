import type { APIRoute } from 'astro';
import { VERSION } from '../../version';

export const prerender = false;

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({
    status: 'ok',
    version: VERSION,
    timestamp: new Date().toISOString(),
    uptime: process.uptime ? Math.floor(process.uptime()) : undefined,
    dependencies: {
      astro: { status: 'ok' },
      site: { status: 'ok' },
    },
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
