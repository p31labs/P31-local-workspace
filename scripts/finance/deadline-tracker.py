#!/usr/bin/env python3
"""
Critical Deadline Tracker
Checks remaining time on critical P31 Labs deadlines and emits
a status report with escalation warnings.
Focuses on items with clear ownership and immediate relevance.
"""

import json
import sys
from pathlib import Path
from datetime import datetime, date

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent
IMMEDIATE_ACTIONS = WORKSPACE_ROOT / "docs/IMMEDIATE_ACTIONS.md"

# Critical items with explicit ownership and near-term deadlines
CRITICAL_DEADLINES = [
    {
        "id": "ga-annual-registration",
        "name": "Georgia Annual Registration",
        "deadline": date(2026, 7, 2),
        "owner": "William R. Johnson",
        "automation": "scripts/finance/ga-annual-registration.sh",
        "description": "File annual registration to maintain corporate good standing"
    },
    {
        "id": "mortgage-forbearance",
        "name": "Mortgage Forbearance Call",
        "deadline": date(2026, 6, 30),
        "owner": "William R. Johnson",
        "automation": "scripts/finance/mortgage-forbearance.sh",
        "description": "Request forbearance extension pending FERS stream activation"
    },
    {
        "id": "cs-s-application",
        "name": "CS&S Fiscal Host Application",
        "deadline": date(2026, 6, 23),
        "owner": "William R. Johnson",
        "automation": "scripts/finance/cs-s-application.sh",
        "description": "Apply for fiscal sponsorship to unlock tax-deductible donations"
    },
    {
        "id": "asan-verification",
        "name": "ASAN Grant Submission Verification",
        "deadline": date(2026, 6, 25),
        "owner": "William R. Johnson",
        "automation": "scripts/grants/asan-readiness-check.py",
        "description": "Confirm ASAN grant submission status (narrative ready)"
    },
]

def load_immediate_actions_deadlines():
    """Extract time-bound items from IMMEDIATE_ACTIONS.md"""
    if not IMMEDIATE_ACTIONS.exists():
        return []
    
    try:
        content = IMMEDIATE_ACTIONS.read_text()
        deadlines = []
        
        # Extract from quick reference table
        lines = content.split('\n')
        in_table = False
        for line in lines:
            if '| Task | Deadline | Status | Action |' in line:
                in_table = True
                continue
            if in_table and line.startswith('|----'):
                continue
            if in_table and line.startswith('|'):
                if 'Summary' in line:
                    break
                parts = [p.strip() for p in line.split('|')[1:-1]]
                if len(parts) >= 4:
                    task, deadline_str, status, action = parts
                    if deadline_str and deadline_str != 'Deadline' and '⏳' not in deadline_str:
                        # Parse date like "July 2" or "June 30"
                        try:
                            # Handle "July 2, 2026" format
                            if ',' in deadline_str:
                                dt = datetime.strptime(deadline_str.strip(), "%B %d, %Y")
                            else:
                                # Assume current year for month/day only
                                dt = datetime.strptime(f"{deadline_str} 2026", "%B %d %Y")
                            deadlines.append({
                                "id": task.lower().replace(' ', '-').replace('/', '-'),
                                "name": task,
                                "deadline": dt.date(),
                                "owner": "William R. Johnson",  # Default owner
                                "description": action.strip(),
                                "automation": None
                            })
                        except Exception:
                            pass  # Skip unparseable dates
            elif in_table and not line.startswith('|'):
                in_table = False
                
        return deadlines
    except Exception:
        return []

def days_remaining(d: date) -> int:
    return (d - datetime.now().date()).days

def main():
    today = datetime.now().date()
    print(f"Critical Deadline Tracker — {today}")
    print("=" * 60)
    print()

    all_deadlines = CRITICAL_DEADLINES + load_immediate_actions_deadlines()
    # Remove duplicates by id, keeping the first occurrence
    seen = set()
    unique_deadlines = []
    for d in all_deadlines:
        if d["id"] not in seen:
            seen.add(d["id"])
            unique_deadlines.append(d)
    all_deadlines = sorted(unique_deadlines, key=lambda x: x["deadline"])

    overdue = []
    due_soon = []
    upcoming = []

    for item in all_deadlines:
        remaining = days_remaining(item["deadline"])
        status = {
            "id": item["id"],
            "name": item["name"],
            "deadline": str(item["deadline"]),
            "remaining": remaining,
            "owner": item["owner"],
            "description": item["description"],
            "automation": item.get("automation"),
        }

        if remaining < 0:
            status["urgency"] = "OVERDUE"
            overdue.append(status)
        elif remaining <= 3:  # Critical within 3 days
            status["urgency"] = "CRITICAL"
            due_soon.append(status)
        else:
            status["urgency"] = "UPCOMING"
            upcoming.append(status)

    if overdue:
        print("OVERDUE:")
        for s in overdue:
            print(f"  [OVERDUE] {s['name']} (was {s['deadline']}, {abs(s['remaining'])} days ago)")
            print(f"           Owner: {s['owner']}")
            print(f"           Description: {s['description']}")
            if s["automation"]:
                print(f"           Automation: {s['automation']}")
            print()

    if due_soon:
        print("CRITICAL (within 3 days):")
        for s in due_soon:
            print(f"  [CRITICAL] {s['name']} ({s['deadline']}, {s['remaining']} days left)")
            print(f"           Owner: {s['owner']}")
            print(f"           Description: {s['description']}")
            if s["automation"]:
                print(f"           Automation: {s['automation']}")
        print()

    if upcoming:
        print("UPCOMING:")
        for s in upcoming:
            print(f"  [UPCOMING] {s['name']} ({s['deadline']}, {s['remaining']} days left)")
            print(f"           Owner: {s['owner']}")
            print(f"           Description: {s['description']}")
            if s["automation"]:
                print(f"           Automation: {s['automation']}")
        print()

    total = len(overdue) + len(due_soon) + len(upcoming)
    print(f"Summary: {len(overdue)} overdue, {len(due_soon)} critical, {len(upcoming)} upcoming ({total} total)")

    # Return non-zero if overdue or critical items exist
    if overdue or due_soon:
        sys.exit(1)
    sys.exit(0)

if __name__ == "__main__":
    main()
