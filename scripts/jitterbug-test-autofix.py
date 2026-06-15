#!/usr/bin/env python3
"""
Test Auto-Fix Loop — verifier → compiler error → patch → re-verify.
For each failing accelerate.test.* file, attempts to fix by:
  1. Trying alternative import paths
  2. Calling Ollama 1.5B to fix syntax/type errors
  3. Re-verifying up to MAX_ATTEMPTS times

Usage:
  python3 scripts/jitterbug-test-autofix.py
  python3 scripts/jitterbug-test-autofix.py --branch accelerate/seed-sweep-flow5
"""

import json
import os
import re
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

REPO_ROOT = Path("/home/p31/andromeda").resolve()
OLLAMA_URL = "http://localhost:11434/api/generate"
LLM_MODEL = "qwen2.5:1.5b"
MAX_ATTEMPTS = 3

FIX_LOG: list[str] = []


def _ollama_fix(test_content: str, error_text: str) -> str | None:
    """Send failing test + compiler error to Ollama for a fix."""
    prompt = f"""The following test file has a compilation error. Fix it and output ONLY the corrected code, no explanation.

TEST:
```typescript
{test_content[:2000]}
```

ERROR:
{error_text[:500]}

CORRECTED TEST:"""

    payload = json.dumps({
        "model": LLM_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.2, "num_predict": 600},
    }).encode()

    try:
        req = urllib.request.Request(
            OLLAMA_URL, data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=180) as resp:
            result = json.loads(resp.read().decode())
            raw = result.get("response", "").strip()
            # Strip markdown fences if present
            cleaned = re.sub(r"^```[\w]*\n", "", raw, flags=re.MULTILINE)
            cleaned = re.sub(r"\n```$", "", cleaned)
            cleaned = cleaned.strip()
            if len(cleaned) > 30:
                return cleaned
    except Exception as e:
        print(f"    Ollama error: {e}", file=sys.stderr)
    return None


def _try_compile(file_path: Path) -> tuple[bool, str]:
    """Compile a .ts file with tsc or syntax-check a .mjs file. Returns (pass, error_msg)."""
    ext = file_path.suffix
    if ext == ".ts":
        cmd = [
            "npx", "--yes", "tsc", "--noEmit",
            "--strict", "false",
            "--skipLibCheck",
            "--module", "esnext",
            "--target", "esnext",
            "--moduleResolution", "node",
            "--esModuleInterop",
            str(file_path),
        ]
    elif ext == ".mjs":
        cmd = ["node", "--check", str(file_path)]
    else:
        return False, f"Unknown extension: {ext}"

    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=30,
            cwd=REPO_ROOT,
        )
        if result.returncode == 0:
            return True, ""
        return False, result.stderr[:500] or result.stdout[:500]
    except subprocess.TimeoutExpired:
        return False, "timeout"
    except FileNotFoundError as e:
        return False, str(e)


def _fix_import_path(content: str, error: str) -> str | None:
    """Try to fix 'Cannot find module' errors by adjusting import paths."""
    # Extract the failing import path from error
    match = re.search(r"Cannot find module '([^']+)'", error)
    if not match:
        return None

    bad_path = match.group(1)
    # Try common alternatives
    alternatives = []

    if bad_path.startswith("../"):
        # One level up → two levels up, or just ./src/
        alternatives.append(bad_path.replace("../", "../../", 1))
        alternatives.append(bad_path.replace("../", "./"))
    elif bad_path.startswith("./"):
        alternatives.append(bad_path.replace("./", "../", 1))
        alternatives.append(bad_path.replace("./", "../../", 1))

    # Try removing extension
    if bad_path.endswith(".js"):
        alternatives.append(bad_path[:-3])
    if not bad_path.endswith(".js"):
        alternatives.append(bad_path + ".js")
    if not bad_path.endswith(".ts"):
        alternatives.append(bad_path + ".ts")

    for alt in alternatives:
        fixed = content.replace(bad_path, alt)
        # Quick syntax check via temp file
        if fixed != content:
            return fixed
    return None


def _verify_and_fix(file_path: Path) -> tuple[bool, int]:
    """Verify a test file, attempt fixes up to MAX_ATTEMPTS. Returns (passed, attempts_used)."""
    global FIX_LOG
    print(f"  Verifying: {file_path.relative_to(REPO_ROOT)}", file=sys.stderr)

    for attempt in range(1, MAX_ATTEMPTS + 1):
        passed, error = _try_compile(file_path)
        if passed:
            print(f"    ✓ Passed (attempt {attempt})", file=sys.stderr)
            return True, attempt

        print(f"    ✗ Failed (attempt {attempt})", file=sys.stderr)
        FIX_LOG.append(f"  {file_path.relative_to(REPO_ROOT)} (attempt {attempt}): {error[:80]}")

        if attempt >= MAX_ATTEMPTS:
            break

        # Read current content
        try:
            content = file_path.read_text(encoding="utf-8", errors="replace")
        except Exception as e:
            print(f"    Read error: {e}", file=sys.stderr)
            break

        # Strategy 1: Fix import path
        fixed = _fix_import_path(content, error)
        if fixed and fixed != content:
            file_path.write_text(fixed, encoding="utf-8")
            print(f"    → Fixed import path, re-verifying...", file=sys.stderr)
            continue

        # Strategy 2: Ollama fix
        print(f"    → Calling Ollama for fix...", file=sys.stderr)
        llm_fixed = _ollama_fix(content, error)
        if llm_fixed and llm_fixed != content and len(llm_fixed) > 30:
            file_path.write_text(llm_fixed, encoding="utf-8")
            print(f"    → Ollama fixed, re-verifying...", file=sys.stderr)
            continue

        # No more strategies
        break

    return False, MAX_ATTEMPTS


def _checkout_branch(branch: str | None) -> bool:
    """Checkout the target branch, return True if successful."""
    if not branch:
        return True  # Already on correct branch
    try:
        # Stash any changes first
        subprocess.run(["git", "stash"], cwd=REPO_ROOT, capture_output=True, timeout=10)
        result = subprocess.run(
            ["git", "checkout", branch],
            cwd=REPO_ROOT, capture_output=True, text=True, timeout=10,
        )
        if result.returncode != 0:
            print(f"  ERROR: Could not checkout '{branch}': {result.stderr.strip()}", file=sys.stderr)
            return False
        print(f"  Checked out: {branch}", file=sys.stderr)
        return True
    except Exception as e:
        print(f"  Git error: {e}", file=sys.stderr)
        return False


def _switch_back():
    """Return to main."""
    try:
        subprocess.run(["git", "checkout", "main"], cwd=REPO_ROOT, capture_output=True, timeout=10)
        subprocess.run(["git", "stash", "pop"], cwd=REPO_ROOT, capture_output=True, timeout=10)
    except Exception:
        pass


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Auto-fix failing accelerate tests")
    parser.add_argument("--branch", default=None, help="Branch to verify (default: current)")
    parser.add_argument("--file", default=None, help="Single test file to fix (default: all)")
    args = parser.parse_args()

    t0 = time.time()
    print("Jitterbug Test Auto-Fix Loop", file=sys.stderr)
    print(f"  Model: {LLM_MODEL}", file=sys.stderr)
    print(f"  Max attempts per file: {MAX_ATTEMPTS}", file=sys.stderr)

    # Checkout target branch if specified
    if args.branch:
        if not _checkout_branch(args.branch):
            sys.exit(1)

    # Find test files
    if args.file:
        files = [Path(args.file)]
    else:
        pattern = "**/accelerate.test.*"
        files = sorted(REPO_ROOT.glob(pattern))
        files = [f for f in files if "node_modules" not in f.parts and ".git" not in f.parts]

    if not files:
        print("  No accelerate test files found.", file=sys.stderr)
        _switch_back()
        return

    print(f"  Found {len(files)} test files", file=sys.stderr)
    print(file=sys.stderr)

    results = []
    for f in files:
        passed, attempts = _verify_and_fix(f)
        results.append((f, passed, attempts))

    # Summary
    passed_count = sum(1 for _, p, _ in results if p)
    failed_count = len(results) - passed_count
    total_attempts = sum(a for _, _, a in results)
    duration = time.time() - t0

    print(file=sys.stderr)
    print("=== Auto-Fix Results ===", file=sys.stderr)
    print(f"  Duration: {duration:.1f}s", file=sys.stderr)
    print(f"  Total files: {len(results)}", file=sys.stderr)
    print(f"  Passed: {passed_count}", file=sys.stderr)
    print(f"  Failed: {failed_count}", file=sys.stderr)
    print(f"  Total attempts: {total_attempts}", file=sys.stderr)
    print(file=sys.stderr)

    if FIX_LOG:
        print("  Fix log:", file=sys.stderr)
        for entry in FIX_LOG:
            print(f"    {entry}", file=sys.stderr)
        print(file=sys.stderr)

    if failed_count > 0:
        print("  Failed files:", file=sys.stderr)
        for f, p, _ in results:
            if not p:
                print(f"    ✗ {f.relative_to(REPO_ROOT)}", file=sys.stderr)

    # Switch back to main
    _switch_back()

    if failed_count > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
