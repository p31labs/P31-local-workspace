#!/usr/bin/env python3
"""
P31 Maturity Model — Production Repository Grader (v2)
Grades meaningful artifacts using multi-strategy heuristics.
Outputs: grading-index.json + GRADING_REPORT.md

PMM_SCHEMA=1.1

Changes from v1:
  - Filtered artifact discovery: only dirs with package.json / Cargo.toml /
    top-level app source dirs. No .github/, .vscode/, .husky/, .astro/.
  - Baseline overrides: parses admin/P31_MATURITY_MODEL.md baseline table
    and applies operator ground truth overrides.
  - SEC ancestry lookup already correct (find_ancestor_file walks up tree).
  - Optional grading-overrides.json for additional manual overrides.
"""

import json
import os
import re
import subprocess
import sys
import time
from collections import defaultdict
from pathlib import Path
from typing import Any

REPO_ROOT = Path("/home/p31/andromeda").resolve()
EXCLUDE_PREFIXES = (
    "node_modules", ".pnpm", "dist", "coverage", ".git", ".turbo",
    "_ARCHIVE", "CoGNET", "cortex-ai-sdk", ".venv", "__pycache__",
    ".mypy_cache", ".ruff_cache",
)
EXCLUDE_PATH_PATTERNS = re.compile(
    r"/(node_modules|\.pnpm|dist|coverage|\.git|\.turbo|_ARCHIVE|CoGNET|cortex-ai-sdk|"
    r"\.github|\.vscode|\.husky|\.astro)/"
)
EXCLUDE_TOPLEVEL = (
    ".github", ".vscode", ".husky", ".astro",
)

# ---------------------------------------------------------------------------
# Baseline override parser
# ---------------------------------------------------------------------------

BASELINE_PATH = REPO_ROOT / "admin" / "P31_MATURITY_MODEL.md"
OVERRIDES_FILE = REPO_ROOT / "grading-overrides.json"

def parse_baseline_overrides() -> dict[str, dict[str, Any]]:
    """Parse admin/P31_MATURITY_MODEL.md baseline table into {path: {scores, stage}}.
    
    Table format:
    | `agent-engine` | 🌳 SAPLING | 3 | 3 | 2 | 1 | 2 | Notes |
    """
    overrides: dict[str, dict[str, Any]] = {}
    if not BASELINE_PATH.exists():
        return overrides

    text = BASELINE_PATH.read_text(encoding="utf-8", errors="replace")
    # Match table rows: | `path` | (emoji?) STAGE | N | N | N | N | N | ...
    pattern = re.compile(
        r"\|\s*`([^`]+)`\s*\|\s*[🌱🌿🌳🌸🍎]?\s*(\w+)\s*\|\s*(\d)\s*\|\s*(\d)\s*\|\s*(\d)\s*\|\s*(\d)\s*\|\s*(\d)\s*\|"
    )
    for match in pattern.finditer(text):
        path = match.group(1).strip()
        stage_name = match.group(2).strip().upper()
        dims = {
            "CODE": int(match.group(3)),
            "TEST": int(match.group(4)),
            "DOCS": int(match.group(5)),
            "OPS": int(match.group(6)),
            "SEC": int(match.group(7)),
        }
        overall = min(dims.values())
        overrides[path] = {
            "stage": stage_name,
            "scores": dims,
            "overall": overall,
        }
    return overrides


def load_override_json() -> dict[str, dict[str, Any]]:
    """Load grading-overrides.json if present."""
    if not OVERRIDES_FILE.exists():
        return {}
    try:
        return json.loads(OVERRIDES_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, Exception):
        print("  Warning: grading-overrides.json is invalid JSON, ignoring", file=sys.stderr)
        return {}


def match_override(scanner_path: str, baseline_overrides: dict,
                   json_overrides: dict) -> dict[str, Any] | None:
    """Check if a scanner path matches any override (by suffix)."""
    # JSON overrides take priority (exact match first, then suffix)
    for override_path, override in json_overrides.items():
        if scanner_path == override_path or scanner_path.endswith("/" + override_path):
            return override
    # Then baseline overrides (suffix match)
    for override_path, override in baseline_overrides.items():
        if scanner_path.endswith("/" + override_path) or scanner_path == override_path:
            return override
    return None


# ---------------------------------------------------------------------------
# File-system scanner (one pass)
# ---------------------------------------------------------------------------

class RepoScanner:
    """Single pass over the filesystem to collect all evidence."""

    def __init__(self) -> None:
        self.source_files: list[Path] = []
        self.test_files: list[Path] = []
        self.config_files: list[Path] = []
        self.readme_files: list[Path] = []
        self.lockfiles: list[Path] = []
        self.lint_configs: list[Path] = []
        self.ci_workflows: list[Path] = []
        self.deploy_configs: list[Path] = []
        self.package_json_files: list[Path] = []
        self.cargo_toml_files: list[Path] = []
        self.coverage_dirs: list[Path] = []
        self.firmware_files: list[Path] = []
        self.all_dirs: set[Path] = set()
        self.has_source_in_dir: set[Path] = set()

    def scan(self) -> None:
        for path in REPO_ROOT.rglob("*"):
            if path.is_dir():
                name = path.name
                if name in EXCLUDE_PREFIXES:
                    continue
                if name.startswith(".") and name not in (".github",):
                    continue
                self.all_dirs.add(path)
                continue

            # Skip excluded paths
            parent_str = str(path.parent)
            if EXCLUDE_PATH_PATTERNS.search(parent_str):
                continue
            if path.parent.name in EXCLUDE_PREFIXES:
                continue
            if path.parent.name.startswith(".") and path.parent.name not in (".github",):
                continue

            suffix = path.suffix
            name = path.name

            # Source files
            if suffix in (".ts", ".tsx", ".js", ".jsx", ".mjs", ".c", ".h", ".cpp", ".py", ".rs"):
                if name.endswith((".test.ts", ".test.tsx", ".test.js", ".test.mjs",
                                 ".spec.ts", ".spec.js", ".spec.mjs")):
                    self.test_files.append(path)
                elif name in ("vitest.config.ts", "vitest.config.js"):
                    self.config_files.append(path)
                else:
                    self.source_files.append(path)
                    # Track which dirs have source files (for artifact discovery)
                    self.has_source_in_dir.add(path.parent)

            # Config files
            if name in ("package.json",):
                self.package_json_files.append(path)
            if name in ("Cargo.toml",):
                self.cargo_toml_files.append(path)
            if name in ("wrangler.toml", "Dockerfile", "docker-compose.yml", "deploy.sh",
                        ".github/workflows/ci.yml", "netlify.toml", "vercel.json"):
                self.deploy_configs.append(path)
            if name in (".github/workflows/ci.yml", ".github/workflows/test.yml",
                        ".github/workflows/deploy.yml"):
                self.ci_workflows.append(path)

            # Lockfiles
            if name in ("pnpm-lock.yaml", "yarn.lock", "package-lock.json", "Cargo.lock"):
                self.lockfiles.append(path)

            # Lint configs
            if name in (".eslintrc", ".eslintrc.js", ".eslintrc.json", "eslint.config.mjs",
                        ".prettierrc", "ruff.toml", ".pylintrc", ".golangci.yml"):
                self.lint_configs.append(path)

            # Docs
            if name == "README.md":
                self.readme_files.append(path)

            # Firmware
            if suffix in (".ino", ".cpp", ".h", ".c") and "firmware" in parent_str.lower():
                self.firmware_files.append(path)

            # Coverage
            if name == "coverage" and path.is_dir():
                self.coverage_dirs.append(path)

# ---------------------------------------------------------------------------
# Artifact discovery (filtered)
# ---------------------------------------------------------------------------

def discover_artifacts(scanner: RepoScanner) -> list[Path]:
    """Find gradable artifacts: packages, apps, and firmware dirs only.
    
    Rules:
      1. Every dir with package.json (npm package)
      2. Every dir with Cargo.toml (Rust crate)
      3. Top-level app dirs that contain source files
      4. Excludes: .github/, .vscode/, .husky/, .astro/, empty dirs
    """
    artifacts: set[Path] = set()

    # 1. Directories with package.json
    for pj in scanner.package_json_files:
        parent = pj.parent
        if EXCLUDE_PATH_PATTERNS.search(str(parent)):
            continue
        if parent.name in EXCLUDE_PREFIXES:
            continue
        if parent.name.startswith("."):
            continue
        artifacts.add(parent)

    # 2. Directories with Cargo.toml
    for ct in scanner.cargo_toml_files:
        parent = ct.parent
        if EXCLUDE_PATH_PATTERNS.search(str(parent)):
            continue
        artifacts.add(parent)

    # 3. Top-level directories that have source files directly
    for d in REPO_ROOT.iterdir():
        if not d.is_dir():
            continue
        if d.name in EXCLUDE_PREFIXES:
            continue
        if d.name in EXCLUDE_TOPLEVEL:
            continue
        if d.name.startswith("."):
            continue
        # Check if this dir has source files (directly, not just in subdirs)
        for src_dir in scanner.has_source_in_dir:
            if str(src_dir).startswith(str(d) + "/") or src_dir == d:
                artifacts.add(d)
                break

    # Remove root itself (not a meaningful standalone artifact)
    artifacts.discard(REPO_ROOT)

    # Sort
    result = sorted(artifacts, key=lambda p: str(p))
    return result


# ---------------------------------------------------------------------------
# Scoring logic
# ---------------------------------------------------------------------------

def has_todo_density(src_files: list[Path]) -> tuple[int, int]:
    """Return (todo_count, total_lines) across source files."""
    todos = 0
    lines = 0
    for f in src_files:
        try:
            text = f.read_text(encoding="utf-8", errors="replace")
            lines += sum(1 for line in text.splitlines() if line.strip())
            todos += len(re.findall(r"TODO|FIXME|HACK|XXX|Not implemented", text))
        except Exception:
            pass
    return todos, lines


def count_real_code(src_files: list[Path]) -> int:
    """Count lines of real implementation logic (not types, interfaces, imports, exports, blanks)."""
    total = 0
    for f in src_files:
        try:
            text = f.read_text(encoding="utf-8", errors="replace")
            for line in text.splitlines():
                stripped = line.strip()
                if not stripped:
                    continue
                if stripped.startswith(("//", "#", "/*", "*", "/**")):
                    continue
                if re.match(r"^(import\s|export\s*(type|interface)\s|type\s\w+\s*=|interface\s\w+)", stripped):
                    continue
                total += 1
        except Exception:
            pass
    return total


def find_ancestor_file(path: Path, filename: str) -> Path | None:
    """Walk up from path looking for filename. Returns first match or None."""
    for parent in [path] + list(path.parents):
        candidate = parent / filename
        if candidate.exists():
            return candidate
        if parent == REPO_ROOT:
            break
    return None


def find_ancestor_dir(path: Path, dirname: str) -> Path | None:
    for parent in [path] + list(path.parents):
        candidate = parent / dirname
        if candidate.is_dir():
            return candidate
        if parent == REPO_ROOT:
            break
    return None


def score_code(src_files: list[Path], src_count: int) -> tuple[int, str]:
    """CODE dimension 1-5."""
    real_lines = count_real_code(src_files)
    todo_count, total_lines = has_todo_density(src_files)

    if src_count == 0 and real_lines == 0:
        return 1, "No source files"
    if real_lines < 20:
        return 2, "Minimal implementation"
    if todo_count > 0 and todo_count / max(total_lines, 1) > 0.1:
        return 2, f"High TODO density ({todo_count}/{total_lines})"
    if real_lines < 100:
        return 3, f"{real_lines} lines of real logic"
    if real_lines < 500:
        return 4, f"{real_lines} lines of real logic"
    return 5, f"{real_lines} lines, mature codebase"


def score_test(test_files: list[Path], scanner: RepoScanner, artifact_path: Path) -> tuple[int, str]:
    """TEST dimension 1-5."""
    art_str = str(artifact_path)
    local_test_files = [f for f in test_files if str(f).startswith(art_str)]
    has_tests_dir = (artifact_path / "tests").is_dir()
    total_test_files = len(local_test_files) + (1 if has_tests_dir and not local_test_files else 0)

    if total_test_files == 0:
        return 1, "No test files"

    total_asserts = 0
    total_test_cases = 0
    for tf in local_test_files:
        try:
            text = tf.read_text(encoding="utf-8", errors="replace")
            total_asserts += len(re.findall(r"expect\(|\.toBe|\.toEqual|assert\.", text))
            total_test_cases += len(re.findall(r"\btest\s*\(|\bit\s*\(", text))
        except Exception:
            pass

    has_vitest = find_ancestor_file(artifact_path, "vitest.config.ts")
    has_thresholds = False
    if has_vitest:
        try:
            has_thresholds = "thresholds" in has_vitest.read_text(encoding="utf-8", errors="replace")
        except Exception:
            pass

    has_coverage = (artifact_path / "coverage").is_dir()

    if total_asserts < 5:
        return 2, f"Minimal tests ({total_asserts} assertions)"
    if has_thresholds and total_asserts >= 50:
        return 4, f"Comprehensive tests ({total_asserts} assertions) + vitest thresholds"
    if has_coverage and total_asserts >= 20:
        return 4, f"Tests with coverage tracking ({total_asserts} assertions)"
    if total_asserts >= 20:
        return 3, f"Core paths tested ({total_asserts} assertions)"
    return 3, f"Basic tests ({total_asserts} assertions)"


def score_docs(artifact_path: Path) -> tuple[int, str]:
    """DOCS dimension 1-5."""
    readme = find_ancestor_file(artifact_path, "README.md")

    if not readme:
        return 1, "No README found"

    try:
        text = readme.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return 1, "README unreadable"

    lines = text.splitlines()
    line_count = len(lines)

    if line_count < 5:
        return 2, "README with minimal content"

    has_usage = bool(re.search(r"```|Usage|Example|Install|npm install|pnpm install|yarn add|Getting Started|Quick Start|API", text, re.IGNORECASE))
    has_toc = bool(re.search(r"## Table of Contents|## Features|## Installation|## API", text))
    has_examples = bool(re.search(r"```(ts|js|bash|python|sh)", text))

    if not has_usage:
        return 2, f"README exists ({line_count} lines) but no usage examples"
    if line_count >= 100 and has_examples and has_toc:
        return 5, f"Comprehensive docs ({line_count} lines, examples, TOC)"
    if line_count >= 50 and has_examples:
        return 4, f"Detailed docs ({line_count} lines, examples)"
    if has_usage:
        return 3, f"README with usage ({line_count} lines)"
    return 2, f"README with basic content ({line_count} lines)"


def _has_any_workflow(artifact_path: Path) -> bool:
    """Check if any .github/workflows/ ancestor directory contains .yml files."""
    workflows_dir = find_ancestor_dir(artifact_path, ".github/workflows")
    if not workflows_dir:
        return False
    try:
        return any(workflows_dir.glob("*.yml"))
    except Exception:
        return False


def score_ops(artifact_path: Path) -> tuple[int, str]:
    """OPS dimension 1-5."""
    evidence = []

    has_ci = _has_any_workflow(artifact_path)
    if has_ci:
        evidence.append("CI workflow")

    has_wrangler = bool(find_ancestor_file(artifact_path, "wrangler.toml"))
    has_docker = bool(find_ancestor_file(artifact_path, "Dockerfile"))
    has_deploy_script = bool(find_ancestor_file(artifact_path, "deploy.sh"))

    if has_wrangler:
        evidence.append("wrangler.toml")
    if has_docker:
        evidence.append("Dockerfile")
    if has_deploy_script:
        evidence.append("deploy.sh")

    pkg = find_ancestor_file(artifact_path, "package.json")
    has_build = False
    if pkg:
        try:
            data = json.loads(pkg.read_text(encoding="utf-8", errors="replace"))
            has_build = "build" in data.get("scripts", {})
            if has_build:
                evidence.append("npm build script")
        except Exception:
            pass

    if has_ci and has_wrangler:
        return 4, "CI/CD with wrangler deploy"
    if has_ci and has_docker:
        return 4, "CI/CD with Docker deploy"
    if has_ci:
        return 4, "CI/CD pipeline"
    if has_wrangler:
        return 3, "wrangler deploy"
    if has_docker:
        return 3, "Docker deploy"
    if has_build:
        return 2, "Build script only, manual deploy"
    return 1, "No deploy mechanism"


def score_sec(artifact_path: Path) -> tuple[int, str]:
    """SEC dimension 1-5."""
    evidence = []

    lockfile = find_ancestor_file(artifact_path, "pnpm-lock.yaml")
    if not lockfile:
        lockfile = find_ancestor_file(artifact_path, "package-lock.json")
    if not lockfile:
        lockfile = find_ancestor_file(artifact_path, "yarn.lock")
    has_lockfile = lockfile is not None
    if has_lockfile:
        evidence.append(f"lockfile ({lockfile.name})")

    has_lint = False
    for lint_name in ("eslint.config.mjs", ".eslintrc.js", ".eslintrc.json", ".eslintrc",
                      "ruff.toml", ".golangci.yml"):
        if find_ancestor_file(artifact_path, lint_name):
            has_lint = True
            evidence.append(f"{lint_name}")
            break

    ci_path = find_ancestor_file(artifact_path, ".github/workflows/ci.yml")
    has_sast = False
    if ci_path:
        try:
            ci_text = ci_path.read_text(encoding="utf-8", errors="replace")
            has_sast = "audit" in ci_text.lower() or "scorecard" in ci_text.lower()
        except Exception:
            pass

    if has_sast:
        evidence.append("CI security audit")

    has_dependabot = bool(find_ancestor_dir(artifact_path, ".github/dependabot.yml"))
    if has_dependabot:
        evidence.append("dependabot")

    if has_lockfile and has_lint and has_sast:
        return 4, f"Lockfile + lint + CI security audit"
    if has_lockfile and has_lint:
        return 3, f"Lockfile + lint config ({', '.join(evidence)})"
    if has_lockfile:
        return 2, f"Lockfile present ({', '.join(evidence)})"
    if has_lint:
        return 2, f"Lint config only ({', '.join(evidence)})"
    return 1, "No security evidence"


# ---------------------------------------------------------------------------
# Stage helpers
# ---------------------------------------------------------------------------

def _filter_children(artifact_path: Path, sub_artifact_strs: set[str],
                     file_list: list[Path]) -> list[Path]:
    """Return only files that belong directly to this artifact, not to a child sub-artifact."""
    art_str = str(artifact_path) + "/"
    art_len = len(art_str)
    result = []
    for f in file_list:
        f_str = str(f)
        if not f_str.startswith(art_str):
            continue
        # Only exclude files that belong to a STRICTLY DEEPER sub-artifact
        is_child = False
        for sub in sub_artifact_strs:
            if len(sub) > art_len and f_str.startswith(sub):
                is_child = True
                break
        if not is_child:
            result.append(f)
    return result


def stage_from_overall(overall: int) -> tuple[str, str]:
    mapping = {
        1: ("SEED", "🌱"),
        2: ("SPROUT", "🌿"),
        3: ("SAPLING", "🌳"),
        4: ("BLOOM", "🌸"),
        5: ("FRUIT", "🍎"),
    }
    name, icon = mapping.get(overall, ("UNKNOWN", "❓"))
    return name, icon


STAGE_ORDER = {"SEED": 1, "SPROUT": 2, "SAPLING": 3, "BLOOM": 4, "FRUIT": 5}
STAGE_ICON_MAP = {"SEED": "🌱", "SPROUT": "🌿", "SAPLING": "🌳", "BLOOM": "🌸", "FRUIT": "🍎"}


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def _git_sha() -> str:
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "HEAD"], cwd=REPO_ROOT, stderr=subprocess.DEVNULL, text=True
        ).strip()
    except Exception:
        return "unknown"


def main() -> None:
    t0 = time.time()

    # Phase 0: Load overrides
    print("Loading baseline overrides...", file=sys.stderr)
    baseline_overrides = parse_baseline_overrides()
    json_overrides = load_override_json()
    total_overrides = len(baseline_overrides) + len(json_overrides)
    print(f"  Baseline: {len(baseline_overrides)} overrides, JSON: {len(json_overrides)}", file=sys.stderr)

    # Phase 1: Scan filesystem
    print("Scanning repository...", file=sys.stderr)
    scanner = RepoScanner()
    scanner.scan()
    print(f"  Found {len(scanner.source_files)} source files, {len(scanner.test_files)} test files, "
          f"{len(scanner.readme_files)} READMEs", file=sys.stderr)

    # Phase 2: Discover artifacts
    artifacts = discover_artifacts(scanner)
    print(f"  Discovered {len(artifacts)} artifacts to grade", file=sys.stderr)

    # Phase 3: Score each artifact
    print("Scoring artifacts...", file=sys.stderr)

    # Build sub-artifact index so parent containers don't take credit for children's files
    sub_artifact_strs: set[str] = set()
    for art in artifacts:
        sub_artifact_strs.add(str(art) + "/")

    index_entries: list[dict[str, Any]] = []
    override_count = 0

    for art_path in artifacts:
        art_str = str(art_path)
        relpath = str(art_path.relative_to(REPO_ROOT))
        src_files = _filter_children(art_path, sub_artifact_strs, scanner.source_files)
        test_files = _filter_children(art_path, sub_artifact_strs, scanner.test_files)

        # Auto-grade each dimension
        code_score, code_evidence = score_code(src_files, len(src_files))
        test_score, test_evidence = score_test(test_files, scanner, art_path)
        docs_score, docs_evidence = score_docs(art_path)
        ops_score, ops_evidence = score_ops(art_path)
        sec_score, sec_evidence = score_sec(art_path)

        auto_scores = {
            "CODE": code_score,
            "TEST": test_score,
            "DOCS": docs_score,
            "OPS": ops_score,
            "SEC": sec_score,
        }
        auto_overall = min(auto_scores.values())
        auto_stage_name, auto_stage_icon = stage_from_overall(auto_overall)

        # Check for manual override
        override = match_override(relpath, baseline_overrides, json_overrides)
        if override:
            override_count += 1
            scores = override["scores"]
            overall = override["overall"]
            stage_name = override["stage"].upper()
            stage_icon = STAGE_ICON_MAP.get(stage_name, "❓")
            override_label = "operator baseline"
            # Only mark as override if it actually differs from auto-grade
            if scores == auto_scores:
                override_label = None  # confirmatory override, not transformative
        else:
            scores = auto_scores
            overall = auto_overall
            stage_name = auto_stage_name
            stage_icon = auto_stage_icon
            override_label = None

        weakest = [k for k, v in scores.items() if v == overall]

        entry: dict[str, Any] = {
            "path": relpath,
            "type": "directory",
            "name": art_path.name,
            "stage": stage_name,
            "stage_icon": stage_icon,
            "scores": scores,
            "overall": overall,
            "weakest": weakest,
            "auto_scores": auto_scores,
            "auto_overall": auto_overall,
            "override": override_label,
            "evidence": {
                "CODE": code_evidence,
                "TEST": test_evidence,
                "DOCS": docs_evidence,
                "OPS": ops_evidence,
                "SEC": sec_evidence,
            },
            "source_files": len(src_files),
            "test_files": len(test_files),
        }
        index_entries.append(entry)

    # Phase 4: Sort by stage (worst first), then by path
    index_entries.sort(key=lambda e: (STAGE_ORDER.get(e["stage"], 0), e["path"]))

    # Phase 5: Write grading-index.json
    index_data: dict[str, Any] = {
        "meta": {
            "schema": "PMM_SCHEMA=1.1",
            "generated": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "repo_root": str(REPO_ROOT),
            "git_sha": _git_sha(),
            "total_artifacts": len(index_entries),
            "overrides_applied": override_count,
            "scan_duration_seconds": round(time.time() - t0, 2),
            "baseline_overrides_parsed": len(baseline_overrides),
            "json_overrides_parsed": len(json_overrides),
        },
        "artifacts": index_entries,
    }

    index_path = REPO_ROOT / "grading-index.json"
    index_path.write_text(json.dumps(index_data, indent=2), encoding="utf-8")
    print(f"  Wrote {index_path}", file=sys.stderr)

    # Phase 6: Write GRADING_REPORT.md
    stage_counts: dict[str, int] = defaultdict(int)
    for e in index_entries:
        stage_counts[e["stage"]] += 1

    lines: list[str] = []
    lines.append("# P31 Maturity Model — Repository Grading Report")
    lines.append("")
    lines.append(f"**Generated:** {index_data['meta']['generated']}")
    lines.append(f"**Schema:** {index_data['meta']['schema']}")
    lines.append(f"**Total artifacts graded:** {index_data['meta']['total_artifacts']}")
    lines.append(f"**Overrides applied:** {index_data['meta']['overrides_applied']}")
    lines.append(f"**Scan duration:** {index_data['meta']['scan_duration_seconds']}s")
    lines.append("")
    lines.append("## Summary")
    lines.append("")
    lines.append("| Stage | Count |")
    lines.append("|-------|-------|")
    for s in ["FRUIT", "BLOOM", "SAPLING", "SPROUT", "SEED"]:
        c = stage_counts.get(s, 0)
        lines.append(f"| {STAGE_ICON_MAP.get(s, '')} **{s}** | {c} |")
    lines.append("")
    lines.append("## Full Artifact Index")
    lines.append("")
    lines.append("| Stage | Path | CODE | TEST | DOCS | OPS | SEC | Overall | Weakest | Override |")
    lines.append("|-------|------|------|------|------|-----|-----|---------|---------|----------|")

    for e in index_entries:
        s = e["scores"]
        w = ", ".join(e["weakest"])
        ov = e["override"] or ""
        lines.append(
            f"| {e['stage_icon']} {e['stage']} "
            f"| `{e['path']}` "
            f"| {s['CODE']} | {s['TEST']} | {s['DOCS']} | {s['OPS']} | {s['SEC']} "
            f"| {e['overall']} "
            f"| {w} "
            f"| {ov} |"
        )

    lines.append("")
    lines.append("## Evidence Notes")
    lines.append("")
    lines.append("| Path | CODE | TEST | DOCS | OPS | SEC |")
    lines.append("|------|------|------|------|-----|-----|")
    for e in index_entries:
        ev = e["evidence"]
        lines.append(
            f"| `{e['path']}` "
            f"| {ev['CODE']} | {ev['TEST']} | {ev['DOCS']} "
            f"| {ev['OPS']} | {ev['SEC']} |"
        )

    report_path = REPO_ROOT / "GRADING_REPORT.md"
    report_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"  Wrote {report_path}", file=sys.stderr)

    print(f"Done. {len(index_entries)} artifacts graded in {time.time()-t0:.1f}s "
          f"({override_count} overrides applied)", file=sys.stderr)


if __name__ == "__main__":
    main()
