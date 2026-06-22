# Jitterbug User Guide

## What is the Jitterbug?

The Jitterbug is a **cognitive prosthetic** — a digital ramp that captures overwhelming complexity, breaks it into manageable pieces, and converges on reliable answers. It is designed for neurodivergent minds, isolating you from environmental noise and preventing cognitive overload.

## Using the PWA

### Install on Your Device

- **iPhone:** Safari → Share → Add to Home Screen
- **Android:** Chrome → Menu → Add to Home Screen
- **Chromebook:** Chrome → Install app

### Capturing a Brain Dump

1. Open the PWA at [jitterbug-pwa.pages.dev](https://jitterbug-pwa.pages.dev)
2. Fill in the form:
   - **Project Name** — give it a title
   - **Core Problem** — one paragraph
   - **Constraints** — non-negotiables (one per line)
   - **Known Assets** — what you already have
   - **Open Questions** — what you don't know
   - **FRUIT Target** — the desired end state
   - **Max Depth** — recursion limit (1–5, default 3)
   - **Batch Strategy** — depth-first, breadth-first, or layer-sequential
3. Click **Capture Brain Dump**
4. Wait for the orchestration to complete (you'll see the status dashboard)

### Understanding the Status Dashboard

- **Status:** `pending` → `processing` → `completed` / `failed`
- **Axes:** the decomposed workstreams (with letter labels)
- **Convergence:** `PASS` / `FAIL` with next steps

## Using the CLI

```bash
# Capture interactively
brain-dump capture --operator will

# Parse from file
brain-dump capture --file ideas.md --output brain-dump.md

# Decompose
brain-dump decompose brain-dump.md --output axes.md

# Run axes (Claude Code adapter)
brain-dump run axes.md --concurrency 4

# Check convergence
brain-dump converge axes.md --result result.json
```

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| PWA won't load | Service worker caching | Clear browser cache, reload |
| Status stays "pending" | Orchestrator DO not waking | Check Worker logs (`wrangler tail`) |
| API 401 | Invalid PSK | Check your Bearer token |
| K₄ gate failing | Fast heuristic too strict | Use `mode: 'full'` with LLM API key |
