export function createErrorResponse(message, details, status = 500) {
  return new Response(JSON.stringify({ error: message, details: String(details) }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function sanitizeInput(value, maxLength = 512) {
  if (typeof value !== 'string') return '';
  return value.slice(0, maxLength).replace(/[\x00-\x1f\x7f]/g, '');
}
