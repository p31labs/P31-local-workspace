# Site map and ownership

**Purpose:** Single arbiter for “where does this live?” — trust on the nonprofit site, tools on the technical hub, authoritative state on Workers.

**Last updated:** 2026-04-15

---

## Public vs gated (runtime)

| Channel | What it is | Mesh / writes | Typical auth |
|--------|------------|---------------|--------------|
| **Public** | Internet-facing **read** paths: health, mesh **summary**, docs, static hub | Read-only via documented APIs; **no** `ADMIN_TOKEN` / `HUBS_WRITE_TOKEN` in the browser | None or optional session id for chat UX |
| **Gated** | Operator and family **write** paths: hub mutations, personal scope, agent tools that change KV | Writes and sensitive reads | JWT / room codes / `Authorization: Bearer` + internal Worker env (`p31-agent-hub-internal`, secrets on Workers only) |

**Rule:** If it runs in **Pages** (HTML), assume **public** and **untrusted**. Secrets and write tools stay in **Workers**; bind Carrie and command-center to **gated** endpoints, not public static pages.

---

## Canonical URLs (human-facing)

| Role | Canonical URL | Deploy / repo |
|------|-----------------|----------------|
| Nonprofit portal (mission, donate, research narrative) | `https://phosphorus31.org` | `phosphorus31.org/planetary-planet/` → Cloudflare Pages (project name per dashboard; includes `wrangler.toml` for `p31-donation-relay` Worker) |
| Technical hub (tool catalog, static apps, fleet links) | `https://p31ca.org` | `software/p31ca/` → Pages project `p31ca` |
| Legacy MVP card hub (archive) | `https://p31ca.org/mvp-hub-legacy.html` | Same Pages deploy; static file in `public/` |
| Monorepo | `https://github.com/p31labs/andromeda` (org-level: `https://github.com/p31labs`) | GitHub |
| Primary donate landing | `https://phosphorus31.org/donate` | Astro page on nonprofit site |

**Secondary product entry points** (deep links from hub cards, not duplicate “home” pages):

- BONDING game: `https://bonding.p31ca.org`
- Spaceship Earth (operator cockpit): follow hub card → `https://p31ca.org/spaceship-earth-about.html` (about) and deployed app URL as listed on that page

---

## Workers (authoritative compute — not Pages)

These are **not** owned by the Astro repos; each is its own Wrangler project. Truth for mesh and agents lives here.

| Worker / surface | Typical hostname | Repo path (monorepo) |
|------------------|------------------|----------------------|
| Command center (fleet status API) | `command-center.trimtab-signal.workers.dev` | `software/cloudflare-worker/command-center/` |
| K₄ cage (mesh KV) | `k4-cage.trimtab-signal.workers.dev` (or custom route) | `software/k4-cage/` |
| Agent hub (orchestrator) | `p31-agent-hub.trimtab-signal.workers.dev` | `software/p31-agent-hub/` |
| Carrie agent UI | `carrie-agent.trimtab-signal.workers.dev` | (deploy path per project; may live under `software/`) |
| Fawn Guard API | `fawn-guard.trimtab-signal.workers.dev` | External to Pages; client on `p31ca` |

Updates to **bindings, secrets, and routes** are **Cloudflare dashboard + Wrangler**, not the Pages build.

---

## Global navigation contract (both Astro sites)

Every primary header/footer should make these three destinations obvious:

1. **Nonprofit portal** — `https://phosphorus31.org`
2. **Technical hub** — `https://p31ca.org/`
3. **GitHub** — `https://github.com/p31labs`

Donate CTA on the technical hub may point to **`https://phosphorus31.org/donate`** (canonical donate URL).

---

## Quick decision tree

- **Funders, press, IRS narrative, transparency copy** → phosphorus31.org  
- **Repos, Worker links, static tools, hub cards** → p31ca.org  
- **KV mesh state, LLM, session memory, write tools** → Workers (never static HTML as source of truth)

---

## User journeys (who clicks what)

| Visitor | First stop | Then |
|--------|------------|------|
| **Donor / grant reviewer** | phosphorus31.org → `/donate`, `/research`, `/transparency` | Optional: technical hub for “what we ship” |
| **Parent / user** | phosphorus `/products` or hero CTAs → BONDING, EDE, Buffer about pages | Live apps; no Workers internals required |
| **Builder / contributor** | p31ca.org hub → GitHub | Clone monorepo, run tests under `software/` |
| **Operator** | p31ca fleet strip + command-center URL | Gated tools, agent hub internal env — not on Pages |

**Vision:** No one should wonder whether “the real P31” is the nonprofit site or the tech site — they are **two faces of one org**. The **third** face (Workers) is infrastructure, linked from the hub, documented here.

---

## Stack diagram (conceptual)

```
[ Browser ]
  -->|HTTPS| phosphorus31.org (static Pages)     … trust, donate, story
  -->|HTTPS| p31ca.org (static Pages)             … tools, docs, fleet UI
  -->|HTTPS| *.workers.dev / custom routes       … KV, DO, AI (truth + execution)
```

Static sites **never** hold mesh authority; they **link to** or **call** read APIs when appropriate.

---

## Phasing (aligns with agent hub rollout)

1. **Legible** — Cross-links + this doc + honest metrics on both homepages (done iteratively).
2. **Read path** — `k4-cage` + `p31-agent-hub` public read + health; p31ca links to documented URLs only.
3. **Gated writes** — Internal Worker env, JWT/room codes, write tools omitted from public schema.
4. **Legacy redirects** — 301 family workers to cage after telemetry is clean.

---

## Related

- Agent / K₄ architecture: `software/p31-agent-hub/README.md`, `software/k4-cage/`
- Shared mesh library: `software/packages/k4-mesh-core/`
- Edge inventory: `docs/WORKER_PAGES_MANIFEST.md`
- Observatory dome JSON: `docs/DOME_DATA_FORMAT.md` (`p31ca.org/dome.html`, `dome-generator.html`)
