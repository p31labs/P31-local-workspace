#!/usr/bin/env python3
"""
P31-MODEL-ROUTER v1.0
Fleet router for P31-FLOTILLA LLM management.

Usage:
    p31-model-router --task "Write a test" --role coder
    p31-model-router --task "Debug this error" --role debugger --file errors.log
    p31-model-router --list-models
    p31-model-router --list-roles
"""

import os
import sys
import json
import argparse
import subprocess
import time
from pathlib import Path

try:
    import yaml
    import requests
except ImportError as e:
    print(f"Missing dependency: {e}. Run: pip install pyyaml requests", file=sys.stderr)
    sys.exit(1)

CONFIG_DIR = Path.home() / ".p31"
MANIFEST_PATH = Path(os.environ.get("P31_REPO_ROOT", "/home/p31/P31-local-workspace")) / "P31_LLM_MANIFEST.yaml"
LOG_PATH = CONFIG_DIR / "llm-router.log"
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
KILO_GATEWAY_KEY = os.environ.get("KILO_GATEWAY_KEY", "")


def log_message(msg):
    timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_PATH, "a") as f:
        f.write(f"{timestamp} | {msg}\n")


def load_manifest():
    with open(MANIFEST_PATH) as f:
        return yaml.safe_load(f)


def get_model_by_id(model_id, manifest):
    for m in manifest["models"]:
        if m["id"] == model_id:
            return m
    return None


def get_available_models(manifest, role):
    role_def = manifest["roles"].get(role, {})
    preferred = role_def.get("preferred_models", [])
    fallback = role_def.get("fallback_models", [])
    candidates = preferred + fallback
    available = []
    for mid in candidates:
        model = get_model_by_id(mid, manifest)
        if model and model.get("status") == "available":
            available.append(model)
    return available


def call_openrouter(model, prompt, max_tokens=1000):
    if not OPENROUTER_API_KEY=***REDACTED*** ValueError("OPENROUTER_API_KEY not set")
    endpoint = model.get("endpoint", "https://openrouter.ai/api/v1/chat/completions")
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://p31ca.org",
        "X-Title": "P31-FLOTILLA",
    }
    payload = {
        "model": model["model_name"],
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": max_tokens,
        "temperature": 0.7,
    }
    resp = requests.post(endpoint, json=payload, headers=headers, timeout=60)
    resp.raise_for_status()
    return resp.json()


def call_kilogateway(model, prompt):
    endpoint = model.get("endpoint", "https://gateway.kilocode.ai/api/v1/complete")
    headers = {"Authorization": f"Bearer {KILO_GATEWAY_KEY}"}
    payload = {"prompt": prompt, "model": model.get("model_name", "free-agent")}
    resp = requests.post(endpoint, json=payload, headers=headers, timeout=60)
    resp.raise_for_status()
    return resp.json()


def call_opencode_cli(model, prompt):
    cmd = ["opencode", "execute", "--prompt", prompt, "--json"]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if proc.returncode != 0:
        raise RuntimeError(f"OpenCode CLI failed: {proc.stderr}")
    return json.loads(proc.stdout)


def call_web_ui(model, prompt):
    raise NotImplementedError("Web UI automation not implemented yet.")


def route_request(prompt, role="coder", max_tokens=2000, _fallback_depth=0):
    if _fallback_depth > 3:
        return {"error": "Max fallback depth exceeded", "role": role, "status": "failed"}

    manifest = load_manifest()
    candidates = get_available_models(manifest, role)
    if not candidates:
        log_message(f"No available models for role '{role}'")
        return {"error": "No models available", "role": role}

    selected = candidates[0]
    log_message(f"Routing to {selected['id']} for role '{role}'")

    try:
        provider = selected["provider"]
        if provider == "openrouter":
            result = call_openrouter(selected, prompt, max_tokens)
            response_text = result["choices"][0]["message"]["content"]
        elif provider == "kilocode":
            result = call_kilogateway(selected, prompt)
            response_text = result.get("text", result.get("response", ""))
        elif provider == "local":
            result = call_opencode_cli(selected, prompt)
            response_text = result.get("response", "")
        elif provider == "web":
            result = call_web_ui(selected, prompt)
            response_text = result.get("response", "")
        else:
            raise ValueError(f"Unknown provider: {provider}")

        log_message(f"Success from {selected['id']}")
        return {
            "model_id": selected["id"],
            "provider": provider,
            "response": response_text,
            "cost_estimate": selected.get("cost_per_1k_tokens", 0) * (len(prompt) + len(response_text)) / 1000,
            "status": "success",
        }
    except Exception as e:
        log_message(f"Error with {selected['id']}: {e}")
        remaining = [m for m in candidates if m["id"] != selected["id"]]
        if remaining:
            return route_request(prompt, role, max_tokens, _fallback_depth + 1)
        return {"error": str(e), "role": role, "status": "failed"}


def main():
    parser = argparse.ArgumentParser(description="P31-FLOTILLA Router")
    parser.add_argument("--task", help="Prompt text to send")
    parser.add_argument("--role", default="coder", help="Role to use (strategist, coder, reviewer, planner, debugger)")
    parser.add_argument("--file", help="Read prompt from file")
    parser.add_argument("--max-tokens", type=int, default=2000)
    parser.add_argument("--list-models", action="store_true", help="List all models in manifest")
    parser.add_argument("--list-roles", action="store_true", help="List all roles")
    args = parser.parse_args()

    if args.list_models:
        manifest = load_manifest()
        for model in manifest["models"]:
            print(f"{model['id']}: {model.get('status', 'unknown')} - {model.get('capabilities', [])}")
        return

    if args.list_roles:
        manifest = load_manifest()
        for role, defn in manifest["roles"].items():
            print(f"{role}: {defn.get('description', '')}")
        return

    prompt = ""
    if args.file:
        with open(args.file) as f:
            prompt = f.read()
    elif args.task:
        prompt = args.task
    else:
        print("Error: must provide --task or --file", file=sys.stderr)
        sys.exit(1)

    result = route_request(prompt, args.role, args.max_tokens)
    if "error" in result:
        print(f"ERROR: {result['error']}", file=sys.stderr)
        sys.exit(1)
    print(result["response"])


if __name__ == "__main__":
    main()
