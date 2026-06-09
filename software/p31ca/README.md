# p31ca.org — Technical hub (Astro)

Static **technical hub** for P31 Labs: tool cards, fleet status strip, links to Cloudflare Workers, and `public/` HTML apps. **Nonprofit narrative and donate** live on [phosphorus31.org](https://phosphorus31.org). How the two sites relate to edge Workers is documented in the monorepo:

- [`docs/SITE_MAP_AND_OWNERSHIP.md`](../../../docs/SITE_MAP_AND_OWNERSHIP.md)

## Commands

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # ./dist
npm run deploy   # build + wrangler pages deploy → project `p31ca`
```

## Layout

| Path | Role |
|------|------|
| `src/pages/index.astro` | Main hub (live suite, dev, research tools, publications) |
| `src/data/hub-products.ts` | Card data for hub sections |
| `src/components/SharedFooter.astro` | Canonical footer (portal · hub · GitHub) |
| `public/*.html` | Legacy/static apps and `*-about.html` onboarding pages |

## Deploy

**Project name:** `p31ca` (Pages). Custom domain: `p31ca.org`.

Do not deploy Hearing Ops or other apps to this same Pages project — use a separate project (see `docs/WORKER_PAGES_MANIFEST.md`).

## Related

- Edge inventory: [`docs/WORKER_PAGES_MANIFEST.md`](../../../docs/WORKER_PAGES_MANIFEST.md)
- Agent hub: `../p31-agent-hub/README.md`
