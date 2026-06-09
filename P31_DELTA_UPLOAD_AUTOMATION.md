# P31 DELTA Upload Automation

**Purpose:** Consolidated execution summary for publishing P31 Labs artifacts to Zenodo (automated) and Ko-fi (manual).

**Date:** 2026-03-22  
**Status:** DELTA Gate D2–D4 in progress

---

## 1. AUTOMATED — Zenodo API Uploads

### Prerequisites (One-Time Setup)

```bash
# 1. Install dependencies
pip install requests

# 2. Set Zenodo API token (one-time)
export ZENODO_TOKEN="your_zenodo_api_token_here"
```

### Python Script: `zenodo_upload.py`

The script handles:
- File metadata (title, description, upload_type)
- DOI minting for major publications
- Deposition creation/update
- File upload with progress

### Files to Upload

| # | File | Description | Command |
|---|------|-------------|---------|
| 1 | `The_Minimum_Enclosing_Structure_P31_Labs_2026.pdf` | Monograph — 5 chapters, 39 refs, K₄/Maxwell/Thomson/Posner synthesis | `python zenodo_upload.py --file "The_Minimum_Enclosing_Structure_P31_Labs_2026.pdf" --title "The Minimum Enclosing Structure: Tetrahedral Geometry as Universal Architecture from Quantum Coherence to Social Resilience" --publication` |
| 2 | `Floating_Neutral_Hypothesis.pdf` | Doc1 — Basal ganglia calcification + biological voltage failure | `python zenodo_upload.py --file "Floating_Neutral_Hypothesis.pdf" --title "The Floating Neutral Hypothesis: Basal Ganglia Calcification and Biological Voltage Failure"` |
| 3 | `Mechanical_Translation_Quantum_States.pdf` | Doc2 — COBS-Framed Serial Haptic Feedback | `python zenodo_upload.py --file "Mechanical_Translation_Quantum_States.pdf" --title "Mechanical Translation of Quantum States via COBS-Framed Serial Haptic Feedback"` |
| 4 | `Hardware_Accelerated_Lattice_Decoders.pdf` | Doc3 — FPGA/Low-latency signal reconstruction | `python zenodo_upload.py --file "Hardware_Accelerated_Lattice_Decoders.pdf" --title "Hardware-Accelerated Lattice Decoders for Low-Latency Signal Reconstruction"` |
| 5 | `Floating_Neutral_SuperStonk_DD.md` | SuperStonk Due Diligence — 3000+ words, credentials-first, math-verified | `python zenodo_upload.py --file "Floating_Neutral_SuperStonk_DD.md" --title "The Floating Neutral: Why Every Centralized System Must Fail"` |
| 6 | `Festival_Family_Post.md` | Festival family outreach post — short/long versions | `python zenodo_upload.py --file "Festival_Family_Post.md" --title "As Above, So Below — Festival Family Outreach"` |

### Exact One-Line Commands

```bash
# Monograph (with DOI)
python zenodo_upload.py --file "The_Minimum_Enclosing_Structure_P31_Labs_2026.pdf" --title "The Minimum Enclosing Structure: Tetrahedral Geometry as Universal Architecture from Quantum Coherence to Social Resilience" --publication

# Doc1: Floating Neutral Hypothesis
python zenodo_upload.py --file "Floating_Neutral_Hypothesis.pdf" --title "The Floating Neutral Hypothesis: Basal Ganglia Calcification and Biological Voltage Failure"

# Doc2: Mechanical Translation
python zenodo_upload.py --file "Mechanical_Translation_Quantum_States.pdf" --title "Mechanical Translation of Quantum States via COBS-Framed Serial Haptic Feedback"

# Doc3: Hardware-Accelerated Lattice Decoders
python zenodo_upload.py --file "Hardware_Accelerated_Lattice_Decoders.pdf" --title "Hardware-Accelerated Lattice Decoders for Low-Latency Signal Reconstruction"

# SuperStonk DD
python zenodo_upload.py --file "Floating_Neutral_SuperStonk_DD.md" --title "The Floating Neutral: Why Every Centralized System Must Fail"

# Festival Family Post
python zenodo_upload.py --file "Festival_Family_Post.md" --title "As Above, So Below — Festival Family Outreach"
```

### zenodo_upload.py Template

```python
#!/usr/bin/env python3
"""
Zenodo API Upload Script for P31 Labs
Usage: python zenodo_upload.py --file <filepath> --title <title> [--description <desc>] [--publication]
"""

import os
import argparse
import requests

ZENODO_API = "https://zenodo.org/api"
DEPOSITION_ID = os.environ.get("ZENODO_DEPOSITION_ID", "1234567")  # Update per deposition

def upload_file(filepath, title, description="", is_publication=False):
    token = os.environ.get("ZENODO_TOKEN")
    if not token:
        print("ERROR: Set ZENODO_TOKEN environment variable")
        return
    
    # Create or update deposition
    if is_publication:
        # New deposition for publication (gets DOI)
        response = requests.post(
            f"{ZENODO_API}/depositions",
            params={"access_token": token},
            json={"metadata": {"title": title, "description": description, "upload_type": "publication", "publication_type": "book"}}
        )
    else:
        # Simple file upload
        response = requests.post(
            f"{ZENODO_API}/depositions",
            params={"access_token": token},
            json={"metadata": {"title": title, "description": description}}
        )
    
    deposition = response.json()
    deposition_id = deposition.get("id", DEPOSITION_ID)
    
    # Upload file
    with open(filepath, "rb") as f:
        response = requests.post(
            f"{ZENODO_API}/depositions/{deposition_id}/files",
            params={"access_token": token},
            files={"file": f}
        )
    
    print(f"Uploaded {filepath} to Zenodo: {response.json()}")
    
    # Publish if publication
    if is_publication:
        response = requests.post(
            f"{ZENODO_API}/depositions/{deposition_id}/publish",
            params={"access_token": token}
        )
        print(f"Published: {response.json()}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", required=True)
    parser.add_argument("--title", required=True)
    parser.add_argument("--description", default="")
    parser.add_argument("--publication", action="store_true")
    args = parser.parse_args()
    
    upload_file(args.file, args.title, args.description, args.publication)
```

---

## 2. MANUAL — Ko-fi Shop Uploads

**Reference:** [`KOFI_SHOP_UPLOAD_CHECKLIST.md`](./KOFI_SHOP_UPLOAD_CHECKLIST.md)

### Products to Upload

| # | Product | File | Price |
|---|---------|------|-------|
| 1 | The Minimum Enclosing Structure (Monograph) | `The_Minimum_Enclosing_Structure_P31_Labs_2026.pdf` | $5 PWYW |
| 2 | K₄ Convergence Table Print | `K4_Convergence_Table_Print.svg` | $3 |
| 3 | Floating Neutral Diagram Print | `Floating_Neutral_Diagram_Print.svg` | $3 |
| 4 | As Above So Below Print | `As_Above_So_Below_Print.svg` | $3 |

### Quick Upload Sequence

1. Log in to https://ko-fi.com/trimtab69420/shop
2. Click "Add Product" → "Digital Download"
3. Upload each product with title, description, price, tags
4. Verify all products appear in shop
5. Test purchase flow

### Tags Reference

```
physics, geometry, mathematics, chemistry, cognitive science, nonprofit, P31 Labs, Buckminster Fuller, quantum biology
geometry, mathematics, physics, Synergetics, Buckminster Fuller, K4, graph theory, poster, print
biology, hypoparathyroidism, medical, physics, electricity, diagram, poster, print, P31 Labs
sacred geometry, art, poster, print, philosophy, P31 Labs, tetrahedron, design, motivational
```

---

## 3. WHAT CANNOT BE AUTOMATED

| Item | Reason | Workaround |
|------|--------|------------|
| **Ko-fi shop uploads** | Requires browser login + manual file attachment + CAPTCHA | Manual via checklist |
| **Zenodo API token setup** | One-time OAuth/token generation at zenodo.org/account/settings/applications | Run once: `export ZENODO_TOKEN="..."` |
| **DOCX to PDF conversion** | Requires Word or LibreOffice for proper formatting | Manual: File → Save As → PDF |
| **SVG to PNG/raster** | Print files may need rasterization for some platforms | Manual in Inkscape/Illustrator |

---

## 4. Execution Sequence

```
[ ] 1. Convert DOCX files to PDF (manual)
[ ] 2. Set ZENODO_TOKEN (one-time)
[ ] 3. Run zenodo_upload.py for each of 6 files (automated)
[ ] 4. Upload 4 products to Ko-fi shop (manual via checklist)
[ ] 5. Verify DOIs and Ko-fi shop visibility
[ ] 6. Update Node Count on Ko-fi bio
```

---

## 5. Post-Upload Checklist

- [ ] DOIs minted for monograph and defensive publications
- [ ] Ko-fi shop products live with correct prices
- [ ] Links added to phosphorus31.org
- [ ] SuperStonk DD posted to subreddit (if applicable)
- [ ] Festival family outreach sent (if applicable)
- [ ] Node Count updated to reflect new supporters

---

*Last updated: 2026-03-22*
*P31 Labs — DELTA Workstream*
