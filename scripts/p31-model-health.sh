#!/bin/bash
# p31-model-health.sh
# Periodically check availability of all models in P31_LLM_MANIFEST.yaml
set -euo pipefail

REPO_ROOT="${P31_REPO_ROOT:-/home/p31/P31-local-workspace}"
MANIFEST="$REPO_ROOT/P31_LLM_MANIFEST.yaml"

python3 - <<PY
import yaml, os, subprocess, requests
from datetime import datetime

MANIFEST = "$MANIFEST"

def ping_model(model):
    provider = model.get("provider")
    if provider == "openrouter":
        try:
            headers = {"Authorization": f"Bearer {os.environ.get('OPENROUTER_API_KEY', '')}"}
            r = requests.get("https://openrouter.ai/api/v1/auth/key", headers=headers, timeout=5)
            return r.status_code == 200
        except:
            return False
    elif provider == "kilocode":
        try:
            r = requests.get("https://gateway.kilocode.ai/health", timeout=5)
            return r.status_code == 200
        except:
            return False
    elif provider == "local":
        try:
            subprocess.run(["opencode", "--version"], capture_output=True, check=True)
            return True
        except:
            return False
    elif provider == "web":
        # Placeholder: assume always available
        return True
    return True

with open(MANIFEST) as f:
    data = yaml.safe_load(f)

for model in data["models"]:
    model_id = model["id"]
    if ping_model(model):
        model["status"] = "available"
        model["last_checked"] = datetime.utcnow().isoformat() + "Z"
    else:
        model["status"] = "unavailable"

with open(MANIFEST, "w") as f:
    yaml.dump(data, f, default_flow_style=False, sort_keys=False)

print("Health check complete.")
PY
