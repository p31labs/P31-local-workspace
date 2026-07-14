# P31 Pilot Onboarding Guide

Welcome to the P31 pilot programme. You've been selected as one of 18 families testing sovereign, post-quantum-secure care attestation.

## What is P31?

P31 is an open-source assistive technology platform that lets neurodivergent families create verifiable, privacy-preserving records of care. Your data stays in your browser — we never see it.

## Onboarding Steps

### Step 1: Create Your DID
A DID (Decentralised Identifier) is your sovereign identity. Click "Create DID" in the onboarding wizard. Your browser generates a cryptographic keypair — the private key never leaves your device.

### Step 2: Generate Post-Quantum Keys
P31 uses ML-DSA-65, a NIST-standardised post-quantum signature algorithm. This protects your care records against future quantum computers. Click "Generate PQC Keys" in the wizard.

### Step 3: Register Your DID
Your DID is registered on Base Sepolia (Ethereum testnet). This creates an on-chain binding between your identity and your ETH address. Click "Register DID".

### Step 4: Submit a Care Proof
Describe a care event (e.g., "Helped with homework for 2 hours"). Your browser signs it with your Ed25519 key and optionally co-signs with ML-DSA-65. Click "Submit Care Proof".

### Step 5: Mint Your Care SBT
Mint a Soulbound Token (non-transferable) that represents your care contribution. This is your verifiable care credential. Click "Mint Care SBT".

## Need Help?

- **Email:** support@p31ca.org
- **Dashboard:** https://pilot.p31ca.org
- **PHOS:** https://phos.p31ca.org

## FAQ

**Q: Is my data private?**
A: Yes. Your keys never leave your browser. Care proofs are signed client-side. The ledger stores only hash chains — no plaintext data.

**Q: What if I lose my keys?**
A: Your DID is tied to your browser's key storage. If you clear browser data, you'll need to create a new DID. We recommend backing up your PQC keys.

**Q: Is this real blockchain stuff?**
A: P31 uses Base Sepolia (Ethereum testnet) for anchoring. Your care SBT is a testnet token — no real money involved.
