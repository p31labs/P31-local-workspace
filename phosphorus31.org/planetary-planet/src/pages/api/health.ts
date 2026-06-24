import type { APIRoute } from 'astro';
import { VERSION } from '../../version';

function validateHealthRequest(url: URL): string | null {
  const format = url.searchParams.get('format');
  if (format && !['json', 'text'].includes(format)) return 'Invalid format parameter';
  return null;
}

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const validationError = validateHealthRequest(url);
  if (validationError) {
    return new Response(JSON.stringify({ error: validationError }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const endpoint = '/api/health';
  try {
    return new Response(JSON.stringify({
      status: 'ok',
      version: VERSION,
      service: 'phosphorus31.org',
      timestamp: new Date().toISOString(),
      endpoint,
      env: process.env.NODE_ENV || 'production',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ status: 'error', message: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
