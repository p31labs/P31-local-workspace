# Operator: chat data — export, retention, delete (D-PA4 / D-PA5)

**Scope:** One stable `userId` = one `PersonalAgent` Durable Object (`PERSONAL_AGENT.idFromName(userId)`) on k4-personal, SQLite in-DO.

**CWP status:** D-PA5 (export) **done** — API + this doc. D-PA4 **retention:** **row cap** in Worker (`MESSAGES_MAX_ROWS`); **delete** on request is still **not** a product API — do **not** market “one-click erase” until a vetted wipe path ships.

| Question | As shipped (truth) | Before marketing “delete on request” |
|----------|----------------------|--------------------------------------|
| How long are chat messages kept? | **Soft cap:** oldest `messages` rows removed when count exceeds **`MESSAGES_MAX_ROWS`** (default 2000) after each `/chat` — **not** time-based TTL. | Optional **Alarm** + `ts`-based prune; operator **wipe** route + legal review. |
| Can a user delete all messages from the product UI? | **No** dedicated UI or public delete endpoint in v1. | Design opt-in: e.g. signed `POST /agent/:id/purge` + audit log. |
| Can a user “start fresh” in the browser? | Clearing / rotating `p31_subject_id` in localStorage **creates a new** DO on next use; the **old** DO and its data remain in Cloudflare until account-level DO eviction or a future API. | Same — disclose in product copy. |
| How does an operator export a thread? | `GET /agent/:userId/history` (see below). | — |

*Cross-link:* `docs/MESH-MAP-PERSONAL-START-PAGES.md` (personal isolation vs family cage).

---

## Export (D-PA5 — current)

- **API:** `GET /agent/:userId/history?limit=50` (server caps at **100**). Response: `{ messages: [{ id, role, content, ts, metadata? }, …] }`.
- **CORS:** Allowed from hub origins; use the same public worker base as `mesh.k4PersonalWorkerUrl` in `p31-constants.json` (or `?agent=` during testing).

**Example (operator / support):**

```bash
BASE="https://k4-personal.trimtab-signal.workers.dev"
ID="u_…"   # or guest_… — same string as in localStorage p31_subject_id
curl -sS "${BASE}/agent/${ID}/history?limit=100" | jq .
```

- **UI:** `p31ca/public/mesh-start.html` is chat-first; a dedicated “export JSON” button is **optional** product work. The API path is the canonical contract.

---

## Retention (D-PA4 — runbook, no false claims)

1. **Row cap (shipped in `k4-personal`):** `MESSAGES_MAX_ROWS` (default 2000, clamp 100…50000) — after each successful `/chat` response path, the DO runs `DELETE` for the **oldest** `messages` rows if `COUNT(*)` exceeds the cap. **Manifest:** `GET /agent/:id/manifest` includes `retention.chatMessagesMaxRows` and `retention.strategy: "delete_oldest_over_cap"`.
2. **Not a “delete my account” API:** The cap is **not** a user-triggered full wipe; it bounds SQLite growth. **soulsafe_runs** and other tables are **not** trimmed by this pass (future work if needed).
3. **Optional follow-up (PA-2.4+):** Time-based expiry (`ts` + Alarm), or an operator-only **wipe** route, remain separate.

---

## Delete / “right to be forgotten” (D-PA4 — runbook)

**Do not** promise in marketing that end users can one-click hard-delete on the current stack without implementing a secure wipe and Cloudflare’s DO lifecycle.

**What exists today**

| Action | Effect |
|--------|--------|
| User clears site data / new `subject_id` | **New** DO; old data **still on edge** under the old id until DO destroyed. |
| Operator rotates deployment / replaces Worker | New code only; **does not** by itself erase old DOs. |
| Account-level Durable Object removal | **Cloudflare dashboard / API** (account team) — outside this repo; document if legal requires physical deletion. |

**Planned product pattern (not implemented here):** Authenticated `DELETE` or `POST /agent/:id/purge` with idempotency, logging, and legal review; blocked until CWP and security sign-off.

---

## Verification (matrix)

- **D-PA4:** This runbook + honest gap (no message TTL) — **close as runbook path**; reopen when code ships.
- **D-PA5:** `GET /history` + export instructions above.
