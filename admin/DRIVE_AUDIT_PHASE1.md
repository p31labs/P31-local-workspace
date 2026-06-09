# P31 Google Drive Audit - Phase 1
Generated: 2026-02-26

## Executive Summary

| Metric | Count |
|--------|-------|
| Top-level folders | 11 |
| Loose files at root | 603 |
| Legacy PHENIX files | 50+ |
| Legacy WONKY SPROUT files | 15+ |
| Legacy SIMPLEX files | 6 |
| Duplicate files (with suffixes) | 30+ |

**Critical Finding:** 603 files at Drive root level require organization.

---

## Target Folder Structure (WCD Spec)

```
G:\My Drive\
├── 00_ADMIN/
│   ├── WCD/                    # Work Control Documents
│   ├── Defensive-Pubs/         # Published prior art
│   └── Corporate/              # P31 Labs admin
├── 01_LEGAL/
│   ├── Family-Court/           # Custody litigation
│   └── SSA/                    # Social Security Administration
├── 02_PRODUCT/
│   ├── Spaceship-Earth/        # Main product
│   ├── Cognitive-Shield/       # Shield component
│   ├── Buffer-Agent/           # AI agent
│   └── Hardware/               # Firmware, FW-*, HW-*
├── 03_GRANTS/
│   ├── Applications/           # Grant applications
│   └── Reports/                # Grant reporting
├── 04_COMMS/
│   ├── Substack/               # Publishing
│   └── Outreach/               # External comms
├── 05_MEDICAL/
│   ├── Records/                # Medical documentation
│   └── ADA/                    # Accommodation docs
├── 06_ARCHIVE/
│   ├── SIMPLEX/                # Legacy SIMPLEX brand
│   ├── Wonky-Sprout/           # Legacy Wonky Sprout brand
│   └── Phenix/                 # Legacy Phenix brand
├── P31_Sync/                   # Keep (ingest loop)
├── P31_OPERATIONS_ROOT/        # Keep (operations hub)
└── Google AI Studio/           # Keep (system folder)
```

---

## Naming Convention

All migrated files will be renamed to:
```
[YYYY-MM-DD]_[CATEGORY]_[DESCRIPTION].[ext]
```

Examples:
- `MOTION_TO_RECUSE.gdoc` → `2026-02-26_LEGAL_Motion-to-Recuse.gdoc`
- `Phenix Citadel Research.gdoc` → `2025-01-15_ARCHIVE_Phenix-Citadel-Research.gdoc`
- `## FW-06- LoRa Radio Component.gdoc` → `2026-01-20_PRODUCT_FW-06-LoRa-Radio-Component.gdoc`

---

## Existing Folder Migration

| Current Folder | Status | Target |
|----------------|--------|--------|
| `compressed (Unzipped Files)/` | ORPHAN | Review → DELETE or `06_ARCHIVE/` |
| `ecosystem/` | LEGACY | `06_ARCHIVE/Phenix/` |
| `Google AI Studio/` | SYSTEM | Keep at root |
| `MASTER_LITIGATION_PACKAGE_COMPLETE/` | LEGAL | `01_LEGAL/Family-Court/` |
| `OMNIBUS/` | UNKNOWN | Audit → route by content |
| `P31/` | ACTIVE | Consolidate with `P31_Sync/` |
| `P31_OPERATIONS_ROOT/` | ACTIVE | Keep at root |
| `P31_Sync/` | ACTIVE | Keep at root (ingest loop) |
| `PHENIX_NAVIGATOR_ROOT/` | LEGACY | `06_ARCHIVE/Phenix/` |
| `Pixel dump/` | ORPHAN | Review → DELETE |
| `🧬p31🧬/` | UNKNOWN | Audit → consolidate |

---

## Legacy Branding Migration

### PHENIX (50+ files) → `06_ARCHIVE/Phenix/`

| Location | File | Action |
|----------|------|--------|
| root | `Phenix Cognitive Hub.gscript` | MOVE → `06_ARCHIVE/Phenix/` |
| root | `Phenix Citadel Production & Deployment.gdoc` | MOVE → `06_ARCHIVE/Phenix/` |
| root | `Phenix Citadel Research Protocol Execution.gdoc` | MOVE → `06_ARCHIVE/Phenix/` |
| root | `Phenix Citadel Intelligence Report 001.gdoc` | MOVE → `06_ARCHIVE/Phenix/` |
| root | `Phenix Wallet Sovereign Stack Alignment.gdoc` | MOVE → `06_ARCHIVE/Phenix/` |
| root | `Phenix Navigator Build Research Specification.gdoc` | MOVE → `06_ARCHIVE/Phenix/` |
| root | `Bevy Engine Blueprint Phenix Engine.gdoc` | MOVE → `06_ARCHIVE/Phenix/` |
| root | `Phenix Engine Godot Fork Blueprint.gdoc` | MOVE → `06_ARCHIVE/Phenix/` |
| root | `Mobile Devices Replacing Phenix Navigator.gdoc` | MOVE → `06_ARCHIVE/Phenix/` |
| root | `Building Phenix Navigator v5.0.gdoc` | MOVE → `06_ARCHIVE/Phenix/` |
| root | `Building Phenix Navigator v5.0 (1).gdoc` | DELETE (duplicate) |
| folder | `PHENIX_NAVIGATOR_ROOT/` | MOVE entire → `06_ARCHIVE/Phenix/` |
| folder | `ecosystem/` | MOVE entire → `06_ARCHIVE/Phenix/` |
| P31_Sync | `phenix-*.html` (5 files) | MOVE → `06_ARCHIVE/Phenix/` |
| P31_Sync | `phenix-sovereign-stack-final.tar.gz` | MOVE → `06_ARCHIVE/Phenix/` |

### WONKY SPROUT (15+ files) → `06_ARCHIVE/Wonky-Sprout/`

| Location | File | Action |
|----------|------|--------|
| root | `Wonky Game Engine Overview.gdoc` | MOVE → `06_ARCHIVE/Wonky-Sprout/` |
| root | `Wonky Game Engine Overview (1).gdoc` | DELETE (duplicate) |
| root | `Monetizing Wonky Sprout Ethically.gdoc` | MOVE → `06_ARCHIVE/Wonky-Sprout/` |
| root | `Monetizing Wonky Sprout Ethically (1).gdoc` | DELETE (duplicate) |
| root | `Wonky Sprouts Quantum Living System.gdoc` | MOVE → `06_ARCHIVE/Wonky-Sprout/` |
| root | `WONKY_SPROUT_ARCHITECTURE_BLUEPRINT.html` | MOVE → `06_ARCHIVE/Wonky-Sprout/` |
| root | `Building Quantum Wonky Sprouts HTML.gdoc` | MOVE → `06_ARCHIVE/Wonky-Sprout/` |
| root | `Building Quantum Wonky Sprouts HTML (1).gdoc` | DELETE (duplicate) |
| MASTER_LITIGATION | `WONKY_SPROUT_ARCHITECTURE_BLUEPRINT.gdoc` | Keep in `01_LEGAL/` (evidence) |
| P31_Sync | `WONKY_SPROUT_ARCHITECTURE_BLUEPRINT.docx` | MOVE → `06_ARCHIVE/Wonky-Sprout/` |
| P31_Sync | `wonky-sprout-v2.zip` | MOVE → `06_ARCHIVE/Wonky-Sprout/` |

### SIMPLEX (6 files) → `06_ARCHIVE/SIMPLEX/`

| Location | File | Action |
|----------|------|--------|
| root | `SIMPLEX v7.gdoc` | MOVE → `06_ARCHIVE/SIMPLEX/` |
| P31 | `SIMPLEX_v6_Master_Source.docx` | MOVE → `06_ARCHIVE/SIMPLEX/` |
| P31_Sync | `SIMPLEX v7.pdf` | MOVE → `06_ARCHIVE/SIMPLEX/` |
| P31_Sync | `SIMPLEX_v6_Master_Source_UPDATED.docx` | MOVE → `06_ARCHIVE/SIMPLEX/` |
| P31_Sync | `SIMPLEX_v6_Master_Source.docx` | DELETE (duplicate) |
| P31_Sync | `SIMPLEX_v6_Tests.gs.txt` | MOVE → `06_ARCHIVE/SIMPLEX/` |

---

## Duplicate Files (DELETE)

| Original | Duplicates to Delete |
|----------|---------------------|
| `Building a Roblox Killer.gdoc` | (1), (2), (3) — DELETE 3 |
| `Fawn Guard.gdoc` | (1), (2) — DELETE 2 |
| `Fidelity Estimator.gdoc` | (1), (2) — DELETE 2 |
| `Creating an Oracle Ollama Model.gdoc` | (1), (2) — DELETE 2 |
| `Conversation with Gemini.gdoc` | (1) — DELETE 1 |
| `ADA Support Person Rights...gdoc` | (1) — DELETE 1 |
| `Cognitive Shield vs. Roblox...gdoc` | (1) — DELETE 1 |
| `Decentralized Care, Neurodivergence...gdoc` | (1), (2) — DELETE 2 |
| `Deep Dive Sovereign Tech...gdoc` | (1) — DELETE 1 |
| `Defense Matrix.gdoc` | (1) — DELETE 1 |
| `Digital Centaur Guide...gdoc` | (1) — DELETE 1 |
| `Ecosystem Valuation...gdoc` | (1) — DELETE 1 |
| `Gemini.gdoc` | (1), (2) — DELETE 2 |

**Total duplicates to delete: ~30 files**

---

## Loose Root Files Migration (603 total)

### Legal Documents (~100 files) → `01_LEGAL/`

| Pattern | Count | Target |
|---------|-------|--------|
| `MOTION_*`, `*RECUSE*`, `*GAL*` | ~40 | `01_LEGAL/Family-Court/` |
| `CERTIFICATE_*`, `COS_*` | ~20 | `01_LEGAL/Family-Court/` |
| `SETTLEMENT*`, `Memorandum*` | ~15 | `01_LEGAL/Family-Court/` |
| `SSA*`, `Social Security*` | ~10 | `01_LEGAL/SSA/` |
| `ADA*` (non-medical) | ~15 | `01_LEGAL/SSA/` |

### Product/Technical (~150 files) → `02_PRODUCT/`

| Pattern | Count | Target |
|---------|-------|--------|
| `FW-*`, `HW-*` | ~20 | `02_PRODUCT/Hardware/` |
| `Cognitive Shield*`, `Shield*` | ~30 | `02_PRODUCT/Cognitive-Shield/` |
| `Buffer Agent*`, `Agent*` | ~15 | `02_PRODUCT/Buffer-Agent/` |
| `Spaceship*`, `Earth*`, `3D*` | ~20 | `02_PRODUCT/Spaceship-Earth/` |
| `Architectural*`, `Blueprint*`, `Protocol*` | ~40 | `02_PRODUCT/Spaceship-Earth/` |
| `Engine*`, `Roblox*` | ~25 | `02_PRODUCT/Spaceship-Earth/` |

### WCD Documents (~50 files) → `00_ADMIN/WCD/`

| Pattern | Count | Target |
|---------|-------|--------|
| `WCD-*`, `Shift Report*`, `Task Card*` | ~50 | `00_ADMIN/WCD/` |

### Communications (~50 files) → `04_COMMS/`

| Pattern | Count | Target |
|---------|-------|--------|
| `Substack*`, `Manifesto*` | ~15 | `04_COMMS/Substack/` |
| `Pitch*`, `Business*`, `Outreach*` | ~35 | `04_COMMS/Outreach/` |

### Medical (~30 files) → `05_MEDICAL/`

| Pattern | Count | Target |
|---------|-------|--------|
| `ADA Support*`, `Accommodation*` | ~20 | `05_MEDICAL/ADA/` |
| `Medical*`, `Health*` | ~10 | `05_MEDICAL/Records/` |

### AI/Research (~100 files) → `00_ADMIN/` or `02_PRODUCT/`

| Pattern | Count | Target |
|---------|-------|--------|
| `Gemini*`, `Claude*`, `Conversation*` | ~60 | `00_ADMIN/Corporate/` (session logs) |
| `Oracle*`, `AI*`, `Cognitive*` | ~40 | `02_PRODUCT/Buffer-Agent/` |

### Grants (~20 files) → `03_GRANTS/`

| Pattern | Count | Target |
|---------|-------|--------|
| `Grant*`, `Application*`, `Funding*` | ~15 | `03_GRANTS/Applications/` |
| `Report*`, `Progress*` | ~5 | `03_GRANTS/Reports/` |

### Miscellaneous (~100 files)

| Action | Count |
|--------|-------|
| Route to appropriate folder after review | ~80 |
| DELETE (orphaned exports, screenshots) | ~20 |

---

## Phase 2 Execution Plan

### Step 1: Create Target Structure
```
mkdir "00_ADMIN" "00_ADMIN/WCD" "00_ADMIN/Defensive-Pubs" "00_ADMIN/Corporate"
mkdir "01_LEGAL" "01_LEGAL/Family-Court" "01_LEGAL/SSA"
mkdir "02_PRODUCT" "02_PRODUCT/Spaceship-Earth" "02_PRODUCT/Cognitive-Shield" "02_PRODUCT/Buffer-Agent" "02_PRODUCT/Hardware"
mkdir "03_GRANTS" "03_GRANTS/Applications" "03_GRANTS/Reports"
mkdir "04_COMMS" "04_COMMS/Substack" "04_COMMS/Outreach"
mkdir "05_MEDICAL" "05_MEDICAL/Records" "05_MEDICAL/ADA"
mkdir "06_ARCHIVE" "06_ARCHIVE/SIMPLEX" "06_ARCHIVE/Wonky-Sprout" "06_ARCHIVE/Phenix"
```

### Step 2: Delete Duplicates (~30 files)
Remove all files with `(1)`, `(2)`, `(3)` suffixes after confirming originals exist.

### Step 3: Archive Legacy Brands (~70 files)
Move all PHENIX, WONKY SPROUT, SIMPLEX files to `06_ARCHIVE/` subfolders.

### Step 4: Migrate Loose Files (~500 files)
Route by pattern matching to target folders per mapping above.

### Step 5: Rename to Convention
Apply `[YYYY-MM-DD]_[CATEGORY]_[DESCRIPTION].[ext]` to all migrated files.

### Step 6: Delete Orphan Folders
Remove `compressed (Unzipped Files)/`, `Pixel dump/`, consolidate `P31/` into `P31_Sync/`.

---

## Summary

| Action | File Count |
|--------|------------|
| Create folders | 22 new folders |
| Delete duplicates | ~30 |
| Archive legacy | ~70 |
| Migrate loose files | ~500 |
| Rename to convention | ~600 |
| Delete orphans | ~20 |

**Total files affected:** ~650

---

## Approval Checklist

- [ ] Target structure matches WCD spec (00-06 numbering)
- [ ] `01_LEGAL/` has `Family-Court/` and `SSA/` separated
- [ ] `03_GRANTS/` exists as top-level folder
- [ ] `05_MEDICAL/` exists as top-level folder
- [ ] `06_ARCHIVE/` has `SIMPLEX/`, `Wonky-Sprout/`, `Phenix/`
- [ ] Naming convention `[YYYY-MM-DD]_[CATEGORY]_[DESCRIPTION].[ext]` included
- [ ] Approve duplicate deletion
- [ ] Approve orphan folder deletion
