/**
 * Per-request CSP nonce injection for HTML responses.
 *
 * Build-time hashes break the moment Cloudflare's edge injects its challenge
 * widget (rotating per-request token). A per-request nonce via HTMLRewriter is
 * the only approach that survives. Two load-bearing details:
 *
 *   1. Cloudflare reads the nonce from the CSP header and stamps its own
 *      injected scripts with it (undocumented but stable).
 *   2. `Cache-Control: private` prevents a shared cache from serving one
 *      user's nonced HTML to another.
 *
 * React does not use eval(), so a strict policy is viable. Trusted Types is
 * enforced via require-trusted-types-for 'script'.
 */
function cspFor(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'nonce-${nonce}' 'strict-dynamic' https://static.cloudflareinsights.com`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "upgrade-insecure-requests",
    "require-trusted-types-for 'script'",
  ].join('; ');
}

export const onRequest: PagesFunction = async (context) => {
  const response = await context.next();
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/html')) return response;

  const nonceBytes = crypto.getRandomValues(new Uint8Array(16));
  const nonce = btoa(String.fromCharCode(...nonceBytes));

  const rewritten = new HTMLRewriter()
    .on('script', {
      element(el) {
        el.setAttribute('nonce', nonce);
      },
    })
    .transform(response);

  const headers = new Headers(rewritten.headers);
  headers.set('Content-Security-Policy', cspFor(nonce));
  // A shared cache serving one user's nonce to another breaks the client.
  headers.set('Cache-Control', 'private, max-age=0, must-revalidate');
  return new Response(rewritten.body, { status: rewritten.status, statusText: rewritten.statusText, headers });
};