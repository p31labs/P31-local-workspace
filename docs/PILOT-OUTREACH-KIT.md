# P31 Pilot Family Outreach Kit

**CWP:** CWP-2026-058 (Fortune 1 Launch)
**Date:** 2026-07-15
**Status:** Ready for manual outreach

---

## Overview

This kit provides everything needed to invite and onboard pilot families into the P31 Sovereign Mesh. The 18 families in `pilot_registry` are test/seed entries — replace with real family data before sending.

## Quick Start

```bash
# View all pilots and their status
node scripts/pilot-onboard.js --status

# Generate onboarding links for all pending pilots
node scripts/pilot-onboard.js --export-links

# Export status as CSV for spreadsheet tracking
node scripts/pilot-onboard.js --export-csv

# Print outreach email templates with filled-in URLs
node scripts/pilot-onboard.js --template

# Print a one-page summary
node scripts/pilot-onboard.js --summary

# Mark a pilot as onboarded (after they complete onboarding)
node scripts/pilot-onboard.js --onboard <did>
```

---

## Email Template

**Subject:** Your family's sovereign care identity is ready

```
Dear [Family Name],

P31 Labs has selected your family as one of 18 pilot families to test our
sovereign, post-quantum-secure care attestation system.

What is P31?
  P31 is an open-source assistive technology platform that lets neurodivergent
  families create verifiable, privacy-preserving records of care. Your data
  stays in your browser — we never see it.

Your onboarding link:
  https://phos.p31ca.org/portal/?did=[DID]

Steps:
  1. Open the link above in Chrome or Firefox
  2. Create your DID (decentralised identifier) — your browser generates a
     cryptographic keypair; the private key never leaves your device
  3. Generate post-quantum keys (ML-DSA-65) — protects against future quantum
     computers
  4. Register your DID on Base Sepolia (testnet — no real money involved)
  5. Submit your first care proof — describe a care event (e.g., "Helped with
     homework for 2 hours")
  6. Mint your Care SBT — a non-transferable Soulbound Token representing your
     care contribution

No crypto experience needed. The whole process takes about 5 minutes.

Support:
  - Reply to this email
  - Dashboard: https://pilot.p31ca.org
  - PHOS workspace: https://phos.p31ca.org

— The P31 Team
  https://p31ca.org
```

---

## Discord DM Template

```
Hey [Family Name]! The P31 Sovereign Mesh is live. Your family has been
selected as a Genesis Node in our pilot programme.

Your onboarding link:
  https://phos.p31ca.org/portal/?did=[DID]

It takes about 5 minutes:
  1. Open the link
  2. Create your DID
  3. Generate PQC keys
  4. Register on testnet
  5. Submit a care proof
  6. Mint your Care SBT

No crypto needed — it's all testnet. I'll walk you through it if you want.

Guide: https://p31ca.org/onboarding
```

---

## Step-by-Step Onboarding Walkthrough

### Step 1: Create Your DID
- Open the onboarding link in Chrome or Firefox
- Click "Create DID"
- Your browser generates a cryptographic keypair
- **The private key never leaves your device** — this is sovereignty
- You'll see your `did:key` (Ed25519) displayed

### Step 2: Generate Post-Quantum Keys
- Navigate to the PQC Keys surface
- Click "Generate PQC Keys"
- This creates ML-DSA-65 keypair (NIST-standardized post-quantum algorithm)
- Protects your care records against future quantum computers

### Step 3: Register Your DID
- Click "Register DID"
- This binds your DID to an ETH address on Base Sepolia (testnet)
- No real money — Base Sepolia is a test network

### Step 4: Submit a Care Proof
- Navigate to the Care Mint surface
- Describe a care event (e.g., "Helped with homework for 2 hours")
- Your browser signs it with Ed25519 and co-signs with ML-DSA-65
- Click "Submit Care Proof"

### Step 5: Mint Your Care SBT
- Click "Mint Care SBT"
- This creates a Soulbound Token (non-transferable) on Base Sepolia
- Your care contribution is now verifiable and court-admissible

---

## FAQ

**Q: Is my data private?**
A: Yes. Your keys never leave your browser. Care proofs are signed client-side. The ledger stores only hash chains — no plaintext data.

**Q: What if I lose my keys?**
A: Your DID is tied to your browser's key storage. If you clear browser data, you'll need to create a new DID. We recommend backing up your PQC keys.

**Q: Is this real blockchain stuff?**
A: P31 uses Base Sepolia (Ethereum testnet) for anchoring. Your Care SBT is a testnet token — no real money involved.

**Q: Do I need crypto experience?**
A: No. The onboarding wizard guides you through each step. No wallet setup, no gas fees, no token purchases.

**Q: What browsers are supported?**
A: Chrome 90+, Firefox 90+, Edge 90+, Safari 15+. Mobile browsers work but desktop is recommended for the best experience.

**Q: How long does onboarding take?**
A: About 5 minutes for the full flow (DID → PQC keys → Care SBT).

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Page doesn't load | Try Chrome or Firefox. Clear cache. Disable ad blockers. |
| "Web Crypto unavailable" | Use HTTPS (not HTTP). Use a modern browser. |
| DID generation fails | Refresh the page and try again. Check browser console for errors. |
| Base Sepolia transaction fails | The testnet may be congested. Wait 30 seconds and retry. |
| Keys not saving | Ensure localStorage is enabled. Don't use private/incognito mode. |

---

## Pilot Tracker Template

See `docs/PILOT-TRACKER-TEMPLATE.md` for a blank tracker you can copy to a spreadsheet.

---

## Sending Invitations

**There is no automated send capability.** Sending invitations is manual outreach:

1. Run `node scripts/pilot-onboard.js --export-csv` to get the CSV
2. Open the CSV in a spreadsheet
3. For each family, copy the onboarding URL
4. Send via email or Discord DM using the templates above
5. After they onboard, run `node scripts/pilot-onboard.js --onboard <did>`

---

## Files

| File | Purpose |
|------|---------|
| `docs/PILOT-OUTREACH-KIT.md` | This document |
| `docs/PILOT_ONBOARDING_GUIDE.md` | User-facing onboarding guide |
| `docs/PILOT-TRACKER-TEMPLATE.md` | Blank tracker template |
| `scripts/pilot-onboard.js` | CLI tool for pilot management |
| `out/pilot-links-*.txt` | Generated onboarding links |
| `out/pilot-status-*.csv` | Generated status CSV |
