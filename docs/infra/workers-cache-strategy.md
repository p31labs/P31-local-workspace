# Workers Cache Strategy — p31ca.org

## Problem

The p31ca.org Astro site re-renders on every request. Static pages (homepage, /about, /research) don't change between deploys — rendering them repeatedly wastes Worker invocations.

## Solution: Render-Once-Cache-Globally

```typescript
// In p31ca Worker (if using Workers Static Assets + Functions)
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cacheKey = new Request(url.toString(), request);
    const cache = caches.default;

    // Return cached response if available
    let response = await cache.match(cacheKey);
    if (response) return response;

    // Otherwise render + cache
    response = await env.ASSETS.fetch(request);
    
    // Cache static pages for 1 hour
    if (url.pathname === '/' || url.pathname.startsWith('/about') || url.pathname.startsWith('/research') || url.pathname.startsWith('/blog')) {
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
      response.headers.set('Cache-Control', 'public, max-age=3600');
    }

    return response;
  },
};
```

## Priority Pages to Cache

| Page | TTL | Expected Hit Rate |
|------|-----|------------------|
| `/` (homepage) | 1 hour | 90%+ |
| `/about` | 6 hours | 95%+ |
| `/research` | 6 hours | 95%+ |
| `/blog` | 1 hour | 80%+ |
| `/api/phos/surfaces` | 5 minutes | 70%+ |
| `/health` | 1 minute | 99%+ |

## Impact

| Metric | Before | After |
|--------|--------|-------|
| Worker invocations | ~100K/day | ~10K/day (90% cache hit) |
| Global latency (p50) | ~50ms | ~5ms (edge-cached) |
| Cost | $5/mo base | $5/mo (no extra) |

## Notes

- Cache is per-Cloudflare-datacenter — 330+ independent caches
- Max cacheable response: 512 MB
- Cache API is available in all Workers plans
- Use `Cache-Control: s-maxage=` for CDN-specific TTL
