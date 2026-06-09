# P31 FORGE

**Single-source document generation for everything P31 Labs ships.**

Court filings. Grant applications. Board resolutions. Letters. Memos. Social
posts. One brand system. One content-pack schema. One pipeline.

```
  CONTENT PACK (JSON)    →    brand.js primitives    →    .docx    →    .pdf
  ──────────────────          ──────────────────           ─────         ────
  what you write              how it looks                 docx          Word
                              (colors, fonts,              output        PDF
                               layout, spacing)
```

---

## The problem this solves

Before Forge, every legal filing, grant, and social post lived in its own
silo — different fonts, drifting case numbers, stale EINs, tofu Unicode
glyphs, coral italics where dark bold belonged. The "delta world" of
visual consistency was a mess.

Forge is the calcium cage. Everything that leaves P31 Labs — to a court,
to a funder, to social — flows through **one brand.js and one forge.js**.
Change the EIN once; every document downstream picks it up.

---

## Quickstart

```bash
cd software/p31-forge
npm install
python -m pip install docx2pdf pypdf pdf2image   # for PDF bridge

# Regenerate public brand JSON for the open doc suite (HTML/CSS in docs/corporate/suite)
npm run brand:tokens

# Compile a single content pack
node forge.js compile content/legal/2025CV936/supplemental_notice.json

# Build all three CWP-041 discovery documents
node scripts/build-discovery.js

# Render all out/*.docx to .pdf (Windows + Word required for docx2pdf)
python scripts/docx_to_pdf.py
```

Output lands in `out/`.

---

## Architecture

### `brand.js` — the cage

Single source of truth for every visual decision:

| Surface | Controls |
| --- | --- |
| `COLORS`   | coral, teal, dark, gray, rules, backgrounds |
| `TYPE`     | font families (Georgia serif, JetBrains Mono), sizes |
| `PAGES`    | letter, legal — margins + content width |
| `ENTITY`   | operator, org, case, EIN, opposing counsel, ADA support |
| `SOCIAL`   | hashtags, bio, platform max-lengths |
| primitives | `para`, `heading1`, `heading2`, `field`, `bullet`, `numbered`, `affects`, `timeline` |
| blocks     | `courtCaption`, `signatureBlock`, `certOfService`, `makeHeader`, `makeFooter` |

Everything visual goes through brand.js. Never hardcode a color or font
in a content pack or a renderer.

### `forge.js` — the engine

- `compile(pack)` — content pack → `docx` Document
- `compileFile(path)` — reads JSON, compiles, writes `out/<filename>.docx`
- Ad-hoc scaffolds: `court`, `letter`, `corporate`, `grant`, `social`

### `content/` — the source of truth

Content packs are JSON. They describe *what* the document says; brand.js
handles *how* it looks. Packs specify:

- `kind`: `court | letter | resolution | memo | grant`
- metadata (title, date, case #, filename, etc.)
- `body[]`: typed items the renderer dispatches

### Typed body items

| `type`       | Shape                              | Renders as |
| ------------ | ---------------------------------- | --- |
| `h1`         | `{ type, text }`                   | section heading (dark in legal, coral in org) |
| `h2`         | `{ type, text }`                   | subsection heading |
| `para`       | `{ type, text }`                   | justified body paragraph |
| `field`      | `{ type, label, value }`           | indented `Label: value` line |
| `bullet`     | `{ type, text }`                   | coral bullet list item |
| `numbered`   | `{ type, text }`                   | auto-numbered list item |
| `affects`    | `{ type, text }`                   | gray italic "Affects: ..." line (supplemental discovery) |
| `timeline`   | `{ type, entries: [{ date, text }] }` | two-column date/event mini-table |

### Dual heading style

- **Court filings / letters** → dark bold h1s (restrained, traditional legal)
- **Grants / resolutions / memos** → coral bold h1s (branded, organizational)

Driven by `renderBody(items, { headingColor })` in `forge.js`.

---

## Content-pack examples

### Court filing

```json
{
  "kind": "court",
  "filename": "Supplemental_Discovery_Notice.docx",
  "title": "DEFENDANT'S SUPPLEMENTAL NOTICE OF PRODUCTION",
  "subtitle": "(Pursuant to O.C.G.A. \u00a7 9-11-26(e))",
  "date": "14th day of April, 2026",
  "preamble": "COMES NOW Defendant, WILLIAM RODGER JOHNSON, pro se, ...",
  "body": [
    { "type": "h1", "text": "UPDATE 1: P31 Labs \u2014 Incorporation Completed" },
    { "type": "affects", "text": "P31 Labs Business Documentation; Requests Nos. 9, 10, 11" },
    { "type": "para", "text": "On April 3, 2026, P31 Labs was formally incorporated..." }
  ],
  "cert_of_service": { "text": "auto-generated from ENTITY constants" }
}
```

### Letter

```json
{
  "kind": "letter",
  "filename": "Response_Good_Faith_Letter_FINAL.docx",
  "date": "April 14, 2026",
  "via": "Via Email: jenn@mcghanlaw.com",
  "recipient": ["Jennifer L. McGhan, Esq.", "McGhan Law, LLC", "..."],
  "re": ["Response to Good-Faith Letter of April 7, 2026", "Johnson v. Johnson, Civil Action No. 2025CV936"],
  "salutation": "Dear Ms. McGhan,",
  "body": [
    { "type": "h1", "text": "I. Production Was Timely Made" },
    { "type": "para", "text": "..." },
    { "type": "timeline", "entries": [
      { "date": "February 12, 2026", "text": "Plaintiff serves Second Request for Production" }
    ]}
  ],
  "closing": "Respectfully,",
  "signature": { "name": "William R. Johnson, Pro Se", "lines": ["401 Powder Horn Rd", "..."] },
  "cc": ["Amy Hilliard Thompson, Paralegal", "..."]
}
```

### Grant

```json
{
  "kind": "grant",
  "filename": "P31_Grant_Gates.docx",
  "program": "gates",
  "title": "Gates Foundation Grand Challenges: AI to Accelerate Charitable Giving",
  "deadline": "April 28, 2026, 11:30 AM PDT",
  "amount": "Up to $150,000",
  "body": [
    { "type": "h1", "text": "ELEVATOR PITCH" },
    { "type": "para", "text": "P31 Labs engineers open-source cognitive infrastructure..." },
    { "type": "h1", "text": "MEASUREMENT OF SUCCESS" },
    { "type": "bullet", "text": "Artifacts shipped (public URL, AGPLv3/MIT, test coverage \u2265 80%)" }
  ]
}
```

---

## CLI reference

```bash
# Content-driven (preferred)
node forge.js compile <path-to-content-pack.json>

# Ad-hoc scaffolds (blank templates)
node forge.js court   "MOTION TITLE"  "16th day of April, 2026" [--subtitle "..."]
node forge.js letter  "RE: Subject"   "April 14, 2026"
node forge.js corporate resolution|memo  "April 14, 2026"
node forge.js grant   gates|nlnet|asan

# Social formatter (stdout only)
node forge.js social "Post content" bluesky|mastodon|linkedin|all

# Publish to a live channel (requires secrets in env — see Channels below)
node forge.js publish bluesky   "Hello from P31 Labs"
node forge.js publish mastodon  "Hello from P31 Labs"
node forge.js publish devto     @content/posts/cwp-011-post.json
node forge.js publish hashnode  @content/posts/cwp-011-post.json
node forge.js publish zenodo    @content/releases/paper-iii.json

# Fan a social pack across every target it names
node forge.js publish-pack content/social/posts.json [--ids id1,id2] [--targets bluesky,mastodon]

# Scan grants.gov for keyword hits (no auth — uses Search2 REST API)
node forge.js scan-grants [--keywords autism,assistive,accessibility] [--since 2026-01-01]

# Scan Substack RSS for new posts; optionally fan them out to social channels
node forge.js scan-substack [--feed URL] [--limit 5] [--targets bluesky,mastodon]

# Introspection
node forge.js brand   # dump brand constants
```

---

## Cloudflare Worker — Forge as HTTP service

```bash
npm run worker:dev                                    # local dev on :8787
npm run worker:deploy                                 # deploy to *.workers.dev
npx wrangler deploy --dry-run --outdir dist           # validate build without deploying
```

Typical bundle: **~1.66 MiB unpacked, ~315 KiB gzipped** (well under CF's 10 MiB limit). All seven channel modules + `docx` ship inside a single Worker.

### Endpoints

| Method | Path                  | Purpose                            | Auth |
| ------ | --------------------- | ---------------------------------- | ---- |
| GET    | `/`                   | service info                       | none |
| GET    | `/health`             | liveness                           | none |
| GET    | `/brand`              | brand constants                    | none |
| GET    | `/channels`           | list available publishing channels | none |
| POST   | `/compile`            | content pack JSON → `.docx`        | key  |
| POST   | `/social`             | format post for platform           | key  |
| POST   | `/publish/:channel`   | publish to one channel             | key  |
| POST   | `/publish-pack`       | publish a social pack fan-out      | key  |
| POST   | `/scan-grants`        | grants.gov keyword scan            | key  |
| POST   | `/webhook/discord`    | Discord slash-command webhook      | key  |
| POST   | `/webhook/github`     | GitHub release webhook             | key  |

### Auth

```bash
wrangler secret put FORGE_API_KEY
```

Clients send `X-Forge-Key: <your-key>` on POST routes. If no key is set,
auth is disabled (dev-friendly default).

### Example: compile from the browser

```js
const res = await fetch('https://p31-forge.<subdomain>.workers.dev/compile', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-forge-key': KEY },
  body: JSON.stringify(myContentPack)
});
const blob = await res.blob();
```

### Example: publish a Bluesky post

```js
await fetch('https://p31-forge.<subdomain>.workers.dev/publish/bluesky', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-forge-key': KEY },
  body: JSON.stringify({ content: "Hello from P31 Labs" })
});
```

---

## Channels — per-channel publishing

Forge wraps every outbound channel behind the same dispatcher. CLI uses
`process.env`; the Worker pulls from Cloudflare secrets. One auth key,
one pipeline, every channel gets the same brand cage and EIN.

| Channel    | Endpoint / Protocol                             | Required secrets |
| ---------- | ----------------------------------------------- | ---------------- |
| `twitter`  | `POST /2/tweets` (OAuth 1.0a HMAC-SHA1)         | `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_TOKEN_SECRET` |
| `bluesky`  | ATProto — createSession + com.atproto.repo.createRecord | `BLUESKY_HANDLE`, `BLUESKY_APP_PASSWORD` |
| `mastodon` | `POST /api/v1/statuses` (Bearer)                | `MASTODON_INSTANCE`, `MASTODON_ACCESS_TOKEN` |
| `devto`    | `POST https://dev.to/api/articles` (`api-key`)  | `DEVTO_API_KEY` |
| `hashnode` | GraphQL `publishPost` (token, no `Bearer` prefix) | `HASHNODE_TOKEN`, `HASHNODE_PUBLICATION_ID` |
| `zenodo`   | Three-step deposition + optional publish (DOI)  | `ZENODO_TOKEN` |
| `grants`   | `POST api.grants.gov/v1/api/search2` (no auth)  | — |
| `substack` | RSS scan + diff (Substack has no inbound API)   | `SUBSTACK_FEED_URL` (optional; defaults to thegeodesicself) |
| `discord`  | Incoming webhook (POST, `?wait=true` for permalink) | `DISCORD_WEBHOOK_URL` (+ optional `DISCORD_PAYMENT_WEBHOOK_URL`, `DISCORD_ACTIVITY_WEBHOOK_URL` for role-scoped posts) |

### Content shapes

- **Short posts** (`twitter`, `bluesky`, `mastodon`): `content` is a string.
- **Long-form** (`devto`, `hashnode`): `content` is
  `{ title, body_markdown, tags?, canonical_url?, description?, subtitle? }`.
- **Research** (`zenodo`): `content` is
  `{ title, description, creators, keywords?, files: [{ name, data }] }`,
  plus optional `publish: true` (mints a DOI) or `sandbox: true`.
- **Grants scan**: `content` is `{ keywords?, since?, rows? }`; returns
  deduped hits across the whole watchlist.

### Social pack fan-out

`content/social/posts.json` contains canonical posts with a `targets` array
per post. `publish-pack` fans each post across its targets in one call:

```bash
node forge.js publish-pack content/social/posts.json --ids cwp011-a,cwp011-b
```

### Setting secrets on the Worker

```bash
wrangler secret put BLUESKY_HANDLE
wrangler secret put BLUESKY_APP_PASSWORD
wrangler secret put HASHNODE_TOKEN
wrangler secret put HASHNODE_PUBLICATION_ID
# ...repeat per channel you intend to use
```

Secrets are optional at the channel level — missing credentials raise a
clear `"X not set"` error on that channel only. Unused channels cost
nothing.

---

## Activity log + autonomous radar

Forge keeps an audit trail of everything it does, and runs a daily
grants.gov scan without prompting.

### Activity log (KV-backed)

Every `/compile`, `/publish/:channel`, `/publish-pack`, `/scan-grants`,
and cron firing writes one entry into `FORGE_KV` with timestamp, kind,
outcome, and a small `detail` object. Entries expire after 90 days.

```bash
curl https://p31-forge.<subdomain>.workers.dev/activity?limit=20
curl https://p31-forge.<subdomain>.workers.dev/activity?kind=publish&limit=50
curl https://p31-forge.<subdomain>.workers.dev/scan/grants/last
```

If `FORGE_KV` isn't bound, `logActivity()` short-circuits — Forge still
works, just without history. Bind it once to turn on the ledger:

```bash
wrangler kv:namespace create FORGE_KV
# paste the returned id into wrangler.toml under [[kv_namespaces]]
```

### Scheduled cron triggers

`wrangler.toml` declares:

```toml
[triggers]
crons = ["0 9 * * *", "0 * * * *"]
```

| Schedule   | Cron            | Action |
| ---------- | --------------- | ------ |
| Daily 09 UTC | `0 9 * * *`   | grants.gov watchlist scan → diff vs `scan:grants:seen` → log new opportunities |
| Hourly     | `0 * * * *`     | Substack RSS scan → diff vs `scan:substack:seen` → log new posts; fan-out automatically if `SUBSTACK_AUTO_TARGETS` is set |

No action is taken beyond logging — operators review `/activity` and
decide what to chase. For Substack, set
`SUBSTACK_AUTO_TARGETS="bluesky,mastodon"` to skip the manual review and
cross-post the moment a new piece lands.

### Ko-fi payment webhook

`POST /webhook/kofi` ingests Ko-fi donation webhooks (multipart or JSON),
forwards a formatted embed to Discord via the `discord` channel with
`role: 'payment'`, and writes a `webhook-kofi` entry to the activity log.

- Auth bypasses `FORGE_API_KEY` (Ko-fi can't send custom headers). If
  `KOFI_SECRET` is set, Forge verifies the `x-kofi-webhook-secret` header
  or the payload's `verification_token` field; otherwise anything posts.
- Ko-fi's own `Verification` / `Payment Process` events are acknowledged
  but skip the Discord fan-out.
- Forge does **not** manage node-count milestones — that stays with the
  canonical Ko-fi worker at `kofi.p31ca.org`. This endpoint is redundant
  telemetry so Ko-fi activity appears in `/activity` alongside every
  other publish event.

To point Ko-fi at Forge, set the webhook URL under Ko-fi → API to:

```
https://p31-forge.<subdomain>.workers.dev/webhook/kofi
```

---

## Directory layout

```
p31-forge/
  brand.js                        # single-source visual identity
  forge.js                        # CLI + renderers + compile() + publish()
  package.json
  wrangler.toml                   # CF Worker config
  worker/
    index.js                      # HTTP service
  channels/                       # outbound publishing channels
    index.js                      # dispatcher + publishPack() fan-out
    twitter.js                    # OAuth 1.0a HMAC-SHA1 (Web Crypto)
    bluesky.js                    # ATProto session + createRecord
    mastodon.js                   # REST (Bearer)
    devto.js                      # REST (api-key)
    hashnode.js                   # GraphQL publishPost
    zenodo.js                     # deposition create/upload/publish + DOI
    grants.js                     # grants.gov Search2 (read-only)
    substack.js                   # RSS scan + diff (for cross-post fan-out)
    discord.js                    # outbound webhook (default / payment / activity roles)
  scripts/
    build-discovery.js            # one-shot CWP-041 build
    docx_to_pdf.py                # Word COM PDF bridge (Windows)
  content/
    legal/2025CV936/              # court filings + letters
      supplemental_notice.json
      business_documentation.json
      response_good_faith.json
    grants/                       # grant applications
      gates.json
      nlnet.json
      asan.json
    corporate/                    # board resolutions, memos
      resolution_initial_board.json
    social/
      posts.json                  # canonical social posts bank
  samples/                        # reference PDFs (style targets)
    SAMPLE_Court_Filing.pdf
    SAMPLE_Grant_Gates.pdf
    SAMPLE_Resolution.pdf
  out/                            # generated docx + pdf (gitignored)
```

---

## Adding a new document

1. Pick the `kind` (`court | letter | resolution | memo | grant`).
2. Create a content pack under `content/<domain>/<name>.json`.
3. Write the body as typed items — stick to supported types.
4. Run `node forge.js compile content/<domain>/<name>.json`.
5. (Optional) `python scripts/docx_to_pdf.py` to render PDFs.
6. Review the output; iterate on the content pack, never on the .docx.

---

## Automation surface (the big picture)

```
  ┌──────────────────────────────────────────────────────────────────┐
  │ AGENTS / BOTS / WEBHOOKS                                         │
  │   Discord slash-commands  →  POST /webhook/discord → /compile    │
  │   GitHub release hooks    →  POST /webhook/github  → /compile    │
  │   Ko-fi donation webhook  →  receipt doc via /compile            │
  │   Claude / GPT agents     →  POST /compile with content packs    │
  │   Cron / scheduled tasks  →  POST /scan-grants, /publish-pack    │
  └──────────────────────────┬───────────────────────────────────────┘
                             │
                             ▼
                  ┌─────────────────────────┐
                  │ P31 Forge Worker        │
                  │ (Cloudflare)            │
                  │  /compile /publish/*    │
                  │  /publish-pack /scan-*  │
                  └──────────┬──────────────┘
                             │
                             ▼
                  ┌─────────────────────────┐
                  │ forge.js / brand.js     │
                  │ (single brand cage)     │
                  └──────────┬──────────────┘
                             │
      ┌──────────────────────┼──────────────────────────────┐
      ▼                      ▼                              ▼
  DOCUMENT RENDER       CHANNEL DISPATCH              READS
  renderBody()          channels/*                    grants.gov
  compile() → .docx     ├─ twitter, bluesky           (watchlist)
                        ├─ mastodon (social)
                        ├─ devto, hashnode (blog)
                        └─ zenodo (research + DOI)
```

---

## Brand invariants

These never change without a brand-level decision:

- **Coral `#D94F3B`** is the P31 signature color. Used for org headings,
  rules under headers, bullet markers, and the single thin rule separating
  section from section. Never for body text.
- **Georgia** for serif (body, legal, narrative). **JetBrains Mono** for
  code and technical dashboards.
- **Dark `#1A1A1A`** for legal headings. Coral for org headings. The
  difference is intentional — legal must read as traditional; org must
  read as branded.
- **EIN 42-1888158** and Case No. **2025CV936** propagate from
  `ENTITY`. Change them in one place, nowhere else.

---

## License

Code: AGPL-3.0. Content: CC-BY-4.0.

© William R. Johnson / P31 Labs, Inc. — Saint Marys, Georgia.

_"Phosphorus alone burns. Inside the cage, it's stable."_
