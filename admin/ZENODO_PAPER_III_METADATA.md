# ZENODO UPLOAD — Paper III: Consciousness, Memory, Architecture
## Agent Instructions + Metadata

---

## UPLOAD METHOD

Use the existing `zenodo_upload.py` script at the repo root.

```bash
# IMPORTANT: Use a FRESH token. The old one (iB6RL...) was rotated.
# Get the current token from: gh secret get ZENODO_TOKEN
# Or generate a new one: zenodo.org → Settings → Applications → Personal Access Tokens

export ZENODO_TOKEN="<your_new_token>"

python zenodo_upload.py \
  --file "P31_Consciousness_Memory_Architecture.pdf" \
  --title "Consciousness, Memory, and the Architecture of Self-Preservation: Neuroscientific Foundations for Cognitive Prosthetic Design" \
  --description "Third paper in the P31 Labs research trilogy. Synthesizes evidence across cognitive psychology, computational neuroscience, and digital systems architecture to establish theoretical foundations for cognitive prosthetic design. Companion to the Tetrahedron Protocol (10.5281/zenodo.19004485) and Genesis Whitepaper (10.5281/zenodo.19411363)." \
  --creators "Johnson, William R." \
  --keywords "cognitive prosthetics,predictive processing,neural entrainment,context-dependent memory,delta topology,loosely coupled architecture,digital zeitgebers,knowledge externalization,belief change,trauma,neurodivergent,assistive technology" \
  --token "$ZENODO_TOKEN"
```

If the script creates a draft (--no-publish), complete these steps in the Zenodo web UI before publishing:

---

## ZENODO WEB UI STEPS (After Draft Creation)

1. **Related Identifiers** — Add TWO relationships:
   - "Is supplement to" → `10.5281/zenodo.19004485` (Tetrahedron Protocol)
   - "Is supplement to" → `10.5281/zenodo.19411363` (Genesis Whitepaper)

2. **Creator ORCID** — Add `0009-0002-2492-9079` to William R. Johnson

3. **Affiliation** — Set to "P31 Labs, Inc."

4. **Resource Type** — Preprint

5. **License** — Creative Commons Attribution 4.0 International (CC BY 4.0)

6. **Communities** — Submit to:
   - Assistive Technology (if available)
   - Open Source (if available)
   - Neuroscience (if available)

7. **Publish** → New DOI assigned

---

## ZENODO METADATA (JSON format for API)

```json
{
  "metadata": {
    "title": "Consciousness, Memory, and the Architecture of Self-Preservation: Neuroscientific Foundations for Cognitive Prosthetic Design",
    "upload_type": "publication",
    "publication_type": "preprint",
    "description": "Third paper in the P31 Labs research trilogy. Synthesizes evidence across cognitive psychology (Haidt, Friston, Janoff-Bulman, Festinger, Kahneman), computational neuroscience (O'Keefe place cells, theta-gamma coupling, neural entrainment), and digital systems architecture (CAP theorem, CRDTs, Zettelkasten) to establish the theoretical foundations for cognitive prosthetic design. Central finding: the optimal architecture for both biological and digital cognitive systems is loosely coupled autonomy — maximum local sovereignty with asynchronous connections for learning and reality-testing. This directly validates the Delta mesh topology underlying the P31 Labs ecosystem. Companion to the Tetrahedron Protocol (DOI: 10.5281/zenodo.19004485) and Genesis Whitepaper (DOI: 10.5281/zenodo.19411363).",
    "creators": [
      {
        "name": "Johnson, William R.",
        "affiliation": "P31 Labs, Inc.",
        "orcid": "0009-0002-2492-9079"
      }
    ],
    "keywords": [
      "cognitive prosthetics",
      "predictive processing",
      "neural entrainment",
      "context-dependent memory",
      "delta topology",
      "loosely coupled architecture",
      "digital zeitgebers",
      "knowledge externalization",
      "belief change",
      "trauma",
      "neurodivergent",
      "assistive technology",
      "Posner molecule",
      "tetrahedron protocol"
    ],
    "related_identifiers": [
      {
        "identifier": "10.5281/zenodo.19004485",
        "relation": "isSupplementTo",
        "scheme": "doi"
      },
      {
        "identifier": "10.5281/zenodo.19411363",
        "relation": "isSupplementTo",
        "scheme": "doi"
      }
    ],
    "license": "cc-by-4.0",
    "access_right": "open",
    "language": "eng"
  }
}
```

---

## POST-PUBLISH CHECKLIST

After the DOI is minted:

- [ ] Update CogPass v3.2 Documentation Status with third DOI
- [ ] Update GOD Ground Truth with third DOI
- [ ] Update Traction Package v3 with third DOI
- [ ] Update phosphorus31.org/research with third paper section
- [ ] Update p31_forge.py footer with third DOI
- [ ] Add DOI badge to root README.md
- [ ] Update all grant drafts to reference three DOIs
- [ ] Cross-post announcement to Ko-fi, Discord, Twitter

---

## SECURITY REMINDERS

- **DO NOT paste the Zenodo token into any chat window, document, or shift report.**
- Inject via terminal: `export ZENODO_TOKEN="..."` or `gh secret set ZENODO_TOKEN`
- Rotate immediately if exposed.
- Previous tokens exposed in this conversation have already been rotated.

---

## THE TRILOGY

| # | Paper | DOI | Focus |
|---|-------|-----|-------|
| I | Tetrahedron Protocol | 10.5281/zenodo.19004485 | Mathematical optimality (geometry, graph theory, QM) |
| II | Genesis Whitepaper | 10.5281/zenodo.19411363 | Applied implementation (6 deployed systems) |
| III | Consciousness & Memory | **PENDING** | Neuroscientific foundation (why this architecture is correct) |
