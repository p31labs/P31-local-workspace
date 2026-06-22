#!/usr/bin/env python3
"""
Maturity gate: exit non-zero if any core package is below SPROUT.
Reads grading-index.json produced by scripts/grade-repo.py.
"""
import json
import sys
from pathlib import Path

GRADING_FILE = Path(__file__).resolve().parent.parent / "grading-index.json"
CORE_PACKAGES = [
    "software/packages/shared",
    "software/p31ca",
    "software/bonding",
    "software/packages/agent-engine",
    "software/packages/game-engine",
    "software/packages/harmonic-linter",
    "software/packages/jitterbug-api",
    "software/packages/jitterbug-pwa",
    "software/packages/brain-dump-orchestrator",
]
THRESHOLD = "SPROUT"

STAGE_ORDER = ["SEED", "SPROUT", "SAPLING", "BLOOM", "FRUIT"]

def stage_to_score(stage: str) -> int:
    try:
        return STAGE_ORDER.index(stage)
    except ValueError:
        return 0

if not GRADING_FILE.exists():
    print(f"⚠️  {GRADING_FILE} not found. Run scripts/grade-repo.py first.")
    sys.exit(1)

data = json.loads(GRADING_FILE.read_text())
artifacts = data.get("artifacts", [])

required = stage_to_score(THRESHOLD)
failed = False

for pkg_path in CORE_PACKAGES:
    entries = [a for a in artifacts if a.get("path") == pkg_path]
    if not entries:
        print(f"⚠️  {pkg_path} not found in grading report.")
        continue

    best = max(entries, key=lambda e: stage_to_score(e.get("stage", "SEED")))
    stage = best.get("stage", "SEED")
    score = stage_to_score(stage)
    name = best.get("name", pkg_path.split("/")[-1])

    if score < required:
        print(f"❌ {name} is at {stage} (below {THRESHOLD})")
        failed = True
    else:
        print(f"✅ {name} is at {stage} (≥ {THRESHOLD})")

if failed:
    print("Maturity gate failed.")
    sys.exit(1)

print("All core packages meet minimum maturity.")
sys.exit(0)
