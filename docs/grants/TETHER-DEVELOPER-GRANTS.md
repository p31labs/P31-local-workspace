# Tether Developer Grants Application — P31 Labs

**Applicant:** P31 Labs (William Johnson, principal engineer)  
**Date:** September 17, 2026  
**Deliverable:** `p31-crypto-mcp` — Post-quantum cryptography MCP server  
**Amount requested:** $3,500 (1 deliverable, mid-range)  
**Focus area:** Open-source payments infrastructure / Wallet Development Kit

---

## What we built

`p31-crypto-mcp` is a deployed Cloudflare Worker that exposes post-quantum cryptographic operations as MCP tools. It is listed on the Model Context Protocol registry at `registry.modelcontextprotocol.io` and is published on Smithery as `trimtab-signal/crypto-mcp`.

The server is live at `https://p31-crypto-mcp.trimtab-signal.workers.dev/mcp` and handles production traffic from AI agents.

### Tools exposed

| Tool | Algorithm | Purpose |
|------|-----------|---------|
| `pqc_keygen` | ML-DSA-65 (FIPS 204) + Ed25519 hybrid | Generate post-quantum signing keypairs |
| `pqc_sign` | ML-DSA-65 + Ed25519 | Sign arbitrary data with hybrid signature |
| `pqc_verify` | ML-DSA-65 + Ed25519 | Verify hybrid signatures |
| `kem_encapsulate` | ML-KEM-768 (FIPS 203) + X25519 | Hybrid key encapsulation for agent-to-agent secrets |
| `kem_decapsulate` | ML-KEM-768 + X25519 | Decapsulate shared secrets |
| `x402_create_invoice` | x402 payment protocol | Create cryptographically-signed payment invoices |
| `x402_settle` | x402 payment protocol | Settle invoices with facilitator |
| `sdjwt_issue` | SD-JWT (W3C) | Issue selective-disclosure JWT credentials |
| `sdjwt_verify` | SD-JWT (W3C) | Verify SD-JWT credentials |
| `slhdsa_sign` | SLH-DSA-128s (FIPS 205) | Hash-based post-quantum signatures |
| `slhdsa_verify` | SLH-DSA-128s (FIPS 205) | Verify SLH-DSA signatures |

### What makes it relevant to Tether

Tether's developer grants focus on four areas: Wallet Development Kit, on-device AI (QVAC), P2P networking (Pears), and open-source payments infrastructure.

`p31-crypto-mcp` sits at the intersection of **Wallet Development Kit** and **open-source payments infrastructure**:

1. **Key management for self-custodial wallets.** ML-DSA-65 keygen produces keypairs that wallets can use for signing transactions. The hybrid approach (ML-DSA-65 + Ed25519) lets wallets transition to post-quantum security without breaking existing Ed25519 infrastructure.

2. **Agent-native payment flow.** The x402 invoice tools let AI agents create and settle payment requests without a human in the loop. This is the primitive that agent-driven commerce runs on — microtransactions for API calls, compute, or data.

3. **Verifiable credentials for KYC/AML.** SD-JWT issuance and verification enables selective disclosure of identity attributes. A wallet can prove it belongs to a verified user without revealing the user's full identity.

### What we would build next

With Tether funding, the next deliverable is **`p31-tether-wallet`** — a minimal self-custodial wallet backend that uses `p31-crypto-mcp` as its signing layer and settles via x402 invoices denominated in USDT.

Scope:
- Wallet creation flow using ML-DSA-65 keypairs
- USDT invoice creation via x402 protocol
- Settlement confirmation via Tether API
- MCP tools exposed so AI agents can request and confirm payments

Timeline: 6–8 weeks from funding.

### Why P31 Labs

P31 Labs builds open-source assistive technology. The principal engineer is a late-diagnosed AuDHD developer with permanent hypoparathyroidism building tools for the same population. The work is self-funded, mission-aligned, and has no institutional affiliation.

The crypto-mcp server is already deployed, already in the MCP registry, already handling production traffic. This is not a proposal to build something new from scratch. It is a proposal to extend working code into the Tether ecosystem.

### Budget

| Item | Amount |
|------|--------|
| Deliverable 1: `p31-crypto-mcp` (already built, seeking retroactive + continuation funding) | $2,000 |
| Deliverable 2: `p31-tether-wallet` (new, 6–8 weeks) | $3,500 |
| **Total** | **$5,500** |

We are requesting $3,500 for the Tether wallet deliverable. The existing `p31-crypto-mcp` work qualifies for retroactive consideration under Tether's open-source payments infrastructure track.

---

## Links

- Live MCP server: `https://p31-crypto-mcp.trimtab-signal.workers.dev/mcp`
- Smithery listing: `https://smithery.io/server/trimtab-signal/crypto-mcp`
- MCP Registry: `https://registry.modelcontextprotocol.io/servers/trimtab-signal/crypto-mcp`
- Source code: `https://github.com/p31labs/P31-local-workspace/tree/main/workers/p31-crypto-mcp`
- Funding manifest: `https://p31ca.org/funding.json`
