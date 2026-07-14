# Pilot Family Onboarding Guide — Care SBT Minting

**Audience:** The 18 backfilled pilot families (status `active` in `pilot_registry`).
**Goal:** Create a sovereign identity (DID), register it, and mint your first Care SBT on Base Sepolia.
**Time:** ~10 minutes. No crypto experience required.

> This is a **testnet** (Base Sepolia). Nothing here has real-world monetary value, and P31 never holds your keys or your funds. Everything is self-custodial.

---

## 1. Open PHOS

Go to **https://phos.p31ca.org** and open the **Passport** surface (left sidebar).

The Cognitive Passport is your local, sovereign identity document. Creating it generates an
**Ed25519 `did:key`** — a portable decentralized identifier you control. Your private key is
stored in your browser's secure key vault and never leaves your device.

- Click **Begin Passport** and fill in as much (or as little) as you like.
- Save. Your `did:key:z…` now appears at the top of the Passport.

## 2. Get an Ethereum address (receives your Care SBT)

The Care SBT mints to an Ethereum (EVM) address you control. You have three options:

| Option | Best for |
|--------|----------|
| A hardware or software wallet you already use (e.g. MetaMask, Rabby, Ledger) | Most families |
| A **watch-only** address you generate and back up securely | Extra-privacy families |
| Ask your onboarding contact to walk you through a fresh wallet | First-timers |

> Copy the address (starts with `0x…`). You will paste it into PHOS in step 4.
> **Keep the private key safe** — P31 cannot recover it.

## 3. Generate your quantum-safe key (optional but recommended)

Open the **PQC Keys** surface (`/pqc-keys`). Set a passphrase (≥8 chars) and click generate.
This produces:

- **ML-KEM-768** (FIPS 203) — encryption key for private care contracts.
- **ML-DSA-44** (FIPS 204) — post-quantum signing key.
- **ML-DSA-65** (FIPS 204) — and a **`did:jwk`** (quantum-safe DID, `kty:AKP`).

Copy your `did:jwk` if you want a future-proof identifier. You do not need to paste it anywhere yet.

## 4. Mint your Care SBT

Open the **Care Mint** surface (`/mint`):

1. Paste your Ethereum address from step 2.
2. Click **Register DID → love-ledger**. This binds your `did:key` to your address
   (self-signed — you prove control of the key; no server password needed).
3. Set your care telemetry sliders (Proximity, Resonance) and tasks completed — these
   describe the care you provided. They are 1e18-scaled on-chain.
4. Click **Mint Care SBT**.

PHOS signs the care proof with your Ed25519 DID key and relays it to the
`ledger-bridge`, which verifies your DID↔ETH binding and calls
`ProofOfCare.submitCareProofs(...)` on Base Sepolia. The first proof establishes your
baseline; a second proof within 7 days crosses the care threshold and mints the SBT.

5. A **receipt** appears with a Base Sepolia transaction hash. Click it to view your
   attestation on **https://sepolia.basescan.org/tx/0x…**.

## 5. You're done 🌱

You now hold a sovereign, court-admissible attestation of the care you provide. Share the
transaction link with a school, clinician, or court as verifiable proof — no P31 intermediary
required.

### Need help?

- Spoon-aware: PHOS reduces motion and simplifies the UI when your energy is low (set your
  spoon level in the main view).
- Stuck? Reply to your onboarding thread. We hand-hold the first five families personally.

### Contracts (Base Sepolia, chain 84532)
- `ProofOfCare` — `0x08263FdD50196F229C9C2ccD650056067b884538`
- `LOVESBT` — `0x521cAD1b54CDDB2B6B53a30EBe050C429F9c6C55`
