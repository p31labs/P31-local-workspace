#!/usr/bin/env python3
"""
ASAN Grant Submission Readiness Checker
Verifies that all ASAN Teighlor McGee mini-grant submission requirements
are met and generates a submission checklist.
"""

import json
import sys
from pathlib import Path
from datetime import datetime

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent
GRANT_PIPELINE = WORKSPACE_ROOT / "docs/grants/grant-pipeline-v2.json"
NARRATIVE_FILE = WORKSPACE_ROOT / "docs/grants/payloads/asan-narrative.md"
OPEN_COLLECTIVE_DOC = WORKSPACE_ROOT / "docs/OPEN_COLLECTIVE.md"
IMMEDIATE_ACTIONS = WORKSPACE_ROOT / "docs/IMMEDIATE_ACTIONS.md"

def check_file_exists(path: Path, label: str) -> dict:
    exists = path.exists()
    return {
        "check": label,
        "path": str(path.relative_to(WORKSPACE_ROOT)),
        "status": "PASS" if exists else "FAIL",
        "detail": "Found" if exists else "Missing"
    }

def check_narrative_complete(path: Path) -> dict:
    if not path.exists():
        return {"check": "Narrative complete", "status": "FAIL", "detail": "File missing"}
    text = path.read_text()
    word_count = len(text.split())
    has_amount = "6,250" in text or "6250" in text
    has_project = "PHOS" in text or "Jitterbug" in text
    return {
        "check": "Narrative complete",
        "status": "PASS" if (word_count > 100 and has_amount and has_project) else "FAIL",
        "detail": f"{word_count} words, amount={'yes' if has_amount else 'no'}, project={'yes' if has_project else 'no'}"
    }

def check_grant_pipeline() -> dict:
    if not GRANT_PIPELINE.exists():
        return {"check": "Grant pipeline entry", "status": "FAIL", "detail": "Pipeline file missing"}
    try:
        data = json.loads(GRANT_PIPELINE.read_text())
        for grant in data.get("grants", []):
            if grant.get("id") == "asan-grant":
                return {
                    "check": "Grant pipeline entry",
                    "status": "PASS",
                    "detail": f"Status: {grant.get('status', 'unknown')}, Deadline: {grant.get('deadline', 'unknown')}"
                }
        return {"check": "Grant pipeline entry", "status": "FAIL", "detail": "ASAN entry not found"}
    except json.JSONDecodeError:
        return {"check": "Grant pipeline entry", "status": "FAIL", "detail": "Invalid JSON"}

def main():
    print("ASAN Grant Submission Readiness Check")
    print("=" * 50)
    print(f"Date: {datetime.now().date()}")
    print()

    checks = [
        check_file_exists(NARRATIVE_FILE, "Narrative file"),
        check_narrative_complete(NARRATIVE_FILE),
        check_file_exists(OPEN_COLLECTIVE_DOC, "Fiscal host strategy"),
        check_file_exists(IMMEDIATE_ACTIONS, "Immediate actions doc"),
        check_grant_pipeline(),
    ]

    passed = 0
    failed = 0

    for check in checks:
        status_icon = "PASS" if check["status"] == "PASS" else "FAIL"
        print(f"[{status_icon}] {check['check']}: {check['detail']}")
        if check["status"] == "PASS":
            passed += 1
        else:
            failed += 1

    print()
    print(f"Results: {passed} passed, {failed} failed")

    if failed > 0:
        print("WARNING: Some checks failed. Review items above before submitting.")
        sys.exit(1)
    else:
        print("All checks passed. ASAN grant package is ready for submission.")
        sys.exit(0)

if __name__ == "__main__":
    main()
