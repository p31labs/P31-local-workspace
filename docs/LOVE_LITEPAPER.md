# LOVE: A Soulbound, Non‑Extractive Care Economy

**P31 Labs — Sovereign, Neuroinclusive, Agent‑Native**

*Version 1.0 — July 2026*

---

## 1. The Invisible Economy

Millions of hours of neurodivergent family care disappear into thin air every day—unvalued by markets, invisible to courts, and unsupported by technology. The LOVE economy changes that.

LOVE is a **proof-of-care protocol** that turns acts of care into a private, verifiable, and completely non‑transferable digital value. It is not a cryptocurrency. It cannot be bought, sold, or speculated on. It is earned, worn, and spent exclusively on care.

---

## 2. What LOVE Solves

| Problem | LOVE's Answer |
|--------|---------------|
| Care work is economically invisible | Every care act earns LOVE tokens that are recorded immutably |
| Families need court‑admissible records without surrendering privacy | LOVE generates a tamper‑evident hash chain that proves care without exposing intimate details |
| Traditional tokens incentivise extraction and speculation | LOVE is **soulbound** — no transfers, no markets, no value leakage |
| Neurodivergent individuals and families are underserved by financial tools | The system is built with neuroinclusive principles from day one |

---

## 3. How LOVE Works

**Earning** — Users earn LOVE through verifiable care actions: completing bonding games, sending care signals, logging calcium (grounding), creating artifacts, and direct interpersonal support. Each action carries a "care score" weight that gates earning — only sustained, active caregiving produces value.

**The Two‑Pool Model** — Every LOVE earned is split 50/50:

- **Sovereignty Pool** — Long‑term, non‑spendable reserves. Vests over time (10 % at age 13 → 100 % at age 25), preserving a family's care legacy across generations.
- **Performance Pool** — Liquid, spendable balance. The amount available is modulated by the user's current care score, ensuring that access to value stays tied to active participation.

**Spending** — LOVE can be redeemed for care‑related goods and services: therapy sessions, assistive technology, respite care, peer support. Only the performance pool is spendable, and every transaction is recorded.

**Decay, not hoarding** — Care scores decay gently after 7 days of inactivity (0.005/day, down to a floor of 0.1). This prevents "care hoarding" and keeps the economy alive.

---

## 4. Built for Privacy and Law

LOVE is designed to be both **privacy‑preserving** and **court‑admissible**.

- **Off‑chain by default** — All balances and transactions live in a secure off‑chain ledger (Cloudflare D1 + Durable Objects). No sensitive personal data ever touches a public blockchain.
- **On‑chain attestations** — High‑value milestones are mirrored as **soulbound badges** (ERC‑5192) on the Base network. These badges are public, verifiable, and non‑transferable — perfect for proving trustworthiness to a therapist, a school, or a court.
- **Hash‑chain integrity** — Every LOVE transfer is linked by SHA‑256 hashes into a per‑DID forensic chain (`prev_hash` → prior `entry_hash`, genesis = 64 zeros). A `valid` continuity flag and a deterministic root hash can be verified at any time, and a signed **court‑admissible export** (JSON + plaintext affidavit) can be produced on demand and archived to cold storage. The chain proves consistency of care without exposing emotional content.
- **Future cash‑like privacy** — We plan to integrate GNU Taler's blind‑signature technology, allowing LOVE to be spent with the same privacy guarantees as physical cash, while still preventing fraud.

---

## 5. Agent‑Native Discovery

LOVE is built for the age of assistive agents. The ledger exposes an **MCP (Model Context Protocol) server**, so any AI assistant can read balances, sync state, and interact with care records — all while preserving the user's sovereignty.

Just ask your agent: *"How much LOVE do I have?"* — and it will know.

---

## 6. What LOVE Is Not

- Not a security, not an investment, not a token for speculation.
- Not a surveillance tool — we don't sell data, we don't track you, we don't profit from attention.
- Not a utopian promise — it's a working system, with production code and a clear, honest roadmap.

---

## 7. Status & Roadmap

**Live today**
- Off‑chain ledger (deployed worker) with transfer, stake, two‑pool model (sovereignty/performance derived from earned LOVE), and care‑score (decay + floor)
- SHA‑256 hash chain with per‑DID continuity verification (`/chain`, `valid` flag + root hash)
- Court‑admissible export (`/export`) — self‑verifying JSON artifact + plaintext affidavit, archived to R2 (WORM) on demand and via a 6‑hourly cold snapshot
- ERC‑5192 soulbound badges (Smart contracts ready, deployed on testnet)
- MCP server for agent integration
- DID:key + WebAuthn identity module

**In progress (next 3–6 months)**
- Earn‑time 50/50 pool split (currently the split is derived from earned LOVE; a dedicated earn endpoint lands the mint‑time split)
- Production‑grade retention pruning (R2 is already the cold WORM store; live D1 retains the full chain for O(1) verification)
- Richer court export (PDF rendering + detached signature over the root hash)

**Planned (2027+)**
- GNU Taler blind signatures for private spending
- HRV‑synchronised "Green Coherence" care signals
- Interoperability with other neuroinclusive platforms

---

## 8. Join Us

The LOVE economy is not a startup. It's a **public good** built by and for neurodivergent families. If you believe that care deserves a ledger and that love is the ultimate proof of work, we welcome you.

**[Link to repo, Discord, etc.]**
