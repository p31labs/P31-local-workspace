#!/usr/bin/env python3
"""
Autonomous Macrophage — AI-powered immune response for depressed artifacts.
When the jitterbug flags an artifact as depressed, the macrophage:
1. Reads the source code
2. Sends it to the local LLM (qwen2.5-coder or fallback)
3. Generates a test file targeting the core module
4. Writes the test and opens a git branch for review

Usage:
  python3 scripts/macrophage.py <artifact-path>
  python3 scripts/macrophage.py --auto   # pick first depressed artifact from index

PMM_JITTERBUG=1.0
"""

import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

REPO_ROOT = Path("/home/p31/andromeda").resolve()
INDEX_PATH = REPO_ROOT / "grading-index.json"
REPORT_PATH = REPO_ROOT / "GRADING_REPORT.md"
OLLAMA_URL = "http://localhost:11434/api/generate"
LLM_MODEL = "qwen2.5:1.5b"
LLM_FALLBACK = None  # No fallback — 7B causes OOM on this hardware

# How many characters to send as context (1.5B has limited context)
MAX_INPUT_CHARS = 3000


def _ollama_generate(prompt: str) -> str | None:
    """Send a prompt to Ollama (1.5B CPU model). Returns response text or None."""
    import urllib.request
    import urllib.error

    payload = json.dumps({
        "model": LLM_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.3, "num_predict": 300},
    }).encode()
    try:
        req = urllib.request.Request(
            OLLAMA_URL,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=180) as resp:
            result = json.loads(resp.read().decode())
            return result.get("response", "").strip()
    except Exception as e:
        print(f"  Ollama error: {e}", file=sys.stderr)
        return None


def _detect_test_framework(artifact_path: Path) -> tuple[str, str, str]:
    """Return (framework, extension, import_lines) for the artifact.
    
    Returns (vitest|node-test, .test.ts|.test.mjs, import_block).
    """
    # Check existing test files
    existing = list((artifact_path / "test").glob("*.test.*")) + list((artifact_path / "tests").glob("*.test.*"))
    for f in existing:
        text = f.read_text(encoding="utf-8", errors="replace")
        if "from 'vitest'" in text or 'from "vitest"' in text:
            return ("vitest", ".test.ts",
                    "import { describe, it, expect } from 'vitest';\n")
        if "from 'node:test'" in text or 'from "node:test"' in text:
            return ("node-test", ".test.mjs",
                    "import { describe, it } from 'node:test';\nimport assert from 'node:assert/strict';\n")

    # Check package entry points
    pkg_json = artifact_path / "package.json"
    if pkg_json.exists():
        try:
            data = json.loads(pkg_json.read_text(encoding="utf-8"))
            scripts = data.get("scripts", {})
            test_cmd = scripts.get("test", "")
            if "vitest" in test_cmd or data.get("type") != "module":
                return ("vitest", ".test.ts",
                        "import { describe, it, expect } from 'vitest';\n")
            if "node --test" in test_cmd:
                return ("node-test", ".test.mjs",
                        "import { describe, it } from 'node:test';\nimport assert from 'node:assert/strict';\n")
        except Exception:
            pass

    # Default based on module type
    if pkg_json.exists():
        try:
            data = json.loads(pkg_json.read_text(encoding="utf-8"))
            if data.get("type") == "module":
                return ("node-test", ".test.mjs",
                        "import { describe, it } from 'node:test';\nimport assert from 'node:assert/strict';\n")
        except Exception:
            pass
    return ("vitest", ".test.ts",
            "import { describe, it, expect } from 'vitest';\n")


def _find_main_source(artifact_path: Path) -> list[Path]:
    """Find the most important source files to send to the LLM."""
    candidates = []
    for pattern in ("index.ts", "index.js", "index.mjs", "main.ts", "main.js", "src/index.ts", "src/index.js", "src/index.mjs"):
        f = artifact_path / pattern
        if f.exists():
            candidates.append(f)

    if not candidates:
        # Grab the largest non-test .ts/.js file
        all_files = sorted(artifact_path.rglob("*"), key=lambda p: p.stat().st_size if p.is_file() else 0, reverse=True)
        for f in all_files:
            if f.suffix in (".ts", ".js", ".mjs") and ".test." not in f.name and f.is_file():
                candidates.append(f)
                if len(candidates) >= 3:
                    break

    return candidates[:3]


def _truncate_source(source: str, max_chars: int = 2500) -> str:
    """Truncate source code for 1.5B context window."""
    if len(source) <= max_chars:
        return source
    # Keep the head (imports + exports) and first function body
    lines = source.splitlines()
    selected = []
    char_count = 0
    for line in lines:
        char_count += len(line) + 1
        if char_count > max_chars:
            selected.append(f"// ... [truncated {len(source) - char_count} more chars]")
            break
        selected.append(line)
    return "\n".join(selected)


def _generate_test(module_name: str, source_code: str, framework: str) -> str | None:
    """Call Ollama (1.5B) to generate a test suite."""
    source_code = _truncate_source(source_code, MAX_INPUT_CHARS)
    prompt = f"""Generate tests for this module ({framework}). At least 5 assertions, realistic data. Only output the test bodies inside describe/it blocks, no imports.

Module:
{source_code}

Tests:
describe('{module_name}', () => {{"""

    response = _ollama_generate(prompt)
    if response and len(response) > 30:
        return response
    return None


def _clean_generated_test(raw: str, framework: str, module_import: str) -> str:
    """Strip markdown fences, inject correct imports, keep only test code."""
    # Remove markdown code fences
    cleaned = re.sub(r"^```[\w]*\n", "", raw, flags=re.MULTILINE)
    cleaned = re.sub(r"\n```$", "", cleaned)
    cleaned = cleaned.strip()

    # Remove any trailing LLM explanation
    lines = cleaned.splitlines()
    code_lines = []
    for line in lines:
        if line.startswith(("Here", "This test", "The test", "Note:", "I've", "I have", "Let me")):
            if len(code_lines) > 5:
                break
            continue
        code_lines.append(line)
    cleaned = "\n".join(code_lines)

    # Strip any import lines the LLM generated — we inject our own
    cleaned = re.sub(r"^import .*$", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"^const .* = require\(.*$", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)  # collapse excess blank lines

    # Prepend correct imports
    if framework == "node-test":
        header = "import { describe, it, beforeEach } from 'node:test';\nimport assert from 'node:assert/strict';\n"
    else:
        header = "import { describe, it, expect, beforeEach } from 'vitest';\n"
    header += module_import + "\n"

    return header.strip() + "\n\n" + cleaned.strip()


def _write_test_and_branch(artifact_path: Path, artifact_name: str,
                            test_content: str, framewk: str, ext: str,
                            module_import_path: str) -> bool:
    """Write the test file, create a branch, and commit. Returns True on success."""
    # Determine test directory
    test_dir = artifact_path / "test" if (artifact_path / "test").exists() else artifact_path / "tests"
    if not test_dir.exists():
        test_dir = artifact_path / "tests"
        test_dir.mkdir(exist_ok=True)

    test_path = test_dir / f"auto-macrophage{ext}"
    test_path.write_text(test_content, encoding="utf-8")
    print(f"  Wrote {test_path}", file=sys.stderr)

    # Create git branch
    branch_name = f"auto-heal/{artifact_name}"
    try:
        subprocess.run(["git", "checkout", "-b", branch_name],
                       cwd=REPO_ROOT, capture_output=True, timeout=10)
    except Exception:
        # Branch may already exist, try switching
        try:
            subprocess.run(["git", "checkout", branch_name],
                           cwd=REPO_ROOT, capture_output=True, timeout=10)
        except Exception:
            pass

    # Stage and commit
    try:
        subprocess.run(["git", "add", str(test_path)],
                       cwd=REPO_ROOT, capture_output=True, timeout=10)
        subprocess.run(
            ["git", "commit", "-m", f"feat: auto-heal tests for {artifact_name} [macrophage]"],
            cwd=REPO_ROOT, capture_output=True, timeout=10,
        )
        print(f"  Committed on branch: {branch_name}", file=sys.stderr)
        return True
    except Exception as e:
        print(f"  Git error: {e}", file=sys.stderr)
        return False


def heal(artifact_path: str) -> dict[str, Any]:
    """Main healing function. Returns a result dict."""
    start = time.time()
    art = Path(artifact_path)
    if not art.exists() or not art.is_dir():
        return {"status": "error", "message": f"Path not found: {artifact_path}"}

    artifact_name = art.name
    print(f"\nMacrophage targeting: {artifact_name}", file=sys.stderr)
    print(f"  Path: {artifact_path}", file=sys.stderr)

    # Detect test framework
    framework, ext, imports = _detect_test_framework(art)
    print(f"  Framework: {framework}", file=sys.stderr)

    # Find main source
    sources = _find_main_source(art)
    if not sources:
        return {"status": "skipped", "message": "No source files found"}

    print(f"  Source files: {[s.name for s in sources]}", file=sys.stderr)

    # Determine test directory
    test_dir = art / "test" if (art / "test").exists() else art / "tests"
    if not test_dir.exists():
        test_dir = art / "tests"

    # Generate tests for each source
    generated_any = False
    for src_file in sources:
        source_text = src_file.read_text(encoding="utf-8", errors="replace")
        source_text = _truncate_source(source_text, MAX_INPUT_CHARS)

        module_name = src_file.stem
        print(f"  Generating tests for {module_name}...", file=sys.stderr)

        # Build module import path relative to test dir
        try:
            module_rel = os.path.relpath(str(src_file), str(test_dir))
            if not module_rel.startswith("."):
                module_rel = "./" + module_rel
            module_rel = module_rel.replace(".ts", ".js").replace(".mjs", ".js")
        except Exception:
            module_rel = f"../{src_file.stem}.js"
        safe_name = module_name.replace("-", "_").replace(".", "_")
        module_import = f"import * as {safe_name} from '{module_rel}';"

        test_content = _generate_test(module_name, source_text, framework)
        if test_content:
            test_content = _clean_generated_test(test_content, framework, module_import)

            success = _write_test_and_branch(art, artifact_name, test_content, framework, ext,
                                             module_import)
            if success:
                generated_any = True
            break  # Only generate for the first source file
        else:
            print(f"  LLM returned empty response for {module_name}", file=sys.stderr)

    if generated_any:
        duration = time.time() - start
        return {
            "status": "healed",
            "artifact": artifact_name,
            "path": artifact_path,
            "framework": framework,
            "duration_seconds": round(duration, 2),
        }
    else:
        return {"status": "failed", "message": "LLM could not generate tests", "artifact": artifact_name}


def _auto_detect_depressed() -> str | None:
    """Read grading-index.json and return the first depressed artifact path."""
    if not INDEX_PATH.exists():
        print("  grading-index.json not found", file=sys.stderr)
        return None
    data = json.loads(INDEX_PATH.read_text(encoding="utf-8"))
    for a in data["artifacts"]:
        if a.get("depressed"):
            path = a["path"]
            full_path = REPO_ROOT / path
            if full_path.exists():
                return str(full_path)
    print("  No depressed artifacts found", file=sys.stderr)
    return None


def _append_report(result: dict[str, Any]) -> None:
    """Append macrophage activity to the grading report."""
    if not result:
        return
    lines = [
        "",
        "---",
        "",
        "### Macrophage Activity",
        "",
    ]
    if result.get("status") == "healed":
        lines.append(f"- 🩹 **Healed:** `{result['path']}` — generated {result.get('framework', '?')} tests in {result.get('duration_seconds', 0)}s")
    elif result.get("status") == "skipped":
        lines.append(f"- ⏭️ **Skipped:** `{result['path']}` — {result.get('message', '')}")
    elif result.get("status") == "failed":
        lines.append(f"- ❌ **Failed:** `{result.get('artifact', '?')}` — {result.get('message', '')}")
    lines.append("")

    if REPORT_PATH.exists():
        existing = REPORT_PATH.read_text(encoding="utf-8")
        REPORT_PATH.write_text(existing + "\n" + "\n".join(lines), encoding="utf-8")
        print(f"  Updated {REPORT_PATH}", file=sys.stderr)


def main() -> None:
    if len(sys.argv) < 2 or sys.argv[1] in ("-h", "--help"):
        print("Usage: python3 scripts/macrophage.py <artifact-path>", file=sys.stderr)
        print("       python3 scripts/macrophage.py --auto", file=sys.stderr)
        sys.exit(1)

    if sys.argv[1] == "--auto":
        target = _auto_detect_depressed()
        if not target:
            sys.exit(0)
    else:
        target = sys.argv[1]

    result = heal(target)
    print(f"  Result: {result.get('status', 'unknown')}", file=sys.stderr)

    _append_report(result)

    if result.get("status") == "healed":
        print(f"  Branch: auto-heal/{Path(target).name}", file=sys.stderr)
        print(f"  To review: git checkout auto-heal/{Path(target).name}", file=sys.stderr)
    elif result.get("status") == "failed":
        sys.exit(1)


if __name__ == "__main__":
    main()
