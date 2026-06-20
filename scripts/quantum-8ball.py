#!/usr/bin/env python3
"""
P31 Quantum 8-Ball — Decision Engine v1.0
PMM_8BALL=1.0
Reads system state (spoons, calcium, deadlines, infrastructure, content backlog)
and outputs weighted, ranked recommendations with parallel alternatives.
"""
import json, os, sys, math
from pathlib import Path
from datetime import datetime, timezone

REPO_ROOT = Path(os.environ.get("P31_REPO_ROOT", "/home/p31/P31-local-workspace"))
P31_DIR = Path(os.environ.get("HOME", "/home/p31")) / ".p31"

SPOON_STATE = REPO_ROOT / "spoon-state.json"
COG_PASS = P31_DIR / "cognitive-passport.json"
NEXUS_STATE = REPO_ROOT / "nexus-state.json"
GRADING_INDEX = REPO_ROOT / "grading-index.json"
REPORT_DIR = REPO_ROOT / "reports"

COLOR = {}
if sys.stdout.isatty():
    COLOR = {"GREEN": "\033[0;32m", "YELLOW": "\033[1;33m", "RED": "\033[0;31m", "CYAN": "\033[0;36m", "BOLD": "\033[1m", "NC": "\033[0m"}

def load_json(path, default=None):
    try: return json.loads(path.read_text()) if path.exists() else default
    except: return default

def priority_score(base, urgency, spoon_cost, exec_penalty, time_bonus=1.0, parallel_benefit=0.0):
    if spoon_cost <= 0: return 0
    return (base * urgency * time_bonus * (1 + parallel_benefit)) / (spoon_cost * exec_penalty)

def is_peak_hour():
    h = datetime.now(timezone.utc).hour
    return 10 <= h < 14

def compute():
    spoon = load_json(SPOON_STATE, {})
    cog = load_json(COG_PASS, {})
    nexus = load_json(NEXUS_STATE, {})

    spoon_level = spoon.get("spoon_level", spoon.get("spoons", 3))
    calcium = spoon.get("serum_calcium_mg_dL", spoon.get("calcium", 8.5))
    peak = is_peak_hour()
    deadlines = 0
    for d in ["upcoming_deadlines", "upcoming_events"]:
        v = nexus.get("domains",{}).get("LEGAL",{}).get("metrics",{}).get(d, 0)
        if isinstance(v, int): deadlines = max(deadlines, v)
        elif isinstance(v, list): deadlines = max(deadlines, len(v))

    # Define possible actions
    actions = [
        {"id": "ada-filing", "label": "File ADA Accommodation + Contempt Motion", "base": 1.0, "urgency": 0.9 if deadlines > 0 else 0.5, "spoon_cost": 3, "exec_penalty": 0.7, "parallel_benefit": 0.2, "domain": "legal"},
        {"id": "astro-migrate", "label": "Migrate p31-hearing-ops to Astro Islands", "base": 0.8, "urgency": 0.6, "spoon_cost": 4, "exec_penalty": 0.6, "parallel_benefit": 0.1, "domain": "infrastructure"},
        {"id": "deploy-workers", "label": "Deploy 4 patched Workers", "base": 0.7, "urgency": 0.7, "spoon_cost": 1, "exec_penalty": 0.9, "parallel_benefit": 0.3, "domain": "infrastructure"},
        {"id": "money-streams", "label": "Launch money stream daemons", "base": 0.6, "urgency": 0.5, "spoon_cost": 1, "exec_penalty": 0.9, "parallel_benefit": 0.4, "domain": "infrastructure"},
        {"id": "weave-merge", "label": "WEAVE: merge staged documents", "base": 0.5, "urgency": 0.4, "spoon_cost": 1, "exec_penalty": 0.8, "parallel_benefit": 0.2, "domain": "content"},
        {"id": "nexus-review", "label": "Review NEXUS report and update state", "base": 0.6, "urgency": 0.6, "spoon_cost": 1, "exec_penalty": 0.9, "parallel_benefit": 0.1, "domain": "cognitive"},
        {"id": "quality-gate", "label": "Run pnpm run quality", "base": 0.5, "urgency": 0.4, "spoon_cost": 1, "exec_penalty": 0.8, "parallel_benefit": 0.3, "domain": "infrastructure"},
        {"id": "spoon-rest", "label": "Rest and recover spoons", "base": 0.3, "urgency": 0.8 if spoon_level <= 2 else 0.2, "spoon_cost": 0, "exec_penalty": 1.0, "parallel_benefit": 0, "domain": "cognitive"},
        {"id": "grant-work", "label": "Grant research or submission prep", "base": 0.4, "urgency": 0.5, "spoon_cost": 3, "exec_penalty": 0.5, "parallel_benefit": 0.1, "domain": "content"},
    ]

    # Apply state-based modifiers
    for a in actions:
        a["time_bonus"] = 1.2 if peak and a["domain"] in ("infrastructure", "content") else 1.0
        if calcium is not None and calcium < 7.8 and a["spoon_cost"] > 2:
            a["spoon_cost"] = min(5, a["spoon_cost"] + 1)  # penalty
        if spoon_level <= 2 and a["spoon_cost"] > 2:
            a["urgency"] *= 0.5

        a["score"] = priority_score(a["base"], a["urgency"], a["spoon_cost"], a["exec_penalty"], a["time_bonus"], a["parallel_benefit"])

    actions.sort(key=lambda x: x["score"], reverse=True)

    return {
        "meta": {"schema": "PMM_8BALL=1.0", "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "spoon_level": spoon_level, "calcium": calcium, "peak_hours": peak, "deadlines": deadlines},
        "recommendations": [{"rank": i+1, "action": a["id"], "label": a["label"], "score": round(a["score"], 3), "spoon_cost": a["spoon_cost"], "urgency": round(a["urgency"], 2), "domain": a["domain"]} for i, a in enumerate(actions)],
        "top_pick": {"id": actions[0]["id"], "label": actions[0]["label"], "confidence": round(actions[0]["score"] / actions[0]["base"], 2) if actions[0]["base"] > 0 else 0}
    }

if __name__ == "__main__":
    result = compute()
    print(f"\n  {COLOR.get('BOLD','')}P31 8-Ball — Decision Engine{COLOR.get('NC','')}")
    print(f"  Spoons: {result['meta']['spoon_level']}/5 | Calcium: {result['meta']['calcium']} | Peak: {result['meta']['peak_hours']} | Deadlines: {result['meta']['deadlines']}")
    print(f"\n  {COLOR.get('BOLD','')}Top Pick:{COLOR.get('NC','')} {result['top_pick']['label']} (confidence: {result['top_pick']['confidence']})\n")
    print(f"  {'Rank':>4}  {'Score':>6}  {'Spoons':>6}  {'Domain':>14}  {'Action':<50}")
    print(f"  {'----':>4}  {'-----':>6}  {'------':>6}  {'------':>14}  {'------':<50}")
    for r in result["recommendations"]:
        print(f"  {r['rank']:>4}  {r['score']:>6.3f}  {r['spoon_cost']:>6}  {r['domain']:>14}  {r['label']:<50}")
    print()
    # Write JSON for programmatic consumption
    out_path = Path(os.environ.get("P31_REPO_ROOT", "/home/p31/P31-local-workspace")) / "8ball-state.json"
    out_path.write_text(json.dumps(result, indent=2))
    print(f"  Wrote {out_path}")
