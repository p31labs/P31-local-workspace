# NGI Demo Script — P31 Sovereign Mesh

**Duration:** 3 minutes (180 seconds)
**Format:** Screen recording + voiceover
**Tool:** OBS Studio (1080p, 60fps)
**Upload:** Zenodo or YouTube (unlisted); link in both NGI proposals.

---

## Segment 1: Hook (0:00–0:20) — Visual Impact

**Screen:** K4 Hero SVG animation (`site/index.html` lines 235–467)
**Voiceover:** "P31 is sovereign, post-quantum care attestation for neurodivergent families."
**Duration:** 20 seconds

**On-screen content:**
- 0:00–0:05: Black void → particles emerge → K4 mesh forms
- 0:05–0:15: K4 mesh rotates, vertices pulse with quantum palette colors
- 0:15–0:20: Text overlay fades in: "Sovereign · Neuroinclusive · Post-Quantum"

**Technical notes:**
- Open `https://phos.p31ca.org`, wait for starfield animation
- Ensure `data-spoons="3"` for balanced motion (not too sparse, not overwhelming)
- Capture the void → particles → K4 transition at 60fps
- No cursor visible; use OBS window capture

**Fallback:** Pre-recorded clip of K4 Hero animation (save as `out/demo-segment-1.mp4`)

---

## Segment 2: Problem + Solution (0:20–0:50) — Narrative

**Screen:** Spaceship Earth → PHOS Passport surface
**Voiceover:** "Care is invisible labour. There is no verifiable, privacy-preserving record of who cared for whom, and how. P31 changes that. Every attestation is anchored to a cryptographic identity that you control."
**Duration:** 30 seconds

**On-screen content:**
- 0:20–0:25: `https://p31ca.org/spaceship-earth/` — navigate through themed planets (2s per planet)
- 0:25–0:35: Transition to `https://phos.p31ca.org/passport` — show the Passport surface with DID
- 0:35–0:45: Hover over DID key material, show the sovereign identity card
- 0:45–0:50: Text overlay: "No server. No password. No tracking."

**Technical notes:**
- Spaceship Earth loads in ~3s; have it pre-loaded
- Passport surface shows DID, Ed25519 pub, ML-DSA-65 pub
- Use spoon level 3 for comfortable visual density

**Fallback:** Pre-recorded clip of Spaceship Earth navigation

---

## Segment 3: Live Demo Flow (0:50–1:30) — Hands-On

**Screen:** PHOS surfaces (Passport → PQC Keys → Care Mint)
**Voiceover:** "Three steps: create a DID, generate post-quantum keys, mint a Care SBT. No password, no server trust. The browser generates the keys. The blockchain anchors the proof."
**Duration:** 40 seconds

**On-screen content:**
- 0:50–1:00: Passport surface — generate DID (click "Create DID", show key material)
- 1:00–1:10: PQC Keys surface (`/pqc-keys`) — generate ML-DSA-65 keypair
- 1:10–1:20: Care Mint surface (`/mint`) — register DID, submit care proof
- 1:20–1:30: Show receipt with BaseSepolia TX link, dual signature (Ed25519 + ML-DSA-65)

**Technical notes:**
- Pre-generate DID keys before recording (saves ~5s of generation time)
- Show the dual signature: "Ed25519 (classical) + ML-DSA-65 (post-quantum)"
- BaseSepolia TX link opens in new tab — don't follow it, just show the link
- Cut Care SBT confirmation dialog for pacing

**Fallback:** Pre-recorded clip of the full flow

---

## Segment 4: Technical Depth (1:30–2:10) — For Evaluators

**Screen:** Molecular Field demo → Starfield demo → Gateway adaptive-ui → Federation DID Document
**Voiceover:** "Under the hood, P31 uses ML-DSA-65 post-quantum signatures, spoon-aware adaptive UI that adapts to cognitive load, and a sovereign identity registry with on-chain anchoring."
**Duration:** 40 seconds

**On-screen content:**
- 1:30–1:40: `https://p31ca.org/demos/molecular-field.html` — switch between SOLID/LIQUID/GAS/PLASMA modes
- 1:40–1:50: `https://p31ca.org/lib/starfield-demo.html` — toggle spoon levels (5→3→1→0)
- 1:50–2:00: `curl -X POST gateway.p31ca.org/api/adaptive-ui -d '{"prompt":"love","spoons":3}'` — show the JSON response
- 2:00–2:10: `https://federation.p31ca.org/actor` — show DID Document with CredentialIssuer service

**Technical notes:**
- Molecular Field: switch modes quickly, let particles settle for 2s each
- Starfield: show the visual difference between spoon levels (dense→sparse→minimal)
- Gateway: use terminal overlay in OBS, type the curl command live
- Federation: show the JSON-LD DID Document, highlight the service endpoints

**Fallback:** Pre-recorded terminal session

---

## Segment 5: Federation + EUDI (2:10–2:40) — Standards Compliance

**Screen:** Federation Bridge credential endpoints
**Voiceover:** "P31 integrates with ActivityPub, SD-JWT Verifiable Credentials, and EUDI Wallet standards. Credentials can be selectively disclosed, verified, and revoked — all cryptographically."
**Duration:** 30 seconds

**On-screen content:**
- 2:10–2:18: `POST /credential/issue` — show the SD-JWT VC issuance response
- 2:18–2:25: `POST /credential/verify` — show `verified: true` with selective disclosure
- 2:25–2:32: `GET /credential/revocation/:id` — show Status-List-2021 revocation
- 2:32–2:40: Overlay NIST IR 8547 compliance summary (text overlay)

**Technical notes:**
- Use terminal overlay for curl commands
- Show the full SD-JWT VC structure (header, payload, signature)
- Overlay a compliance matrix: DID Core v1.1 ✓, RFC 9964 ✓, SD-JWT VC draft-17 ✓, NIST IR 8547 ✓

**Fallback:** Pre-recorded terminal session + compliance graphic

---

## Segment 6: Call to Action (2:40–3:00) — Close

**Screen:** Demo suite landing page → Stats overlay → End card
**Voiceover:** "41+ tests passing. 10 surfaces. 18 pilot families. Zero typecheck errors. All deployed on Cloudflare Workers. Fund P31 via NGI TALER and Fediversity."
**Duration:** 20 seconds

**On-screen content:**
- 2:40–2:48: `https://p31ca.org/demos/` — show the enhanced demo suite landing
- 2:48–2:55: Stats overlay: "41+ tests · 10 surfaces · 18 families · 0 errors · PQC-ready"
- 2:55–3:00: End card with:
  - "P31 Labs — Sovereign, Neuroinclusive, Post-Quantum Care Attestation"
  - QR code (generate from `https://p31ca.org`)
  - "NGI TALER + Fediversity · nlnet.nl/propose"
  - "Deadline: August 1, 2026"

**Technical notes:**
- Generate QR code at `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://p31ca.org`
- Stats overlay: white text on semi-transparent dark background
- End card: hold for 5 seconds minimum

**Fallback:** Pre-made end card graphic

---

## Production Checklist

### Before Recording
- [ ] All endpoints verified live (HTTP 200)
- [ ] PHOS loaded at `data-spoons="3"` on all surfaces
- [ ] Terminal overlay configured in OBS
- [ ] QR code generated and saved
- [ ] Pre-recorded fallback clips ready

### Recording Settings
- [ ] Resolution: 1920×1080 (1080p)
- [ ] Frame rate: 60fps
- [ ] Audio: Clean voiceover, no background music
- [ ] Capture: Window capture (not screen capture) for crisp text

### Post-Production
- [ ] Add chapter markers for YouTube (one per segment)
- [ ] Add closed captions (SRT file)
- [ ] Export: MP4, H.264, AAC audio, ≤3 min
- [ ] File size: ≤100MB

### Upload
- [ ] YouTube: Upload as unlisted
- [ ] Zenodo: Upload for permanent archive
- [ ] Paste links into `docs/grants/NGI-TALER-SUBMISSION.md`
- [ ] Paste links into `docs/grants/NGI-FEDIVERSITY-SUBMISSION.md`

---

## Recording Notes
- Use the **spoon-aware** UI at `data-spoons="3"` for all dashboard segments.
- Keep each segment under its time budget; cut the Care SBT confirmations for pacing.
- No audio PII — voiceover only, no ambient sound.
- Test all URLs before recording — ensure they load in <3s.
- If a demo fails live, cut to the pre-recorded fallback clip.
- The video should feel calm, deliberate, and technically precise — not flashy.
