#!/usr/bin/env python3
"""
P31 NEXUS Daemon — Cross-Domain State Entanglement Engine
Reads runtime state from every domain (metabolic, cognitive, legal, infrastructure, content),
applies entanglement rules, predicts cascading failure chains, and surfaces the critical path.

PMM_NEXUS=1.0
"""

import json
import math
import os
import re
import subprocess
import sys
import time
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path("/home/p31/P31-local-workspace").resolve()
P31_DIR = Path("/home/p31/.p31")

SPOON_STATE_PATH = REPO_ROOT / "spoon-state.json"
COG_PASS_PATH = P31_DIR / "cognitive-passport.json"
P31_CONFIG_PATH = P31_DIR / "config.yaml"
SIGNALS_PATH = REPO_ROOT / "jitterbug-signals.json"
ENTANGLEMENTS_PATH = REPO_ROOT / "jitterbug-entanglements.json"
JITTERBUG_STATE_PATH = REPO_ROOT / "jitterbug-state.json"
COMMAND_CENTER_STATUS_PATH = REPO_ROOT / "software/cloudflare-worker/command-center/status.json"
NEXUS_ENTANGLEMENTS_PATH = REPO_ROOT / "nexus-entanglements.json"
NEXUS_STATE_PATH = REPO_ROOT / "nexus-state.json"
NEXUS_REPORT_PATH = REPO_ROOT / "NEXUS_REPORT.md"

# Domain constants
DOMAINS = ["METABOLIC", "COGNITIVE", "LEGAL", "INFRASTRUCTURE", "CONTENT"]
DOMAIN_LABELS = {
    "METABOLIC": "Metabolic 🧬",
    "COGNITIVE": "Cognitive 🧠",
    "LEGAL": "Legal ⚖️",
    "INFRASTRUCTURE": "Infrastructure 🔧",
    "CONTENT": "Content 📝",
}

# Numerical risk scale: 0.0 (critical risk) → 1.0 (healthy)
RISK_LABELS = {
    0.0: "CRITICAL",
    0.25: "UNSTABLE",
    0.5: "STABLE",
    0.75: "HEALTHY",
    1.0: "FLOURISHING",
}

# Spoon-weighted thresholds for cascade amplification
SPOON_CASCADE_THRESHOLDS = {
    5: 0.15,
    4: 0.20,
    3: 0.30,
    2: 0.45,
    1: 0.60,
    0: 0.80,
}

SPOON_LABELS = {5: "Flow 🚀", 4: "Focus 🎯", 3: "Steady ⚖️", 2: "Low 🔋", 1: "Depleted 🛌", 0: "Gray Rock ⛓️‍💥"}

# Default entanglement rules (can be overridden by nexus-entanglements.json)
DEFAULT_ENTANGLEMENTS = [
    {
        "id": "calcium-cognitive",
        "from_domain": "METABOLIC",
        "from_metric": "serum_calcium_mg_dL",
        "to_domain": "COGNITIVE",
        "to_metric": "spoon_budget",
        "condition": "lt",
        "threshold": 7.8,
        "effect": "cap",
        "cap_value": 3,
        "weight": 0.9,
        "description": "Hypocalcemia caps spoon budget at 3",
    },
    {
        "id": "metabolic-entropy",
        "from_domain": "METABOLIC",
        "from_metric": "overall",
        "to_domain": "COGNITIVE",
        "to_metric": "entropy_multiplier",
        "condition": "lt",
        "threshold": 0.4,
        "effect": "multiply",
        "multiplier": 1.5,
        "weight": 0.7,
        "description": "Poor metabolic state increases cognitive entropy",
    },
    {
        "id": "cognitive-infrastructure",
        "from_domain": "COGNITIVE",
        "from_metric": "spoon_budget",
        "to_domain": "INFRASTRUCTURE",
        "to_metric": "operation_complexity",
        "condition": "lte",
        "threshold": 2,
        "effect": "warn",
        "message": "Spoon budget too low for infrastructure operations — defer non-critical deploys",
        "weight": 0.8,
        "description": "Low spoons trigger infrastructure lockdown",
    },
    {
        "id": "infrastructure-legal",
        "from_domain": "INFRASTRUCTURE",
        "from_metric": "overall",
        "to_domain": "LEGAL",
        "to_metric": "preparedness_risk",
        "condition": "lt",
        "threshold": 0.5,
        "effect": "escalate",
        "risk_delta": 0.15,
        "weight": 0.6,
        "description": "Infrastructure degradation increases legal prep risk",
    },
    {
        "id": "legal-cognitive",
        "from_domain": "LEGAL",
        "from_metric": "upcoming_deadlines",
        "to_domain": "COGNITIVE",
        "to_metric": "task_switching_penalty",
        "condition": "gt",
        "threshold": 0,
        "effect": "penalty",
        "penalty_value": 0.2,
        "weight": 0.7,
        "description": "Legal deadlines impose cognitive task-switching penalty",
    },
    {
        "id": "content-cognitive",
        "from_domain": "CONTENT",
        "from_metric": "pipeline_backlog",
        "to_domain": "COGNITIVE",
        "to_metric": "task_initiation_penalty",
        "condition": "gt",
        "threshold": 5,
        "effect": "penalty",
        "penalty_value": 0.15,
        "weight": 0.5,
        "description": "Content backlog > 5 items increases initiation friction",
    },
    {
        "id": "cognitive-content",
        "from_domain": "COGNITIVE",
        "from_metric": "spoon_budget",
        "to_domain": "CONTENT",
        "to_metric": "production_cap",
        "condition": "lte",
        "threshold": 2,
        "effect": "cap",
        "cap_value": 0,
        "weight": 0.7,
        "description": "Low spoons halt content production entirely",
    },
    {
        "id": "metabolic-legal",
        "from_domain": "METABOLIC",
        "from_metric": "alertness",
        "to_domain": "LEGAL",
        "to_metric": "hearing_readiness",
        "condition": "lt",
        "threshold": 0.3,
        "effect": "reduce",
        "reduction": 0.3,
        "weight": 0.85,
        "description": "Low alertness significantly impairs hearing readiness",
    },
]

CASCADE_RULES = [
    {
        "id": "hypocalcemia-cascade",
        "trigger": {"domain": "METABOLIC", "metric": "serum_calcium_mg_dL", "condition": "lt", "threshold": 7.8},
        "chain": [
            {"domain": "COGNITIVE", "metric": "spoon_budget", "effect": "capped at 3"},
            {"domain": "LEGAL", "metric": "hearing_readiness", "effect": "reduced by 30%"},
            {"domain": "INFRASTRUCTURE", "metric": "operation_complexity", "effect": "non-critical deploys deferred"},
        ],
        "critical_action": "Take calcium immediately. Prioritize only essential legal prep.",
        "severity": "high",
    },
    {
        "id": "zero-spoon-cascade",
        "trigger": {"domain": "COGNITIVE", "metric": "spoon_budget", "condition": "lte", "threshold": 1},
        "chain": [
            {"domain": "INFRASTRUCTURE", "metric": "operation_complexity", "effect": "all deploys locked"},
            {"domain": "CONTENT", "metric": "production_cap", "effect": "production halted"},
            {"domain": "LEGAL", "metric": "preparedness_risk", "effect": "critical filings may be missed"},
        ],
        "critical_action": "Rest. Only life-sustaining activities. Set out-of-office on all channels.",
        "severity": "critical",
    },
    {
        "id": "peak-hours-cascade",
        "trigger": {"domain": "COGNITIVE", "metric": "is_peak_hours", "condition": "eq", "value": False},
        "chain": [
            {"domain": "COGNITIVE", "metric": "task_initiation_weight", "effect": "reduced by 70%"},
            {"domain": "INFRASTRUCTURE", "metric": "complex_ops_recommended", "effect": "defer to peak hours"},
        ],
        "critical_action": "Schedule complex tasks for peak window (10:00-14:00). Do low-spoon work now.",
        "severity": "medium",
    },
    {
        "id": "infrastructure-degradation-cascade",
        "trigger": {"domain": "INFRASTRUCTURE", "metric": "health_score", "condition": "lt", "threshold": 0.6},
        "chain": [
            {"domain": "LEGAL", "metric": "preparedness_risk", "effect": "increased by 15%"},
            {"domain": "CONTENT", "metric": "pipeline_status", "effect": "publishing blocked"},
        ],
        "critical_action": "Resolve infrastructure issues before any other work.",
        "severity": "high",
    },
    {
        "id": "legal-deadline-cascade",
        "trigger": {"domain": "LEGAL", "metric": "upcoming_deadlines", "condition": "gt", "threshold": 0},
        "chain": [
            {"domain": "COGNITIVE", "metric": "task_switching_penalty", "effect": "+0.2 switching cost"},
            {"domain": "CONTENT", "metric": "priority", "effect": "content deprioritized"},
        ],
        "critical_action": "Focus on legal deadlines first. Defer all non-essential work.",
        "severity": "high",
    },
]


def _parse_config_yaml(path: Path) -> dict:
    """Minimal YAML parser for the p31 config file."""
    config = {}
    if not path.exists():
        return config
    try:
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if ":" in line:
                key, _, val = line.partition(":")
                config[key.strip()] = val.strip()
    except Exception:
        pass
    return config


def _load_json(path: Path) -> dict:
    if path.exists():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}


def _load_json_list(path: Path) -> list:
    if path.exists():
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            if isinstance(data, list):
                return data
            if isinstance(data, dict):
                return data.get("pairs", data.get("entanglements", data.get("cascades", [])))
        except Exception:
            return []
    return []


def _resolve_entanglements() -> list[dict]:
    """Load entanglements from file or use defaults."""
    if NEXUS_ENTANGLEMENTS_PATH.exists():
        data = _load_json(NEXUS_ENTANGLEMENTS_PATH)
        rules = data.get("entanglements", data.get("pairs", []))
        if rules:
            return rules
    return DEFAULT_ENTANGLEMENTS


def _load_spoon_level() -> int:
    if SPOON_STATE_PATH.exists():
        try:
            data = json.loads(SPOON_STATE_PATH.read_text(encoding="utf-8"))
            return int(data.get("level", 4))
        except Exception:
            pass
    try:
        return int(os.environ.get("P31_SPOON_LEVEL", "4"))
    except Exception:
        return 4


def _load_cognitive_passport() -> dict:
    data = _load_json(COG_PASS_PATH)
    return data


def _load_worker_status() -> dict:
    """Ingest the command-center status.json for worker health + legal/financial state."""
    data = _load_json(COMMAND_CENTER_STATUS_PATH)
    return data


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _is_peak_hours(passport: dict) -> bool:
    """Determine if current time is within cognitive peak hours."""
    now_hour = datetime.now(timezone.utc).hour
    ef = passport.get("executive_function", {})
    health = passport.get("health_metrics", {})
    alertness = health.get("alertness_schedule", {})
    peaks = alertness.get("peak", ["10:00", "14:00"])
    for peak_str in peaks:
        try:
            # Parse "10:00" or "10:00-12:00"
            parts = peak_str.split("-")
            start_h = int(parts[0].split(":")[0])
            end_h = int(parts[1].split(":")[0]) if len(parts) > 1 else start_h + 1
            if start_h <= now_hour < end_h:
                return True
        except (ValueError, IndexError):
            pass
    # Also check preferred_work_hours
    pref = ef.get("preferred_work_hours", [])
    for h_str in pref:
        try:
            h = int(h_str.split(":")[0])
            if h == now_hour:
                return True
        except (ValueError, IndexError):
            pass
    return False


def _git_timestamps() -> dict[str, float]:
    try:
        result = subprocess.run(
            ["git", "log", "--name-only", "--pretty=format:%at", "-50"],
            cwd=REPO_ROOT, capture_output=True, text=True, timeout=30,
        )
        lines = result.stdout.splitlines()
        timestamps: dict[str, float] = {}
        current_ts: float | None = None
        for line in lines:
            line = line.strip()
            if not line:
                continue
            if re.match(r"^\d+$", line):
                current_ts = float(line)
            elif current_ts is not None:
                timestamps[line] = max(timestamps.get(line, 0), current_ts)
        return timestamps
    except Exception:
        return {}


def _compute_domain_state() -> dict:
    """
    Compute the current state of all five domains by ingesting all available data sources.
    Returns: { domain_name: { metrics... }, ... }
    """
    spoon_level = _load_spoon_level()
    passport = _load_cognitive_passport()
    worker_status = _load_worker_status()
    p31_config = _parse_config_yaml(P31_CONFIG_PATH)
    signals = _load_json(SIGNALS_PATH)
    entanglements_data = _load_json(ENTANGLEMENTS_PATH)
    git_ts = _git_timestamps()

    now_hour = datetime.now(timezone.utc).hour

    # --- METABOLIC DOMAIN ---
    health = passport.get("health_metrics", {})
    critical = health.get("critical_lab_thresholds", {})
    conditions = health.get("chronic_conditions", [])
    alertness = health.get("alertness_schedule", {})
    peaks = alertness.get("peak", [])
    troughs = alertness.get("trough", [])

    in_peak = _is_peak_hours(passport)
    in_trough = False
    for trough_str in troughs:
        try:
            parts = trough_str.split("-")
            start_h = int(parts[0].split(":")[0])
            end_h = int(parts[1].split(":")[0]) if len(parts) > 1 else start_h + 1
            if start_h <= now_hour < end_h:
                in_trough = True
                break
        except (ValueError, IndexError):
            pass

    metabolic_state = {
        "serum_calcium_mg_dL": critical.get("serum_calcium_mg_DL", critical.get("serum_calcium_mg_dL", 8.5)),
        "albumin_g_dL": critical.get("albumin_g_DL", critical.get("albumin_g_dL", 4.0)),
        "creatinine_mg_dL": critical.get("creatinine_mg_DL", critical.get("creatinine_mg_dL", 1.0)),
        "serum_calcium_threshold": 7.8,
        "chronic_conditions": conditions,
        "medication_adherence_required": health.get("medication_adherence_required", True),
        "alertness_peak": peaks,
        "alertness_trough": troughs,
        "in_peak": in_peak,
        "in_trough": in_trough,
        "alertness": 0.5 if in_trough else (0.9 if in_peak else 0.7),
        "calcium_at_risk": False,
    }
    # Check calcium risk
    calcium = metabolic_state["serum_calcium_mg_dL"]
    threshold = metabolic_state["serum_calcium_threshold"]
    metabolic_state["calcium_at_risk"] = calcium <= threshold
    metabolic_state["calcium_gap"] = round(max(0, threshold - calcium), 1)

    # --- COGNITIVE DOMAIN ---
    ef = passport.get("executive_function", {})
    sensory = passport.get("sensory", {})
    risk = passport.get("risk_tolerance", {})
    pref_par = passport.get("preferred_parallelism", {})

    # Read number of upcoming deadlines (from status.json dates)
    dates = worker_status.get("dates", [])
    now_ts = time.time()
    upcoming_dates = sum(1 for d in dates if _date_to_timestamp(d.get("date", "")) > now_ts)

    # Count deployed workers as complexity indicator
    deployed_workers = worker_status.get("research", {}).get("deployed_workers", 0)

    # Entropy multiplier: baseline 1.0, adjusted by trough
    entropy_mult = 1.5 if in_trough else (0.7 if in_peak else 1.0)
    # Further adjusted by spoon level
    spoon_entropy_map = {5: 0.6, 4: 0.8, 3: 1.0, 2: 1.3, 1: 1.8, 0: 2.5}
    entropy_mult *= spoon_entropy_map.get(spoon_level, 1.0)

    # Task switching penalty from legal deadlines
    deadline_switch_penalty = 0.0
    if upcoming_dates > 0:
        deadline_switch_penalty = 0.2

    # Content backlog penalty
    content_backlog_penalty = 0.0
    # Check if there's a backlog indicator in signals
    signals_content = signals.get("content_pipeline", {})
    backlog = signals_content.get("backlog", 0)

    cognitive_state = {
        "spoon_level": spoon_level,
        "spoon_label": SPOON_LABELS.get(spoon_level, f"Level {spoon_level}"),
        "spoon_budget": spoon_level,
        "raw_spoon_level": spoon_level,
        "task_initiation_weight": ef.get("task_initiation_weight", 0.8),
        "task_switching_cost": ef.get("task_switching_cost", 0.7),
        "sequential_processing_preference": ef.get("sequential_processing_preference", True),
        "asynchronous_communication_required": ef.get("asynchronous_communication_required", True),
        "fluorescent_lighting_penalty": sensory.get("fluorescent_lighting_penalty", 0.6),
        "unpredictable_wait_time_penalty": sensory.get("unpredictable_wait_time_penalty", 0.7),
        "background_noise_threshold_db": sensory.get("background_noise_threshold_db", 50),
        "preferred_work_hours": ef.get("preferred_work_hours", sensory.get("preferred_work_hours", [])),
        "in_peak_hours": in_peak,
        "in_trough_hours": in_trough,
        "entropy_multiplier": round(entropy_mult, 2),
        "task_switching_penalty": deadline_switch_penalty,
        "task_initiation_penalty": content_backlog_penalty,
        "max_concurrent_tasks": pref_par.get("max_concurrent_tasks", 2),
        "auto_approve_threshold": pref_par.get("auto_approve_threshold", 0.85),
        "risk_tolerance_medical": risk.get("medical", 0.1),
        "risk_tolerance_financial": risk.get("financial", 0.4),
        "risk_tolerance_codebase": risk.get("codebase_stability", 0.7),
        "risk_tolerance": risk,
        "upcoming_deadlines": upcoming_dates,
        "content_backlog": backlog,
    }

    # --- LEGAL DOMAIN ---
    legal = worker_status.get("legal", {})
    financial = worker_status.get("financial", {})

    # Parse upcoming legal events
    legal_events = [d for d in dates if "hearing" in d.get("event", "").lower()
                    or "court" in d.get("event", "").lower()
                    or "deadline" in d.get("event", "").lower()
                    or "filing" in d.get("event", "").lower()]
    upcoming_legal = [d for d in legal_events if _date_to_timestamp(d.get("date", "")) > now_ts]

    legal_state = {
        "case": legal.get("case", "Johnson v. Johnson, 2025CV936"),
        "judge": legal.get("judge", "Chief Judge Scarlett"),
        "status": legal.get("status", "Active"),
        "next_hearing": legal.get("next_hearing", "TBD"),
        "mcghan_deadline": legal.get("mcghan_deadline", "PASSED"),
        "upcoming_events": upcoming_legal,
        "upcoming_deadlines": len(upcoming_legal),
        "hearing_readiness": 0.8 if not upcoming_legal else 0.5,
        "operating_buffer": financial.get("operating_buffer", "Unknown"),
        "grants_active": financial.get("grants_active", ""),
        "grants_pending": financial.get("grants_pending", ""),
        "corp_status": financial.get("corp_status", ""),
    }

    # --- INFRASTRUCTURE DOMAIN ---
    workers = worker_status.get("workers", [])
    online_workers = sum(1 for w in workers if w.get("status") == "online")
    degraded = sum(1 for w in workers if w.get("status") not in ("online",))

    # Check git recency for key infra paths
    infra_paths = [
        "software/cloudflare-worker",
        "software/packages/k4-mesh-core",
        "software/k4-cage",
        "software/k4-hubs",
        "software/k4-personal",
        "scripts/jitterbug-daemon.py",
    ]
    infra_recency = {}
    for p in infra_paths:
        ts = 0.0
        for path, gts in git_ts.items():
            if path == p or path.startswith(p + "/"):
                ts = max(ts, gts)
        hours_since = (time.time() - ts) / 3600 if ts > 0 else 999
        infra_recency[p] = round(hours_since, 1)

    # Count signal-based health
    signal_health = 0.0
    signal_count = 0
    for signal_name, signal_data in signals.items():
        if signal_name.startswith("_"):
            continue
        if isinstance(signal_data, dict):
            signal_health += signal_data.get("weight", 1.0)
            signal_count += 1

    avg_signal_health = signal_health / max(signal_count, 1)

    infrastructure_state = {
        "total_workers": len(workers),
        "online_workers": online_workers,
        "degraded_workers": degraded,
        "health_score": round(online_workers / max(len(workers), 1), 2) if workers else 0.5,
        "signal_health": round(avg_signal_health, 2),
        "deployed_workers": deployed_workers,
        "k4_cage_url": p31_config.get("k4_cage_url", "https://k4-cage.trimtab-signal.workers.dev"),
        "ollama_url": p31_config.get("ollama_url", "http://127.0.0.1:11434"),
        "phos_url": p31_config.get("phos_url", "https://phos.p31ca.org"),
        "infra_recency_hours": infra_recency,
        "operation_complexity": round(deployed_workers / 30, 2) if deployed_workers else 0.5,
        "p31_default_model": p31_config.get("default_model", "qwen2.5:1.5b"),
    }

    # --- CONTENT DOMAIN ---
    content_state = {
        "pipeline_backlog": backlog,
        "signals_count": signal_count,
        "active_channels": [
            "twitter", "bluesky", "mastodon", "devto", "hashnode",
            "zenodo", "grants", "substack", "discord",
        ],
        "forge_available": True,
        "weave_available": True,
        "zenodo_papers_published": 4,
        "zenodo_papers_ready": 13,
        "social_cadence_active": True,
        "docs_last_updated": f"{_now_iso()}",
        "production_cap": 1.0,  # 1.0 = full, 0.0 = halted
    }

    domain_state = {
        "METABOLIC": metabolic_state,
        "COGNITIVE": cognitive_state,
        "LEGAL": legal_state,
        "INFRASTRUCTURE": infrastructure_state,
        "CONTENT": content_state,
    }

    return domain_state


def _date_to_timestamp(date_str: str) -> float:
    """Convert a YYYY-MM-DD string to a unix timestamp."""
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        return dt.timestamp()
    except (ValueError, TypeError):
        return 0.0


def _compute_domain_health(domain: str, state: dict) -> float:
    """
    Compute a 0.0-1.0 health score for a domain based on its metrics.
    0.0 = critical, 1.0 = flourishing
    """
    if domain == "METABOLIC":
        s = state
        score = 1.0
        if s.get("calcium_at_risk"):
            score -= 0.4
        if s.get("alertness", 0.7) < 0.4:
            score -= 0.2
        if not s.get("medication_adherence_required", True):
            score += 0.1
        if s.get("in_trough"):
            score -= 0.1
        if s.get("in_peak"):
            score += 0.1
        return max(0.0, min(1.0, score))

    elif domain == "COGNITIVE":
        s = state
        spoon = s.get("raw_spoon_level", 4)
        score = spoon / 5.0
        if s.get("in_trough"):
            score -= 0.15
        if s.get("in_peak"):
            score += 0.1
        score -= s.get("task_switching_penalty", 0.0)
        score -= s.get("task_initiation_penalty", 0.0)
        return max(0.0, min(1.0, score))

    elif domain == "LEGAL":
        s = state
        score = 0.7  # baseline — legal is inherently stressful
        if s.get("upcoming_deadlines", 0) == 0:
            score += 0.2
        else:
            score -= 0.15 * min(s["upcoming_deadlines"], 3)
        if "PASSED" in s.get("mcghan_deadline", ""):
            score += 0.1
        if "hearing" in s.get("status", "").lower():
            score -= 0.1
        return max(0.0, min(1.0, score))

    elif domain == "INFRASTRUCTURE":
        s = state
        score = s.get("health_score", 0.5) * 0.6
        score += s.get("signal_health", 0.5) * 0.2
        score += 0.2  # baseline for things being deployed at all
        return max(0.0, min(1.0, score))

    elif domain == "CONTENT":
        s = state
        backlog = s.get("pipeline_backlog", 0)
        score = 0.7
        score -= min(backlog * 0.05, 0.3)
        if s.get("forge_available"):
            score += 0.1
        if s.get("weave_available"):
            score += 0.1
        return max(0.0, min(1.0, score))

    return 0.5


def _apply_entanglements(domain_state: dict, rules: list[dict]) -> list[dict]:
    """
    Apply cross-domain entanglement rules and return active entanglements.
    Each active entanglement shows how one domain is affecting another.
    """
    active: list[dict] = []

    for rule in rules:
        fid = rule.get("from_domain", "")
        fmetric = rule.get("from_metric", "")
        tid = rule.get("to_domain", "")
        tmetric = rule.get("to_metric", "")
        condition = rule.get("condition", "lt")
        threshold = rule.get("threshold", 0)
        weight = rule.get("weight", 1.0)

        fstate = domain_state.get(fid, {})
        tstate = domain_state.get(tid, {})

        # Resolve the from-value
        from_val = fstate.get(fmetric)

        if from_val is None and fmetric == "overall":
            # Compute domain health as the from value
            from_val = _compute_domain_health(fid, fstate)

        if from_val is None:
            continue

        # Evaluate condition
        triggered = False
        if condition == "lt":
            triggered = from_val < threshold
        elif condition == "lte":
            triggered = from_val <= threshold
        elif condition == "gt":
            triggered = from_val > threshold
        elif condition == "gte":
            triggered = from_val >= threshold
        elif condition == "eq":
            triggered = from_val == rule.get("value", threshold)

        if not triggered:
            continue

        # Apply effect
        effect = rule.get("effect", "")
        domain_state[tid][f"entangled_{tmetric}"] = True

        if effect == "cap":
            cap_val = rule.get("cap_value", 0)
            old_val = tstate.get(tmetric, cap_val)
            domain_state[tid][tmetric] = min(old_val, cap_val) if isinstance(old_val, (int, float)) else cap_val
            domain_state[tid][f"{tmetric}_capped_by"] = rule.get("id")

        elif effect == "penalty":
            penalty_val = rule.get("penalty_value", 0.1)
            old = tstate.get(tmetric, 0.0)
            domain_state[tid][tmetric] = round(old + penalty_val, 2)

        elif effect == "multiply":
            mult = rule.get("multiplier", 1.5)
            old = tstate.get(tmetric, 1.0)
            domain_state[tid][tmetric] = round(old * mult, 2)

        elif effect == "reduce":
            reduction = rule.get("reduction", 0.3)
            old = tstate.get(tmetric, 1.0)
            domain_state[tid][tmetric] = round(max(0.0, old - reduction), 2)

        elif effect == "escalate":
            delta = rule.get("risk_delta", 0.1)
            old = tstate.get(tmetric, 0.0)
            domain_state[tid][tmetric] = round(min(1.0, old + delta), 2)

        elif effect == "warn":
            pass  # Warnings are recorded below

        active.append({
            "id": rule.get("id", "unknown"),
            "from": f"{fid}.{fmetric}",
            "to": f"{tid}.{tmetric}",
            "trigger_value": from_val,
            "threshold": threshold,
            "condition": condition,
            "effect": effect,
            "weight": weight,
            "description": rule.get("description", ""),
            "message": rule.get("message", ""),
        })

    return active


def _detect_cascades(domain_state: dict, spoon_level: int) -> list[dict]:
    """
    Check all cascade rules and return any active cascading failure predictions.
    Cascades predict chains of effects that will propagate if the trigger condition holds.
    """
    active_cascades: list[dict] = []

    threshold_mult = SPOON_CASCADE_THRESHOLDS.get(spoon_level, 0.3)

    for cascade in CASCADE_RULES:
        trigger = cascade["trigger"]
        domain = trigger["domain"]
        metric = trigger["metric"]
        condition = trigger["condition"]
        threshold = trigger.get("threshold", 0)
        value = trigger.get("value", threshold)

        state = domain_state.get(domain, {})
        if metric == "is_peak_hours":
            actual_val = state.get("in_peak_hours", False)
        elif metric == "is_trough_hours":
            actual_val = state.get("in_trough_hours", False)
        else:
            actual_val = state.get(metric, 0)

        # Evaluate with spoon-weighted threshold
        adjusted_threshold = threshold * (1.0 + threshold_mult) if isinstance(threshold, (int, float)) else threshold

        triggered = False
        if condition == "lt":
            triggered = actual_val < adjusted_threshold
        elif condition == "lte":
            triggered = actual_val <= adjusted_threshold
        elif condition == "gt":
            triggered = actual_val > adjusted_threshold
        elif condition == "eq":
            triggered = actual_val == value

        if triggered:
            active_cascades.append({
                "id": cascade["id"],
                "severity": cascade["severity"],
                "trigger": f"{domain}.{metric} = {actual_val}",
                "chain": cascade["chain"],
                "critical_action": cascade["critical_action"],
            })

    return active_cascades


def _determine_critical_action(
    domain_state: dict, active_entanglements: list[dict], active_cascades: list[dict]
) -> dict:
    """
    From all active cascades and entanglements, determine the single most important
    action the operator should take right now.
    """
    now_hour = datetime.now(timezone.utc).hour
    spoon_level = domain_state.get("COGNITIVE", {}).get("raw_spoon_level", 4)

    # Priority 1: Critical cascades first
    critical_cascades = [c for c in active_cascades if c["severity"] == "critical"]
    if critical_cascades:
        return {
            "priority": "CRITICAL",
            "action": critical_cascades[0]["critical_action"],
            "reason": f"Cascade triggered: {critical_cascades[0]['trigger']}",
            "source": "cascade",
            "icon": "🔴",
        }

    # Priority 2: High severity cascades
    high_cascades = [c for c in active_cascades if c["severity"] == "high"]
    if high_cascades:
        return {
            "priority": "HIGH",
            "action": high_cascades[0]["critical_action"],
            "reason": f"Cascade triggered: {high_cascades[0]['trigger']}",
            "source": "cascade",
            "icon": "🟠",
        }

    # Priority 3: Active entanglements with warnings
    warning_ents = [e for e in active_entanglements if e.get("message") and e.get("effect") == "warn"]
    if warning_ents:
        return {
            "priority": "WARNING",
            "action": warning_ents[0]["message"],
            "reason": f"Entanglement active: {warning_ents[0]['from']} → {warning_ents[0]['to']}",
            "source": "entanglement",
            "icon": "🟡",
        }

    # Priority 4: Medium cascades
    medium_cascades = [c for c in active_cascades if c["severity"] == "medium"]
    if medium_cascades and spoon_level >= 2:
        return {
            "priority": "MEDIUM",
            "action": medium_cascades[0]["critical_action"],
            "reason": f"Cascade triggered: {medium_cascades[0]['trigger']}",
            "source": "cascade",
            "icon": "🔵",
        }

    # Priority 5: Peak hour opportunity
    is_peak = domain_state.get("COGNITIVE", {}).get("in_peak_hours", False)
    if is_peak and spoon_level >= 3:
        return {
            "priority": "OPPORTUNITY",
            "action": f"Peak window active ({now_hour}:00). Spoon level {spoon_level}. Tackle highest-value task now.",
            "reason": "Cognitive peak hours — optimal for complex work",
            "source": "schedule",
            "icon": "🟢",
        }

    # Priority 6: Trough awareness
    is_trough = domain_state.get("COGNITIVE", {}).get("in_trough_hours", False)
    if is_trough:
        return {
            "priority": "INFO",
            "action": "Trough hours. Conserve spoons. Low-demand tasks only.",
            "reason": "Alertness trough — complex work inefficient",
            "source": "schedule",
            "icon": "⚪",
        }

    # Priority 7: Default — check for legal deadlines
    if domain_state.get("LEGAL", {}).get("upcoming_deadlines", 0) > 0:
        return {
            "priority": "INFO",
            "action": "Legal deadlines pending. Prioritize court preparation.",
            "reason": f"{domain_state['LEGAL']['upcoming_deadlines']} upcoming legal events",
            "source": "legal",
            "icon": "⚪",
        }

    return {
        "priority": "OK",
        "action": "All domains nominal. Proceed with planned work.",
        "reason": "No active cascades or warnings",
        "source": "nexus",
        "icon": "💚",
    }


def main() -> None:
    t0 = time.time()

    print("P31 NEXUS — Cross-Domain State Entanglement Engine", file=sys.stderr)
    print(f"  Config: {NEXUS_ENTANGLEMENTS_PATH}", file=sys.stderr)

    # Phase 1: Ingest state from all domains
    domain_state = _compute_domain_state()
    spoon_level = domain_state["COGNITIVE"]["raw_spoon_level"]

    print(f"  Domains ingested: {', '.join(domain_state.keys())}", file=sys.stderr)
    print(f"  Spoon level: {spoon_level} ({SPOON_LABELS.get(spoon_level, '')})", file=sys.stderr)

    # Phase 2: Compute domain health scores
    domain_health = {}
    for domain in DOMAINS:
        state = domain_state.get(domain, {})
        health = _compute_domain_health(domain, state)
        domain_health[domain] = round(health, 3)
        print(f"  {domain}: {health:.2f}", file=sys.stderr)

    # Phase 3: Load and apply entanglement rules
    entanglement_rules = _resolve_entanglements()
    print(f"  Entanglement rules: {len(entanglement_rules)}", file=sys.stderr)
    active_entanglements = _apply_entanglements(domain_state, entanglement_rules)
    print(f"  Active entanglements: {len(active_entanglements)}", file=sys.stderr)

    # Phase 4: Detect cascading failure chains
    active_cascades = _detect_cascades(domain_state, spoon_level)
    print(f"  Active cascades: {len(active_cascades)}", file=sys.stderr)

    # Phase 5: Determine critical action
    critical_action = _determine_critical_action(domain_state, active_entanglements, active_cascades)
    print(f"  Critical action [{critical_action['priority']}]: {critical_action['action'][:80]}...", file=sys.stderr)

    # Phase 6: Build unified nexus state
    nexus_state = {
        "meta": {
            "schema": "PMM_NEXUS=1.0",
            "generated_at": _now_iso(),
            "generation_seconds": round(time.time() - t0, 2),
            "spoon_level": spoon_level,
            "spoon_label": SPOON_LABELS.get(spoon_level, ""),
        },
        "domains": {
            d: {
                "health": domain_health.get(d, 0.5),
                "risk_label": _risk_label(domain_health.get(d, 0.5)),
                "metrics": domain_state.get(d, {}),
            }
            for d in DOMAINS
        },
        "entanglements": {
            "active": active_entanglements,
            "count": len(active_entanglements),
        },
        "cascades": {
            "active": active_cascades,
            "count": len(active_cascades),
        },
        "critical_action": critical_action,
        "overall_health": round(sum(domain_health.values()) / len(domain_health), 3),
    }

    # Write nexus-state.json
    NEXUS_STATE_PATH.write_text(json.dumps(nexus_state, indent=2), encoding="utf-8")
    print(f"  Wrote {NEXUS_STATE_PATH}", file=sys.stderr)

    # Phase 7: Write NEXUS_REPORT.md
    report_lines: list[str] = []
    report_lines.append("# P31 NEXUS Report")
    report_lines.append("")
    report_lines.append(f"**Generated:** {nexus_state['meta']['generated_at']}")
    report_lines.append(f"**Spoon Level:** {spoon_level} ({SPOON_LABELS.get(spoon_level, '')})")
    report_lines.append(f"**Overall Health:** {nexus_state['overall_health']:.2f}")
    report_lines.append(f"**Duration:** {nexus_state['meta']['generation_seconds']}s")
    report_lines.append("")

    # Critical Action
    report_lines.append("## Critical Action")
    report_lines.append("")
    report_lines.append(f"{critical_action['icon']} **[{critical_action['priority']}]** {critical_action['action']}")
    report_lines.append(f"  → {critical_action['reason']}")
    report_lines.append("")

    # Domain Health
    report_lines.append("## Domain Health")
    report_lines.append("")
    report_lines.append("| Domain | Health | Status |")
    report_lines.append("|--------|--------|--------|")
    for d in DOMAINS:
        h = domain_health.get(d, 0.5)
        label = _risk_label(h)
        icon = _risk_icon(h)
        report_lines.append(f"| {DOMAIN_LABELS.get(d, d)} | {h:.2f} | {icon} {label} |")
    report_lines.append("")

    # Active Entanglements
    if active_entanglements:
        report_lines.append("## Active Entanglements")
        report_lines.append("")
        for e in active_entanglements:
            report_lines.append(f"- **{e['id']}**: {e['from']} → {e['to']} (trigger: {e['trigger_value']} {e['condition']} {e['threshold']})")
            if e.get("description"):
                report_lines.append(f"  - {e['description']}")
            if e.get("message"):
                report_lines.append(f"  - ⚠️ {e['message']}")
        report_lines.append("")

    # Active Cascades
    if active_cascades:
        report_lines.append("## Active Cascading Failures")
        report_lines.append("")
        severity_icon = {"critical": "🔴", "high": "🟠", "medium": "🟡"}
        for c in active_cascades:
            report_lines.append(f"### {severity_icon.get(c['severity'], '⚪')} {c['id']} ({c['severity'].upper()})")
            report_lines.append("")
            report_lines.append(f"**Trigger:** {c['trigger']}")
            report_lines.append("")
            report_lines.append("**Chain:**")
            report_lines.append("")
            for step in c["chain"]:
                report_lines.append(f"1. {step['domain']}.{step['metric']} → {step['effect']}")
            report_lines.append("")
            report_lines.append(f"**Critical Action:** {c['critical_action']}")
            report_lines.append("")
            report_lines.append("---")
            report_lines.append("")

    # Metric Details
    report_lines.append("## Metric Details")
    report_lines.append("")
    for d in DOMAINS:
        report_lines.append(f"### {DOMAIN_LABELS.get(d, d)}")
        report_lines.append("")
        report_lines.append(f"Health: {domain_health.get(d, 0.5):.2f}")
        metrics = domain_state.get(d, {})
        # Show key metrics
        key_metrics = {k: v for k, v in metrics.items()
                       if not k.startswith("_") and not isinstance(v, (dict, list))}
        if key_metrics:
            report_lines.append("")
            report_lines.append("| Metric | Value |")
            report_lines.append("|--------|-------|")
            for k, v in sorted(key_metrics.items()):
                report_lines.append(f"| `{k}` | {v} |")
        report_lines.append("")

    # Write report
    if NEXUS_REPORT_PATH.exists():
        existing = NEXUS_REPORT_PATH.read_text(encoding="utf-8")
        NEXUS_REPORT_PATH.write_text(existing + "\n" + "\n".join(report_lines), encoding="utf-8")
    else:
        NEXUS_REPORT_PATH.write_text("\n".join(report_lines), encoding="utf-8")
    print(f"  Updated {NEXUS_REPORT_PATH}", file=sys.stderr)

    # Phase 8: CLI output
    print("", file=sys.stderr)
    print("=" * 60, file=sys.stderr)
    print(f"  NEXUS — {_now_iso()}", file=sys.stderr)
    print(f"  Spoons: {spoon_level}/5 {SPOON_LABELS.get(spoon_level, '')}", file=sys.stderr)
    print(f"  Overall: {nexus_state['overall_health']:.2f}", file=sys.stderr)
    print(f"  {critical_action['icon']}  ACTION: {critical_action['action']}", file=sys.stderr)
    print(f"     Reason: {critical_action['reason']}", file=sys.stderr)
    print("=" * 60, file=sys.stderr)
    print(f"Done. {time.time() - t0:.2f}s", file=sys.stderr)


def _risk_label(health: float) -> str:
    if health >= 0.85:
        return "FLOURISHING"
    if health >= 0.65:
        return "HEALTHY"
    if health >= 0.45:
        return "STABLE"
    if health >= 0.25:
        return "UNSTABLE"
    return "CRITICAL"


def _risk_icon(health: float) -> str:
    if health >= 0.85:
        return "💚"
    if health >= 0.65:
        return "💚"
    if health >= 0.45:
        return "🟡"
    if health >= 0.25:
        return "🟠"
    return "🔴"


if __name__ == "__main__":
    main()
