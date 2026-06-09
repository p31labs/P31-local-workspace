# WCD-11: IN-GAME BUG REPORT SUBMISSION

**Status:** 🟡 HIGH — needed before Facebook soft launch (March 3)
**Date:** March 2, 2026
**Author:** Opus (Architect)
**Executor:** Sonnet (Mechanic)
**Priority:** After WCD-09 (viewport fix). Before Facebook post goes live.
**Rationale:** Testers need a zero-friction path to report bugs from inside the game. "DM me on Facebook" is lossy, unstructured, and doesn't capture device context. Every bug report is also a Genesis Block telemetry event — timestamped proof of community engagement.

---

## 1. FEATURE DESCRIPTION

A small bug icon (🐛) in the HUD bar. Tap it → lightweight overlay appears. Tester types what went wrong → taps Submit → report POSTs to Cloudflare Worker with auto-captured device and game context → overlay closes with a "Thanks!" confirmation → game resumes.

Total user effort: one tap, a few words, one tap. That's it.

### Design Principles

- **Zero friction.** No login, no email, no account. Name field pre-fills from lobby if available.
- **Auto-capture everything.** The tester describes *what happened*. The system captures *where, when, how, and on what device*.
- **Genesis Block integration.** Bug reports emit a telemetry event (`BUG_REPORT`). Every report is part of the immutable ledger.
- **Glassmorphism.** The overlay follows the Cockpit spatial doctrine (WCD-08). Modal layer at z-index 60 per the contract.

---

## 2. FILE MANIFEST

Files you WILL touch:

| File | Action |
|------|--------|
| `src/components/BugReport.tsx` | **CREATE** — new component: overlay + form + submit logic |
| `src/components/HUD.tsx` (or equivalent) | **MODIFY** — add 🐛 button to HUD icon bar |
| `worker-telemetry.ts` (or relay worker) | **MODIFY** — add `/bug-report` endpoint |
| `src/telemetry/eventBus.ts` | **MODIFY** — add `BUG_REPORT` event type if not already in union |

Files you MUST NOT touch:

| File | Reason |
|------|--------|
| `src/chemistry/*` | Chemistry engine is unrelated |
| `src/economy/*` | L.O.V.E. ledger — read from, don't modify |
| `src/stores/gameStore.ts` | Read current state for context, don't modify store logic |

---

## 3. COMPONENT SPEC: BugReport.tsx

### State

```typescript
interface BugReportState {
  isOpen: boolean;
  description: string;
  submitting: boolean;
  submitted: boolean;
}
```

### Auto-Captured Context (gathered on open, sent on submit)

```typescript
interface BugReportPayload {
  // User input
  description: string;
  testerName: string;          // from lobby name or "Anonymous"

  // Device context (auto)
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;       // window.innerWidth
  viewportHeight: number;      // window.innerHeight
  devicePixelRatio: number;
  touchSupport: boolean;       // 'ontouchstart' in window
  platform: string;            // navigator.platform

  // Game context (auto)
  currentMode: string;         // Seed / Sprout / Sapling
  moleculesBuilt: string[];    // list of formulas completed this session
  atomsOnCanvas: number;       // current atom count
  loveBalance: number;         // current L.O.V.E. balance
  achievementsUnlocked: string[];
  sessionDuration: number;     // seconds since game start
  isMultiplayer: boolean;
  roomCode: string | null;

  // Meta
  timestamp: string;           // ISO 8601
  buildVersion: string;        // import from package.json or env var
  url: string;                 // window.location.href
}
```

### UI Layout

```
┌──────────────────────────────────┐
│          Report a Bug  🐛    ✕   │  ← glassmorphism header
├──────────────────────────────────┤
│                                  │
│  What went wrong?                │
│  ┌────────────────────────────┐  │
│  │                            │  │  ← textarea, 3-4 rows
│  │                            │  │     placeholder: "The atoms
│  │                            │  │      wouldn't drag..." 
│  └────────────────────────────┘  │
│                                  │
│  Your name (optional)            │
│  ┌────────────────────────────┐  │
│  │ Carrie                     │  │  ← pre-filled from lobby
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │       Submit Report        │  │  ← green button, matches palette
│  └────────────────────────────┘  │
│                                  │
│  📎 Device info will be          │  ← small muted text
│     included automatically       │
│                                  │
└──────────────────────────────────┘
```

### Behavior

1. Tap 🐛 → overlay opens at z-index 60 (modal layer per WCD-08 contract)
2. Game pauses / dims behind overlay (pointer-events: none on canvas)
3. Textarea auto-focuses (keyboard opens on mobile)
4. Submit → button shows spinner → POST to Worker → on success: show "Thanks! 🧪" for 1.5s → auto-close
5. On error: show "Couldn't send. Try again." — keep form populated so tester doesn't lose text
6. Close (✕) at any time → overlay closes, game resumes
7. Emit `BUG_REPORT` event to eventBus on successful submit (Genesis Block records it)

### Styling

```css
.bug-report-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;                     /* modal layer per Cockpit contract */
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);  /* dim backdrop */
}

.bug-report-panel {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 24px;
  width: min(90vw, 400px);
  color: #e0e0e0;
}

.bug-report-textarea {
  width: 100%;
  min-height: 80px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: #e0e0e0;
  padding: 12px;
  font-size: 16px;                  /* prevents iOS zoom on focus */
  resize: vertical;
}

.bug-report-submit {
  width: 100%;
  padding: 14px;
  background: #4ade80;             /* matches Create Room green */
  color: #0a0a0a;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  min-height: 48px;                /* touch target per WCD-09 */
}
```

---

## 4. WORKER ENDPOINT SPEC

### Route: POST `/bug-report`

Add to existing Worker (same one handling telemetry or relay).

```typescript
async function handleBugReport(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as BugReportPayload;

  // Validate: description must be non-empty
  if (!body.description || body.description.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Description required' }), {
      status: 400,
      headers: corsHeaders
    });
  }

  // Generate unique key
  const id = `bug:${Date.now()}:${crypto.randomUUID().slice(0, 8)}`;

  // Store in KV with 90-day TTL
  await env.BONDING_KV.put(id, JSON.stringify({
    ...body,
    receivedAt: new Date().toISOString(),
    id
  }), { expirationTtl: 60 * 60 * 24 * 90 });

  return new Response(JSON.stringify({ success: true, id }), {
    status: 200,
    headers: corsHeaders
  });
}
```

### CORS

Same CORS headers as all other endpoints. Ensure OPTIONS preflight handler exists (see WCD-10 Check 3).

### Retrieval (for Will)

To review bug reports, hit the Worker with a list operation:

```bash
# List all bug reports
curl https://bonding-relay.trimtab-signal.workers.dev/bug-reports
```

Add a simple GET `/bug-reports` handler that does `KV.list({ prefix: 'bug:' })` and returns the results. This is an admin/developer endpoint — no auth needed for now since the data is just bug descriptions and device info.

---

## 5. GENESIS BLOCK INTEGRATION

On successful bug report submission, emit to eventBus:

```typescript
eventBus.emit({
  type: 'BUG_REPORT',
  timestamp: Date.now(),
  data: {
    reportId: response.id,     // from Worker response
    testerName: payload.testerName,
    descriptionLength: payload.description.length
  }
});
```

Do NOT include the full description in the telemetry event — it's already stored in KV. The Genesis Block just records that a report was filed, when, and by whom. This creates the engagement timestamp.

---

## 6. VERIFICATION CHECKLIST

- [ ] **🐛 button visible in HUD** on both mobile and desktop
- [ ] **Overlay opens** on tap, game dims behind it
- [ ] **Textarea auto-focuses** and mobile keyboard opens
- [ ] **Submit succeeds:** green confirmation, overlay auto-closes after 1.5s
- [ ] **Submit with empty description:** shows validation error, does not POST
- [ ] **Close button works:** overlay closes, game resumes
- [ ] **Auto-captured context:** check KV entry includes UA, screen size, game state
- [ ] **Genesis Block event:** BUG_REPORT event appears in telemetry stream
- [ ] **Worker endpoint:** `curl -X POST .../bug-report -d '{"description":"test"}'` returns success
- [ ] **Bug report list:** `curl .../bug-reports` returns stored reports
- [ ] **Mobile touch:** overlay is scrollable if content exceeds viewport on small screens
- [ ] **Font size 16px on inputs:** iOS does not zoom on textarea focus
- [ ] **z-index 60:** overlay sits above all game elements per Cockpit contract
- [ ] **Existing Vitest suite:** `npm run test` — all 484 tests still green
- [ ] **Build clean:** `npm run build` — zero errors

---

## 7. SCOPE BOUNDARY

This WCD covers a MINIMAL bug report form. The following are explicitly OUT OF SCOPE:

- Screenshot capture (nice-to-have, not needed for soft launch)
- Bug report categories / severity dropdowns (adds decisions, adds friction)
- Email notifications to Will (check KV manually or build later)
- Bug report dashboard UI (curl is fine for now)
- Image upload (adds complexity, not needed)

The goal is: tester sees bug → taps 🐛 → types a sentence → taps submit → done. Everything else is auto-captured. Ship it minimal.

---

*WCD-11 — Opus — March 2, 2026*
*"Lower the friction to zero. If a tester has to leave the game to report a bug, you've already lost the bug report."*
