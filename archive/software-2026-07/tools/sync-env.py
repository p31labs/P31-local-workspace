#!/usr/bin/env python3
"""
P31 Andromeda — env sync tool
Reads .env.canonical from repo root, propagates CONSTANTS section
to all .env files found in the monorepo.

Usage:
  python sync-env.py           # audit: show what's missing where
  python sync-env.py --fix     # append missing constants to each .env
  python sync-env.py --fix --target software/discord/p31-bot/.env
"""

import argparse
import os
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
CANONICAL = REPO_ROOT / ".env.canonical"

SKIP_DIRS = {
    "node_modules", ".git", "dist", "build", ".cache",
    "__pycache__", ".venv", "venv", "esp-idf-v5.5.3",
    "managed_components",
}

# ── Parse canonical ──────────────────────────────────────────────────────────

def parse_canonical(path: Path) -> dict[str, str]:
    """Extract CONSTANTS section: lines with key=value (non-empty value, not a TODO)."""
    constants: dict[str, str] = {}
    in_constants = False
    sep_count = 0  # count # === separator lines seen while in_constants

    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()

        # Detect section 2 start
        if "2. CONSTANTS" in stripped:
            in_constants = True
            sep_count = 0
            continue

        if not in_constants:
            continue

        # Count separator lines; the 2nd one inside a section signals next section
        if stripped.startswith("# ==="):
            sep_count += 1
            if sep_count >= 2:
                break
            continue

        # Skip comments and blank lines
        if not stripped or stripped.startswith("#"):
            continue

        # key=value (strip inline comments)
        if "=" in stripped:
            key, _, rest = stripped.partition("=")
            key = key.strip()
            value = rest.split("#")[0].strip()  # strip inline comment
            if key and value and "TODO" not in value:
                constants[key] = value

    return constants


def parse_env_keys(path: Path) -> set[str]:
    """Return the set of variable names defined in an .env file."""
    keys: set[str] = set()
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if "=" in stripped:
            key = stripped.split("=", 1)[0].strip()
            if key:
                keys.add(key)
    return keys


# ── Discover .env files ───────────────────────────────────────────────────────

def find_env_files(root: Path) -> list[Path]:
    results: list[Path] = []
    for dirpath, dirnames, filenames in os.walk(root):
        # Prune skip dirs in-place
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in filenames:
            if name == ".env" or re.match(r"^\.env\.[a-zA-Z0-9_-]+$", name):
                p = Path(dirpath) / name
                # Skip the canonical itself
                if p.resolve() != CANONICAL.resolve():
                    results.append(p)
    return sorted(results)


# ── Reporting ─────────────────────────────────────────────────────────────────

def rel(path: Path) -> str:
    try:
        return str(path.relative_to(REPO_ROOT))
    except ValueError:
        return str(path)


def audit(env_files: list[Path], constants: dict[str, str]) -> dict[Path, list[str]]:
    """Return map of file -> list of missing constant keys."""
    missing: dict[Path, list[str]] = {}
    for f in env_files:
        try:
            existing = parse_env_keys(f)
        except Exception as e:
            print(f"  [WARN] Could not read {rel(f)}: {e}", file=sys.stderr)
            continue
        absent = [k for k in constants if k not in existing]
        if absent:
            missing[f] = absent
    return missing


# ── Fix ───────────────────────────────────────────────────────────────────────

def fix(env_file: Path, missing_keys: list[str], constants: dict[str, str]) -> int:
    """Append missing constants to env_file. Returns count added."""
    lines = [
        "",
        "# --- Auto-synced from .env.canonical CONSTANTS ---",
    ]
    for key in missing_keys:
        lines.append(f"{key}={constants[key]}")

    with env_file.open("a", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    return len(missing_keys)


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Sync .env.canonical CONSTANTS to repo .env files")
    parser.add_argument("--fix", action="store_true", help="Append missing constants to each .env")
    parser.add_argument("--target", metavar="PATH", help="Only operate on this specific .env file")
    args = parser.parse_args()

    if not CANONICAL.exists():
        print(f"ERROR: {CANONICAL} not found", file=sys.stderr)
        sys.exit(1)

    constants = parse_canonical(CANONICAL)
    if not constants:
        print("ERROR: No constants parsed from .env.canonical — check section 2 format", file=sys.stderr)
        sys.exit(1)

    print(f"Canonical constants ({len(constants)}):")
    for k, v in constants.items():
        print(f"  {k}={v}")
    print()

    if args.target:
        env_files = [Path(args.target).resolve()]
    else:
        env_files = find_env_files(REPO_ROOT)

    print(f"Scanning {len(env_files)} .env file(s)...\n")

    missing = audit(env_files, constants)

    if not missing:
        print("All .env files already have all constants. Nothing to do.")
        return

    total_missing = sum(len(v) for v in missing.values())
    print(f"Missing constants across {len(missing)} file(s) — {total_missing} total:\n")

    for f, keys in missing.items():
        print(f"  {rel(f)}")
        for k in keys:
            print(f"    - {k}={constants[k]}")
        print()

    if args.fix:
        print("Applying fixes...")
        for f, keys in missing.items():
            count = fix(f, keys, constants)
            print(f"  {rel(f)}: +{count} constants appended")
        print(f"\nDone. {total_missing} constants synced.")
    else:
        print(f"Run with --fix to append {total_missing} missing constants.")


if __name__ == "__main__":
    main()
