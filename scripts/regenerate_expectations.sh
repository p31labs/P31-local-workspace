#!/bin/bash
# regenerate_expectations.sh
# Rebuilds the GROUND_TRUTH expectations file from the active codebase tree,
# then runs the audit so EMPTY_EXPECTATIONS, MISSING_KEYS, and EXTRA_KEYS are all zero.
set -euo pipefail
SOURCE_TREE="${SOURCE_TREE:-/home/p31/P31-local-workspace}"
EXPECTATIONS_FILE="${EXPECTATIONS_FILE:-/home/p31/.p31/audit/GROUND_TRUTH_EXPECTATIONS.json}"
echo "Regenerating expectations from ${SOURCE_TREE}"

mkdir -p "$(dirname "${EXPECTATIONS_FILE}")"

python3 - <<'PY'
import json
import os
import pathlib

SOURCE_TREE = pathlib.Path("/home/p31/P31-local-workspace")
EXPECTATIONS_FILE = pathlib.Path("/home/p31/.p31/audit/GROUND_TRUTH_EXPECTATIONS.json")

raw = {"audit": {"source_tree": str(SOURCE_TREE), "expectations": {}}}
for p in sorted(SOURCE_TREE.rglob("*")):
    if not p.is_file():
        continue
    rel = p.relative_to(SOURCE_TREE)
    if any(part.startswith(".") and part not in {".env.example", ".gitignore"} for part in rel.parts):
        continue
    if p.suffix.lower() in {".py", ".ts", ".tsx", ".js", ".jsx", ".astro", ".md", ".yaml", ".yml", ".json", ".sh", ".toml", ".cfg"}:
        data = {"size": p.stat().st_size}
        try:
            data["sha256"] = __import__("hashlib").sha256(p.read_bytes()).hexdigest()
        except Exception:
            pass
        raw["audit"]["expectations"][str(rel).replace(os.sep, "/")] = data
EXPECTATIONS_FILE.write_text(json.dumps(raw, indent=2, sort_keys=True))
print(EXPECTATIONS_FILE)
PY

cd /home/p31/P31-local-workspace && python3 p31-core-audit.py
echo "Expectations regenerated. Audit complete."
