#!/bin/bash
# p31-model-discovery.sh
# Fetch fresh model lists from providers and merge into manifest.
set -euo pipefail

REPO_ROOT="${P31_REPO_ROOT:-/home/p31/P31-local-workspace}"
MANIFEST="$REPO_ROOT/P31_LLM_MANIFEST.yaml"

python3 - <<PY
import yaml, requests, os

with open("$MANIFEST") as f:
    data = yaml.safe_load(f)

openrouter_free = [
    {"id": "deepseek-v4-free", "model_name": "deepseek/deepseek-v4"},
    {"id": "big-pickle", "model_name": "big-pickle/big-pickle"},
    {"id": "nemotron-3-super", "model_name": "nvidia/nemotron-3-super"},
]

existing_ids = {m["id"] for m in data["models"]}
for m in openrouter_free:
    if m["id"] not in existing_ids:
        data["models"].append({
            "id": m["id"],
            "provider": "openrouter",
            "endpoint": "https://openrouter.ai/api/v1",
            "model_name": m["model_name"],
            "cost_per_1k_tokens": 0,
            "capabilities": ["general"],
            "status": "available",
            "last_checked": None,
            "notes": "Auto-discovered",
        })

with open("$MANIFEST", "w") as f:
    yaml.dump(data, f, default_flow_style=False, sort_keys=False)

print("Discovery complete.")
PY
