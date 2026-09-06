# Sovereign Justice System — Phase 0 Foundation

## Three Parallel Tracks

```
TRACK A: RAG Pipeline    → src/rag-pipeline.ts    → sovereign-justice-rag
TRACK B: Evidence Vault  → src/evidence-vault.ts   → sovereign-justice-evidence
TRACK C: Escrow Engine   → src/escrow-engine.ts    → sovereign-justice-escrow
```

## Prerequisites

1. Cloudflare account with Workers Paid plan
2. Node.js 18+ and pnpm installed
3. Wrangler CLI authenticated (`npx wrangler login`)

## Step 1: Provision Resources

### D1 Database
```bash
npx wrangler d1 create sovereign-justice-db
# Copy the database_id into wrangler.toml
```

### Vectorize Index
```bash
npx wrangler vectorize create p31-justice-corpus --dimensions 1536 --metric cosine
```

### R2 Bucket
```bash
npx wrangler r2 bucket create sovereign-justice-evidence
```

### KV Namespace
```bash
npx wrangler kv:namespace create JUSTICE_KV
# Copy the id into wrangler.toml
```

### Queue
```bash
npx wrangler queue create evidence-ipfs-pinning
```

## Step 2: Run Migrations

```bash
npx wrangler d1 migrations apply JUSTICE_D1 --remote
```

## Step 3: Deploy Workers

```bash
# Deploy RAG pipeline
npx wrangler deploy src/rag-pipeline.ts --name sovereign-justice-rag

# Deploy evidence vault
npx wrangler deploy src/evidence-vault.ts --name sovereign-justice-evidence

# Deploy escrow engine
npx wrangler deploy src/escrow-engine.ts --name sovereign-justice-escrow
```

Or use the package scripts:
```bash
npm run deploy:all
```

## Step 4: Configure Durable Objects

The escrow engine uses a Durable Object. Ensure DO migration is applied:
```bash
npx wrangler deploy src/escrow-engine.ts --name sovereign-justice-escrow
```

## Step 5: Johnson v. Johnson Dogfood

### Ingest Case Data
```bash
# Upload evidence files
curl -X POST https://evidence.sovereign-justice.trimtab-signal.workers.dev/api/evidence/upload \
  -F "file=@/path/to/filing.pdf" \
  -F "caseId=johnson-v-johnson-001" \
  -F "submittedByDid=did:key:z..."

# Ingest into RAG corpus
curl -X POST https://rag.sovereign-justice.trimtab-signal.workers.dev/api/rag/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "johnson-v-johnson-001",
    "domain": "legal",
    "documentName": "FAA.txt",
    "chunks": [{"index": 0, "text": "9 U.S.C. § 2..."}]
  }'

# Query RAG corpus
curl -X POST https://rag.sovereign-justice.trimtab-signal.workers.dev/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{"query": "grounds for vacating arbitration award", "domain": "legal"}'
```

## API Endpoints

### RAG Pipeline
- `GET  /api/health` — Health check
- `POST /api/rag/ingest` — Ingest documents into corpus
- `POST /api/rag/query` — Semantic search
- `GET  /api/rag/documents` — List ingested documents

### Evidence Vault
- `GET  /api/health` — Health check
- `POST /api/evidence/upload` — Upload file with dual-sign
- `GET  /api/evidence/verify/:id` — Verify evidence integrity
- `GET  /api/evidence/get/:id` — Get evidence metadata
- `GET  /api/evidence/list` — List evidence (filter by caseId, status)
- `GET  /api/evidence/chain/:id` — Get chain-of-custody
- `POST /api/cases` — Create a case
- `GET  /api/cases/:id` — Get case
- `PATCH /api/cases/:id` — Update case
- `GET  /api/cases` — List cases

### Escrow Engine
- `GET  /api/health` — Health check
- `POST /api/escrow/deposit` — Deposit funds into escrow
- `POST /api/escrow/:id/release` — Release funds (DO-routed)
- `POST /api/escrow/:id/refund` — Refund (DO-routed)
- `POST /api/escrow/:id/approve` — Multi-sig approval
- `POST /api/escrow/:id/lock` — Lock for arbitration
- `GET  /api/escrow/status/:id` — Get escrow status
- `GET  /api/escrow/list` — List escrow accounts
