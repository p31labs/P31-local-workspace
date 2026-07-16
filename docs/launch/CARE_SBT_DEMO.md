# Care SBT — Demo Walkthrough & Recording Checklist

**Use this to record the 2–3 minute demo for the NGI submissions.** Every step below is live today.
The agent cannot record video; follow this script with a screen recorder (e.g. OBS / QuickTime).

## Narrative (30s intro, spoken)
> "P31 lets neurodivergent families prove the care they provide — privately, sovereignly, and with
> court-admissible evidence. In three steps a family creates an identity, registers it, and mints a
> Care SBT on a public blockchain, without ever giving P31 a password or a key."

## Shot list

| # | Screen | Action | What to say |
|---|--------|--------|-------------|
| 1 | phos.p31ca.org | Pan the ambient workspace; hover the sidebar | "This is PHOS — a spoon-aware assistive workspace." |
| 2 | /passport | Click **Begin Passport** → save | "One click creates a sovereign `did:key` (Ed25519). The key never leaves the browser." |
| 3 | /pqc-keys | Generate (passphrase) → show cards | "We also issue post-quantum keys — ML-KEM-768, ML-DSA-44, and a quantum-safe `did:jwk` (ML-DSA-65, `kty:AKP`)." |
| 4 | /mint | Paste an ETH address → **Register DID** | "The family binds their DID to their wallet — self-signed, no server trust." |
| 5 | /mint | Set sliders (Proximity, Resonance) → **Mint Care SBT** | "PHOS signs the care proof and relays it to our bridge, which verifies the DID↔ETH binding." |
| 6 | Receipt | Click the tx hash | "On-chain, `ProofOfCare.submitCareProofs` is called. Here's the live attestation on Base Sepolia." |
| 7 | sepolia.basescan.org/tx/… | Show the tx | "Court-admissible, verifiable by anyone — school, clinician, or court." |

## Commands (for a scripted/cli capture instead of video)
```bash
# 1) Register a DID (self-signed Ed25519) — see docs/DEVELOPER_API_GUIDE.md
curl -X POST https://love-ledger.p31ca.org/identity/register \
  -H 'Content-Type: application/json' -d '{ ... did, ed25519_pub, eth_address, signature }'

# 2) Relay a signed care proof (verified by the bridge, mints SBT)
curl -X POST https://ledger-bridge.trimtab-signal.workers.dev/care-proof \
  -H 'Content-Type: application/json' -d '{ ... did, signature, users, tProx, qRes, tasks, entropyRoots }'
```

## Checklist before recording
- [ ] Spoon level set to a calm value (motion visible but not distracting).
- [ ] Use a dedicated demo DID + a fresh testnet ETH address (Base Sepolia faucet).
- [ ] Confirm the receipt link opens on sepolia.basescan.org.
- [ ] Keep PII out of frame (no real family names/addresses).
- [ ] Export as MP4 (≤3 min); upload to Zenodo/YouTube; link from both NGI proposals.
