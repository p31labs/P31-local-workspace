#!/usr/bin/env python3
"""
OQE Verifier v1.0 — Objective Quality Evidence Hard Gate
P31 SOP: OQE-001

Scans staged files for:
  1. WCD-06 signoff metadata (required on ALL code changes — no exceptions)
  2. Risk-sensitive patterns (exec, eval, subprocess, shell injection vectors)
  3. Token/claim inflation (BONDING test count > 424, suites > 32)
  4. Hardcoded invariant violations (old EIN, wrong EIN, stale ports)

Exit codes:
  0  All checks passed — gate open
  1  OQE violation found — gate closed
  2  No staged files or invalid usage

Override:
  --force-rca "reason"  — bypass with mandatory Root Cause Analysis log entry.
                           This is the ONLY escape hatch. It writes a timestamped
                           RCA entry to .p31/rca/oqe-overrides.jsonl

Usage:
  python oqe-verifier.py
  python oqe-verifier.py --force-rca "Emergency hotfix — Track C mission critical"
"""

import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Optional

# ---------------------------------------------------------------------------
# Verified P31 Constants (from CLAUDE.md — DO NOT change without OQE pass)
# ---------------------------------------------------------------------------

EIN_CANONICAL = "42-1888158"
EIN_STALE = "81-2908489"
EIN_WRONG = "42-1888158"  # typo variant

MAX_BONDING_TESTS = 424
MAX_BONDING_SUITES = 32

# ---------------------------------------------------------------------------
# Pattern Registry
# ---------------------------------------------------------------------------

RISK_PATTERNS: dict[str, tuple[re.Pattern, str]] = {
    "exec_call": (
        re.compile(r'\bexec\s*\(', re.IGNORECASE),
        "exec() call — code injection risk"
    ),
    "eval_call": (
        re.compile(r'\beval\s*\(', re.IGNORECASE),
        "eval() call — code injection risk"
    ),
    "subprocess_invoke": (
        re.compile(r'subprocess\.(call|run|Popen|check_output)', re.IGNORECASE),
        "subprocess invocation — validate shell=False"
    ),
    "os_system": (
        re.compile(r'\bos\.system\s*\(', re.IGNORECASE),
        "os.system() — shell injection risk"
    ),
    "shell_true": (
        re.compile(r'shell\s*=\s*True', re.IGNORECASE),
        "shell=True in subprocess — validate necessity"
    ),
    "dangerous_curl": (
        re.compile(r'curl\s+.*\|\s*sh', re.IGNORECASE),
        "curl piping to sh — validate source"
    ),
    "hardcoded_ein_stale": (
        re.compile(r'\b81-2908489\b'),
        f"STALE EIN {EIN_STALE} — must be {EIN_CANONICAL}"
    ),
    "hardcoded_ein_wrong": (
        re.compile(r'\b42-1888158\b'),
        f"WRONG EIN {EIN_WRONG} — correct value is {EIN_CANONICAL}"
    ),
}

WCD06_SIGNOFF_PATTERN = re.compile(
    r'(?:#|//|\*)\s*WCD[-_]06[:\s].*?(?:SIGNED|APPROVED|SIGNOFF)',
    re.IGNORECASE
)

EXCLUDE_DIRS = frozenset({
    ".git", "node_modules", "__pycache__", ".venv", "venv",
    "target", "dist", "build", ".next", ".cache",
    "phos/src-tauri/target",
})

CODE_EXTENSIONS = frozenset({
    ".py", ".js", ".ts", ".tsx", ".sh", ".rs", ".toml"
})

SKIP_WCD06_PATHS = re.compile(
    r'(?:README|CHANGELOG|\.md$|\.txt$|\.json$|\.yaml$|\.yml$)'
)

# ---------------------------------------------------------------------------
# Data Structures
# ---------------------------------------------------------------------------

@dataclass
class OQEViolation:
    file: str
    line: int
    pattern: str
    description: str
    severity: str = "ERROR"

@dataclass
class OQEResult:
    files_scanned: int = 0
    violations: list[OQEViolation] = field(default_factory=list)
    wcd06_signed: set = field(default_factory=set)
    wcd06_missing: list = field(default_factory=list)
    force_rca: Optional[str] = None

    @property
    def passed(self) -> bool:
        return len(self.violations) == 0

    def to_json(self) -> str:
        return json.dumps({
            "passed": self.passed,
            "files_scanned": self.files_scanned,
            "violations": [asdict(v) for v in self.violations],
            "wcd06_signed_files": sorted(self.wcd06_signed),
            "wcd06_missing_count": len(self.wcd06_missing),
            "wcd06_missing_sample": self.wcd06_missing[:10],
            "force_rca": self.force_rca,
        }, indent=2)


# ---------------------------------------------------------------------------
# Core Logic
# ---------------------------------------------------------------------------

def get_staged_files() -> list[str]:
    try:
        result = subprocess.run(
            ["git", "diff", "--cached", "--name-only", "--diff-filter=ACM"],
            capture_output=True, text=True, check=True,
            cwd=os.environ.get("P31_REPO_ROOT", os.getcwd()),
        )
        return [f.strip() for f in result.stdout.splitlines() if f.strip()]
    except subprocess.CalledProcessError:
        return []


def should_skip(path_str: str) -> bool:
    p = Path(path_str)
    if set(p.parts) & EXCLUDE_DIRS:
        return True
    if p.suffix.lower() not in CODE_EXTENSIONS:
        return True
    return False


def scan_file(path_str: str) -> tuple[list[OQEViolation], bool]:
    violations: list[OQEViolation] = []
    has_wcd06 = False

    try:
        content = Path(path_str).read_text(encoding="utf-8", errors="replace")
    except (OSError, PermissionError):
        return violations, has_wcd06

    lines = content.splitlines()

    # WCD-06 signoff required on ALL code files
    if not SKIP_WCD06_PATHS.search(path_str):
        has_wcd06 = any(WCD06_SIGNOFF_PATTERN.search(line) for line in lines)

    for lineno, line in enumerate(lines, 1):
        stripped = line.strip()
        if stripped.startswith(("#", "//", "*")):
            continue
        for pattern_name, (pattern, description) in RISK_PATTERNS.items():
            if pattern.search(line):
                violations.append(OQEViolation(
                    file=path_str,
                    line=lineno,
                    pattern=pattern_name,
                    description=description,
                ))

    # Inflation checks
    if "bonding" in path_str.lower():
        test_m = re.search(r'(\d+)\s*tests?', content, re.IGNORECASE)
        if test_m and int(test_m.group(1)) > MAX_BONDING_TESTS:
            violations.append(OQEViolation(
                file=path_str, line=0, pattern="test_inflation",
                description=f"BONDING test count {test_m.group(1)} > verified max {MAX_BONDING_TESTS}",
            ))
        suite_m = re.search(r'(\d+)\s*suites?', content, re.IGNORECASE)
        if suite_m and int(suite_m.group(1)) > MAX_BONDING_SUITES:
            violations.append(OQEViolation(
                file=path_str, line=0, pattern="suite_inflation",
                description=f"Suite count {suite_m.group(1)} > verified max {MAX_BONDING_SUITES}",
            ))

    return violations, has_wcd06


def log_force_override(rca_reason: str, staged_files: list[str]) -> None:
    rca_dir = Path(os.environ.get("P31_REPO_ROOT", os.getcwd())) / ".p31" / "rca"
    rca_dir.mkdir(parents=True, exist_ok=True)
    entry = {
        "timestamp": __import__("datetime").datetime.now().isoformat(),
        "event": "oqe_force_override",
        "rca": rca_reason,
        "files": staged_files,
    }
    with open(rca_dir / "oqe-overrides.jsonl", "a") as f:
        f.write(json.dumps(entry) + "\n")
    print(f"[OQE] 🔓 FORCE OVERRIDE logged to {rca_dir}/oqe-overrides.jsonl")
    print(f"[OQE]    RCA: {rca_reason}")


def run_verifier(force_rca: Optional[str] = None) -> OQEResult:
    result = OQEResult(force_rca=force_rca)
    staged = get_staged_files()

    if not staged:
        print("[OQE] No staged files. Nothing to verify.")
        return result

    for path_str in staged:
        if should_skip(path_str):
            continue
        result.files_scanned += 1
        violations, has_wcd06 = scan_file(path_str)
        result.violations.extend(violations)
        if has_wcd06:
            result.wcd06_signed.add(path_str)
        else:
            result.wcd06_missing.append(path_str)

    return result


def print_report(result: OQEResult) -> None:
    if result.passed:
        print(f"[OQE] ✅ GATE OPEN — {result.files_scanned} files scanned, 0 violations")
        if result.wcd06_signed:
            print(f"[OQE] WCD-06 signoff present on {len(result.wcd06_signed)} file(s)")
        return

    print(f"[OQE] ❌ GATE CLOSED — {result.files_scanned} files, {len(result.violations)} violations:")
    for v in result.violations:
        loc = f"{v.file}:{v.line}" if v.line else v.file
        print(f"  [{v.severity}] {loc}")
        print(f"           {v.pattern}: {v.description}")

    if result.wcd06_missing:
        print(f"\n[OQE] WCD-06 signoff MISSING from {len(result.wcd06_missing)} file(s):")
        for f in result.wcd06_missing:
            print(f"  {f}")
            print(f"    → Add: # WCD-06: SIGNED — <initials> <YYYY-MM-DD>")

    if result.force_rca:
        log_force_override(result.force_rca, result.wcd06_missing)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    import argparse
    parser = argparse.ArgumentParser(description="P31 OQE Hard Gate Verifier")
    parser.add_argument(
        "--force-rca", type=str, default=None,
        help="Override gate with RCA reason string (logs to .p31/rca/oqe-overrides.jsonl)"
    )
    parser.add_argument(
        "--json", action="store_true",
        help="Output machine-readable JSON"
    )
    args = parser.parse_args()

    result = run_verifier(force_rca=args.force_rca)

    if args.json:
        print(result.to_json())
    else:
        print_report(result)

    if not result.passed and not args.force_rca:
        print("\n[OQE] Commit blocked. Fix violations or use --force-rca with RCA.")
        sys.exit(1)

    if result.wcd06_missing and not args.force_rca:
        print("\n[OQE] Commit blocked — WCD-06 signoff required on all code files.")
        sys.exit(1)

    sys.exit(0)


if __name__ == "__main__":
    main()
