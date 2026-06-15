#!/usr/bin/env python3
"""
PMM Jitterbug Daemon — Quantum Maturity Oscillator
Applies continuous decay, signal reinforcement, entanglement, and quantum jitter
to every artifact's maturity scores. Automatically downgrades depressed artifacts
and upgrades healthy entangled ones.

PMM_JITTERBUG=1.0
"""

import json
import math
import os
import random
import re
import subprocess
import sys
import time
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path("/home/p31/andromeda").resolve()
INDEX_PATH = REPO_ROOT / "grading-index.json"
REPORT_PATH = REPO_ROOT / "GRADING_REPORT.md"
SIGNALS_PATH = REPO_ROOT / "jitterbug-signals.json"
ENTANGLEMENTS_PATH = REPO_ROOT / "jitterbug-entanglements.json"
JITTERBUG_STATE_PATH = REPO_ROOT / "jitterbug-state.json"
SPOON_STATE_PATH = REPO_ROOT / "spoon-state.json"
DEPRESSED_QUEUE_PATH = REPO_ROOT / "jitterbug-depressed-queue.json"

# Decay per hour per dimension
DECAY_RATES = {
    "CODE": 0.001,
    "TEST": 0.002,
    "DOCS": 0.004,
    "OPS": 0.002,
    "SEC": 0.003,
}

# Signal strengths per dimension per signal type
SIGNAL_STRENGTHS = {
    "tests_pass": {"TEST": 0.2, "CODE": 0.05},
    "build_success": {"CODE": 0.1},
    "new_test_file": {"TEST": 0.3},
    "commit": {"CODE": 0.05},
    "deploy_success": {"OPS": 0.2, "CODE": 0.05},
    "deps_updated": {"SEC": 0.2, "OPS": 0.05},
    "coverage_met": {"TEST": 0.3, "CODE": 0.05},
    "pr_merged": {"CODE": 0.15, "OPS": 0.1, "DOCS": 0.1},
    "docs_updated": {"DOCS": 0.25},
}

# Jitter parameters
JITTER_MEAN = 0.0
JITTER_STD = 0.01

# Recovery boost multiplier for depressed artifacts receiving signals
RECOVERY_BOOST = 2.0

# Stage thresholds (continuous score → discrete stage)
STAGE_THRESHOLDS = [
    (4.5, "FRUIT", "🍎"),
    (3.5, "BLOOM", "🌸"),
    (2.5, "SAPLING", "🌳"),
    (1.5, "SPROUT", "🌿"),
    (0.0, "SEED", "🌱"),
]

STAGE_ORDER = {"FRUIT": 5, "BLOOM": 4, "SAPLING": 3, "SPROUT": 2, "SEED": 1}

DEPRESSION_THRESHOLD = 1.5

# Spoon-level time dilation
# Level → (decay_multiplier, signal_multiplier, allow_jitter, allow_entanglement, allow_depression)
SPOON_PRESETS: dict[int, tuple[float, float, bool, bool, bool]] = {
    5: (1.5, 1.5, True, True, True),   # Flow — accelerated entropy, boosted rewards
    4: (1.0, 1.0, True, True, True),   # Focus — normal operation
    3: (0.5, 1.0, True, True, True),   # Steady — slowed entropy
    2: (0.25, 1.0, True, False, False), # Low — minimal entropy, no entanglement/depression
    1: (0.0, 1.0, False, False, False), # Depleted — cryo-stasis, signals still accepted
    0: (0.0, 0.0, False, False, False), # Gray Rock — fully parked, no signals processed
}

SPOON_LABELS = {5: "Flow 🚀", 4: "Focus 🎯", 3: "Steady ⚖️", 2: "Low 🔋", 1: "Depleted 🛌", 0: "Gray Rock ⛓️‍💥"}


def _load_spoon_level() -> int:
    """Read spoon level from spoon-state.json > signals > env > default 4."""
    # 1. Dedicated spoon file
    if SPOON_STATE_PATH.exists():
        try:
            data = json.loads(SPOON_STATE_PATH.read_text(encoding="utf-8"))
            level = int(data.get("level", 4))
            if level in SPOON_PRESETS:
                return level
        except Exception:
            pass
    # 2. Signals file
    if SIGNALS_PATH.exists():
        try:
            data = json.loads(SIGNALS_PATH.read_text(encoding="utf-8"))
            level = int(data.get("spoon_level", 4))
            if level in SPOON_PRESETS:
                return level
        except Exception:
            pass
    # 3. Environment
    try:
        level = int(os.environ.get("P31_SPOON_LEVEL", "4"))
        if level in SPOON_PRESETS:
            return level
    except Exception:
        pass
    return 4


def _git_timestamps() -> dict[str, float]:
    """Return {relative_path: last_modified_timestamp} for all tracked files."""
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


def _last_commit_for_path(relpath: str, git_ts: dict[str, float]) -> float:
    """Find the most recent commit timestamp affecting a path or any subpath."""
    best = 0.0
    for path, ts in git_ts.items():
        if path == relpath or path.startswith(relpath + "/"):
            best = max(best, ts)
    return best


def _load_signals() -> dict:
    if SIGNALS_PATH.exists():
        try:
            return json.loads(SIGNALS_PATH.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}


def _load_entanglements() -> list[tuple[str, str]]:
    if ENTANGLEMENTS_PATH.exists():
        try:
            data = json.loads(ENTANGLEMENTS_PATH.read_text(encoding="utf-8"))
            return [(p["a"], p["b"]) for p in data.get("pairs", [])]
        except Exception:
            return []
    # Auto-infer from package.json dependency graphs as fallback
    return []


def _infer_entanglements(index_data: dict) -> list[tuple[str, str]]:
    """Infer entanglement pairs from package.json dependency relationships."""
    pairs: list[tuple[str, str]] = []
    artifacts = {a["path"]: a for a in index_data["artifacts"]}
    paths = list(artifacts.keys())
    # Simple heuristic: packages under same prefix directory are entangled
    prefix_groups: dict[str, list[str]] = defaultdict(list)
    for p in paths:
        parts = p.split("/")
        if len(parts) >= 3:
            prefix = "/".join(parts[:2])
            prefix_groups[prefix].append(p)
    for group in prefix_groups.values():
        if len(group) >= 2:
            for i in range(len(group)):
                for j in range(i + 1, len(group)):
                    pairs.append((group[i], group[j]))
    return pairs


def _stage_from_score(score: float) -> tuple[str, str]:
    for threshold, name, icon in STAGE_THRESHOLDS:
        if score >= threshold:
            return name, icon
    return "SEED", "🌱"


def _clamp(val: float, lo: float = 1.0, hi: float = 5.0) -> float:
    return max(lo, min(hi, val))


def main() -> None:
    t0 = time.time()
    random.seed()

    print("Jitterbug daemon — Quantum Maturity Oscillator", file=sys.stderr)
    print(f"  State: {INDEX_PATH}", file=sys.stderr)

    if not INDEX_PATH.exists():
        print("  ERROR: grading-index.json not found. Run grade-repo.py first.", file=sys.stderr)
        sys.exit(1)

    # Load current state
    index_data = json.loads(INDEX_PATH.read_text(encoding="utf-8"))
    artifacts = index_data["artifacts"]
    now = time.time()

    # Load signals and entanglement data
    signals = _load_signals()
    entanglement_pairs = _load_entanglements()
    if not entanglement_pairs:
        entanglement_pairs = _infer_entanglements(index_data)

    git_ts = _git_timestamps()
    has_git_data = bool(git_ts)

    print(f"  Artifacts: {len(artifacts)}", file=sys.stderr)
    print(f"  Entanglement pairs: {len(entanglement_pairs)}", file=sys.stderr)
    print(f"  Git data: {'yes' if has_git_data else 'no'}", file=sys.stderr)
    print(f"  Signals: {'yes' if signals else 'no'}", file=sys.stderr)

    # Build path → artifact lookup
    artifact_map = {a["path"]: a for a in artifacts}
    path_list = list(artifact_map.keys())

    # Initialize continuous scores and state if not present
    for a in artifacts:
        if "continuous_scores" not in a:
            a["continuous_scores"] = {k: float(v) for k, v in a["scores"].items()}
        if "depressed" not in a:
            a["depressed"] = False
        if "last_refreshed" not in a:
            # Use git timestamp or default to now
            git_lm = _last_commit_for_path(a["path"], git_ts)
            a["last_refreshed"] = git_lm if git_lm > 0 else now
        if "jitter" not in a:
            a["jitter"] = 0.0

    # Spoon-state time dilation
    spoon_level = _load_spoon_level()
    decay_mult, signal_mult, allow_jitter, allow_entanglement, allow_depression = SPOON_PRESETS[spoon_level]
    spoon_label = SPOON_LABELS[spoon_level]
    print(f"  Spoon level: {spoon_level} ({spoon_label})", file=sys.stderr)
    if decay_mult == 0.0:
        print("  → Cryo-stasis: entropy frozen", file=sys.stderr)

    # Operator-overridden artifacts are frozen — no dynamics
    overridden_paths = {a["path"] for a in artifacts if a.get("override")}
    mutable = [a for a in artifacts if a["path"] not in overridden_paths]

    # Phase 1: Apply decay (modulated by spoon state)
    if decay_mult > 0:
        print(f"  Phase 1: Decay (entropy ×{decay_mult})...", file=sys.stderr)
        for a in mutable:
            hours_since = max(0, (now - a["last_refreshed"]) / 3600)
            for dim in a["continuous_scores"]:
                decay = DECAY_RATES.get(dim, 0.001) * hours_since * decay_mult
                a["continuous_scores"][dim] = _clamp(a["continuous_scores"][dim] - decay)
    else:
        print("  Phase 1: Decay (frozen — spoon level 0-1)", file=sys.stderr)

    # Phase 2: Apply signals (modulated by spoon state)
    if signal_mult > 0:
        print(f"  Phase 2: Signals (reinforcement ×{signal_mult})...", file=sys.stderr)
        signal_count = 0
        for signal_name, signal_data in signals.items():
            if signal_name.startswith("_"):
                continue
            if not isinstance(signal_data, dict):
                continue
            strength = SIGNAL_STRENGTHS.get(signal_name, {})
            target_artifacts = signal_data.get("artifacts", [])
            for target in target_artifacts:
                if target in artifact_map and target not in overridden_paths:
                    a = artifact_map[target]
                    for dim, boost in strength.items():
                        applied_boost = boost * signal_data.get("weight", 1.0) * signal_mult
                        # Recovery boost: depressed artifacts get 2x signal to help them escape
                        if a.get("depressed"):
                            applied_boost *= 2.0
                        a["continuous_scores"][dim] = _clamp(
                            a["continuous_scores"][dim] + applied_boost
                        )
                    a["last_refreshed"] = now
                    signal_count += 1
    else:
        print("  Phase 2: Signals (ignored — Gray Rock)", file=sys.stderr)
        signal_count = 0

    # Phase 3: Apply entanglement
    if allow_entanglement:
        print(f"  Phase 3: Entanglement ({len(entanglement_pairs)} pairs)...", file=sys.stderr)
        entangle_hits = 0
        for a_path, b_path in entanglement_pairs:
            a = artifact_map.get(a_path)
            b = artifact_map.get(b_path)
            if not a or not b:
                continue
            if a_path in overridden_paths or b_path in overridden_paths:
                continue

            a_score = min(a["continuous_scores"].values())
            b_score = min(b["continuous_scores"].values())

            if a_score >= 2.5 and b_score >= 2.5:
                for dim in ("TEST",):
                    a["continuous_scores"][dim] = _clamp(a["continuous_scores"][dim] + 0.05)
                    b["continuous_scores"][dim] = _clamp(b["continuous_scores"][dim] + 0.05)
                entangle_hits += 1

            if a.get("depressed") and b_score >= 2.5:
                for dim in ("TEST",):
                    b["continuous_scores"][dim] = _clamp(b["continuous_scores"][dim] - 0.1)
            if b.get("depressed") and a_score >= 2.5:
                for dim in ("TEST",):
                    a["continuous_scores"][dim] = _clamp(a["continuous_scores"][dim] - 0.1)
    else:
        print(f"  Phase 3: Entanglement (off — spoon level 0-2)", file=sys.stderr)
        entangle_hits = 0

    # Phase 4: Quantum jitter
    if allow_jitter:
        print("  Phase 4: Quantum jitter...", file=sys.stderr)
        for a in mutable:
            a["jitter"] = random.gauss(JITTER_MEAN, JITTER_STD)
            for dim in a["continuous_scores"]:
                a["continuous_scores"][dim] += a["jitter"]
            for dim in a["continuous_scores"]:
                a["continuous_scores"][dim] = _clamp(a["continuous_scores"][dim], 1.001, 5.0)
    else:
        print("  Phase 4: Jitter (off — spoon level 0-1)", file=sys.stderr)

    # Phase 5: Depression check
    if allow_depression:
        print("  Phase 5: Depression check...", file=sys.stderr)
        depressed_entered: list[str] = []
        depressed_exited: list[str] = []
        for a in mutable:
            overall = min(a["continuous_scores"].values())
            was_depressed = a.get("depressed", False)

            peak = a.get("peak_overall", overall)
            if overall > peak:
                a["peak_overall"] = overall
                peak = overall
            a["peak_overall"] = peak

            dropped_from_grace = peak >= 2.0 and overall < peak * 0.6
            is_depressed = overall < DEPRESSION_THRESHOLD and dropped_from_grace

            if is_depressed and not was_depressed:
                depressed_entered.append(a["path"])
            elif was_depressed and not is_depressed:
                depressed_exited.append(a["path"])

            a["depressed"] = is_depressed
    else:
        print("  Phase 5: Depression check (off — spoon level 0-2)", file=sys.stderr)
        depressed_entered = []
        depressed_exited = []

    # Write depression queue for macrophage
    depressed_paths = [
        str(REPO_ROOT / a["path"])
        for a in artifacts
        if a.get("depressed")
    ]
    DEPRESSED_QUEUE_PATH.write_text(
        json.dumps({"depressed": depressed_paths, "entered": depressed_entered, "timestamp": now}, indent=2),
        encoding="utf-8",
    )

    # Phase 6: Compute discrete stages (skip overridden artifacts)
    print("  Phase 6: Stage transitions...", file=sys.stderr)
    transitions: list[tuple[str, str, str, float, float]] = []
    for a in mutable:
        overall_score = min(a["continuous_scores"].values())

        if a["depressed"]:
            new_stage = "SEED"
            new_icon = "🌱"
        else:
            new_stage, new_icon = _stage_from_score(overall_score)

        old_stage = a.get("stage", "SEED")
        if old_stage != new_stage:
            old_overall = a.get("overall", 0.0)
            transitions.append((a["path"], old_stage, new_stage, float(old_overall), overall_score))

        a["stage"] = new_stage
        a["stage_icon"] = new_icon
        a["overall"] = round(overall_score, 3)
        a["overall_score"] = round(overall_score, 3)
        a["scores"] = {k: round(v, 3) for k, v in a["continuous_scores"].items()}
        a["weakest"] = [
            k for k, v in a["scores"].items()
            if v == min(a["scores"].values())
        ]

    # Phase 7: Sort by stage (worst first)
    artifacts.sort(key=lambda e: (STAGE_ORDER.get(e["stage"], 0), e["path"]))

    # Phase 8: Update metadata
    index_data["meta"]["jitterbug_version"] = "PMM_JITTERBUG=1.0"
    index_data["meta"]["jitterbug_tick"] = index_data["meta"].get("jitterbug_tick", 0) + 1
    index_data["meta"]["last_jitterbug"] = time.strftime("%Y-%m-%dT%H:%M:%S")
    index_data["meta"]["spoon_level"] = spoon_level
    index_data["meta"]["spoon_label"] = spoon_label
    index_data["meta"]["depressed_artifacts"] = len([a for a in artifacts if a["depressed"]])
    index_data["meta"]["entanglement_pairs"] = len(entanglement_pairs)
    index_data["meta"]["transitions_this_tick"] = len(transitions)
    index_data["meta"]["scan_duration_seconds"] = round(time.time() - t0, 2)

    # Write updated index
    INDEX_PATH.write_text(json.dumps(index_data, indent=2), encoding="utf-8")
    print(f"  Wrote {INDEX_PATH}", file=sys.stderr)

    # Phase 9: Append to GRADING_REPORT.md
    print("  Phase 9: Writing report...", file=sys.stderr)
    report_lines: list[str] = []

    report_lines.append("")
    report_lines.append("---")
    report_lines.append("")
    report_lines.append("## Jitterbug Tick Report")
    report_lines.append("")
    report_lines.append(f"**Tick:** {index_data['meta']['jitterbug_tick']}")
    report_lines.append(f"**Time:** {index_data['meta']['last_jitterbug']}")
    report_lines.append(f"**Spoon level:** {spoon_level} ({spoon_label})")
    report_lines.append(f"**Duration:** {index_data['meta']['scan_duration_seconds']}s")
    report_lines.append(f"**Git data:** {'yes' if has_git_data else 'no'}")
    report_lines.append(f"**Signals processed:** {signal_count}")
    report_lines.append(f"**Entanglement hits:** {entangle_hits}")
    if decay_mult == 0.0:
        report_lines.append("**Entropy:** FROZEN (cryo-stasis)")
    elif decay_mult != 1.0:
        report_lines.append(f"**Entropy multiplier:** ×{decay_mult}")
    report_lines.append("")

    if transitions:
        report_lines.append("### Stage Transitions")
        report_lines.append("")
        report_lines.append("| Artifact | From | To | Old Score | New Score |")
        report_lines.append("|----------|------|----|-----------|-----------|")
        for p, old, new, old_s, new_s in transitions:
            report_lines.append(f"| `{p}` | {old} | {new} | {old_s:.2f} | {new_s:.2f} |")
        report_lines.append("")

    if depressed_entered:
        report_lines.append("### Newly Depressed")
        report_lines.append("")
        for p in depressed_entered:
            report_lines.append(f"- `{p}` — flagged for repair")
        report_lines.append("")

    if depressed_exited:
        report_lines.append("### Recovered from Depression")
        report_lines.append("")
        for p in depressed_exited:
            report_lines.append(f"- `{p}` — back to normal")
        report_lines.append("")

    # Updated summary
    stage_counts = defaultdict(int)
    for a in artifacts:
        stage_counts[a["stage"]] += 1
    report_lines.append("### Current Distribution")
    report_lines.append("")
    report_lines.append("| Stage | Count |")
    report_lines.append("|-------|-------|")
    for s in ["FRUIT", "BLOOM", "SAPLING", "SPROUT", "SEED"]:
        icon = {"FRUIT": "🍎", "BLOOM": "🌸", "SAPLING": "🌳", "SPROUT": "🌿", "SEED": "🌱"}
        c = stage_counts.get(s, 0)
        report_lines.append(f"| {icon.get(s, '')} **{s}** | {c} |")
    report_lines.append("")

    # Append to report (or create if not exists)
    if REPORT_PATH.exists():
        existing = REPORT_PATH.read_text(encoding="utf-8")
        REPORT_PATH.write_text(existing + "\n" + "\n".join(report_lines), encoding="utf-8")
    else:
        REPORT_PATH.write_text("\n".join(report_lines), encoding="utf-8")
    print(f"  Updated {REPORT_PATH}", file=sys.stderr)

    # Summary
    print(f"", file=sys.stderr)
    print(f"  Transitions: {len(transitions)}", file=sys.stderr)
    print(f"  Depressed entered: {len(depressed_entered)}", file=sys.stderr)
    print(f"  Depressed exited: {len(depressed_exited)}", file=sys.stderr)
    print(f"  Entanglement hits: {entangle_hits}", file=sys.stderr)
    print(f"Done. {time.time()-t0:.2f}s", file=sys.stderr)


if __name__ == "__main__":
    main()
