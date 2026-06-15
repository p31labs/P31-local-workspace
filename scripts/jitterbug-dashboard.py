#!/usr/bin/env python3
"""
P31 Jitterbug Live Dashboard — real-time terminal TUI.
Reads grading-index.json every 2s and renders distribution,
scores, signals, entanglement, and next cron tick.
Supports drill-down: press 1-5 to list artifacts in a stage.

Usage:
  p31-dash
  (Ctrl+C to quit)
"""

import curses
import json
import math
import sys
import time
from collections import Counter
from datetime import datetime, timedelta
from pathlib import Path

REPO_ROOT = Path("/home/p31/andromeda").resolve()
INDEX_PATH = REPO_ROOT / "grading-index.json"
SPOON_PATH = REPO_ROOT / "spoon-state.json"
REPORT_PATH = REPO_ROOT / "GRADING_REPORT.md"

SPOON_COLORS = {5: 1, 4: 2, 3: 3, 2: 4, 1: 5, 0: 6}
SPOON_LABELS = {5: "Flow", 4: "Focus", 3: "Steady", 2: "Low", 1: "Depleted", 0: "Gray Rock"}
STAGE_ORDER = ["FRUIT", "BLOOM", "SAPLING", "SPROUT", "SEED"]
STAGE_ICONS = {"FRUIT": "🍎", "BLOOM": "🌸", "SAPLING": "🌳", "SPROUT": "🌿", "SEED": "🌱"}
STAGE_COLORS = {"FRUIT": 2, "BLOOM": 1, "SAPLING": 3, "SPROUT": 4, "SEED": 6}
DIMS = ["CODE", "TEST", "DOCS", "OPS", "SEC"]
FOCUS_STAGES = {ord("1"): "FRUIT", ord("2"): "BLOOM", ord("3"): "SAPLING", ord("4"): "SPROUT", ord("5"): "SEED"}


def _load(path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def _next_cron_str() -> str:
    now = datetime.now()
    next_h = ((now.hour // 6) + 1) * 6
    if next_h >= 24:
        next_h = 0
        target = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
    else:
        target = now.replace(hour=next_h, minute=0, second=0, microsecond=0)
    delta = target - now
    h = int(delta.total_seconds() // 3600)
    m = int((delta.total_seconds() % 3600) // 60)
    return f"{h}h {m:02d}m"


def _render_overview(stdscr, data, mid, w, frame):
    """Render the main overview screen."""
    h, _ = stdscr.getmaxyx()
    meta = data.get("meta", {})
    spoon = _load(SPOON_PATH)
    spoon_level = int(spoon.get("level", 4)) if spoon else 4
    counts = Counter(a["stage"] for a in data["artifacts"])
    total = len(data["artifacts"])

    sp_clr = SPOON_COLORS.get(spoon_level, 6)
    sp_lbl = SPOON_LABELS.get(spoon_level, "?")
    depressed = meta.get("depressed_artifacts", 0)
    tick = meta.get("jitterbug_tick", "?")
    header = f"⚡ P31 JITTERBUG — Tick {tick}  Spoon {spoon_level} ({sp_lbl})  {depressed} depressed"
    stdscr.attron(curses.color_pair(sp_clr) | curses.A_BOLD)
    stdscr.addstr(0, max(0, (w - len(header)) // 2), header[:w-1])
    stdscr.attroff(curses.color_pair(sp_clr) | curses.A_BOLD)
    stdscr.addstr(1, 0, "─" * (w - 2))

    # Distribution
    bar_w = max(8, mid - 20)
    stdscr.attron(curses.A_BOLD)
    stdscr.addstr(3, 2, "DISTRIBUTION  [1-5 to drill]")
    stdscr.attroff(curses.A_BOLD)
    for i, st in enumerate(STAGE_ORDER):
        c = counts.get(st, 0)
        pct = c / total if total else 0
        fill = int(bar_w * pct)
        bar = "█" * fill + "░" * (bar_w - fill)
        pair = i + 2
        stdscr.attron(curses.color_pair(pair))
        stdscr.addstr(4 + i, 2, f" {STAGE_ICONS[st]} {st:8s} ")
        stdscr.attroff(curses.color_pair(pair))
        stdscr.addstr(4 + i, 14, bar + f" {c:3d}")

    # Scores
    y = 11
    stdscr.attron(curses.A_BOLD)
    stdscr.addstr(y, 2, "AVERAGE SCORES")
    stdscr.attroff(curses.A_BOLD)
    y += 1
    for i, dim in enumerate(DIMS):
        vals = [a["scores"].get(dim, 1) for a in data["artifacts"]]
        avg = sum(vals) / len(vals) if vals else 1
        bw = 15
        fill = max(0, min(bw, int((avg - 1) / 4 * bw)))
        bar = "█" * fill + "░" * (bw - fill)
        clr = 2 if avg >= 3 else (3 if avg >= 2 else 4)
        stdscr.attron(curses.color_pair(clr))
        stdscr.addstr(y + i, 2, f" {dim:5s} ")
        stdscr.attroff(curses.color_pair(clr))
        stdscr.addstr(y + i, 9, bar + f" {avg:.2f}")

    # Right column
    x = mid + 2
    if x >= w - 5:
        return spoon_level

    signals = _load(REPO_ROOT / "jitterbug-signals.json") or {}
    stdscr.attron(curses.A_BOLD)
    stdscr.addstr(3, x, "SIGNALS")
    stdscr.attroff(curses.A_BOLD)
    si = 0
    for name, sdata in sorted(signals.items()):
        if name.startswith("_") or not isinstance(sdata, dict):
            continue
        wgt = sdata.get("weight", 1.0)
        label = name.replace("_", " ").title()
        stdscr.addstr(4 + si, x, f" ✓ {label:20s} ×{wgt:.1f}")
        si += 1

    stdscr.attron(curses.A_BOLD)
    stdscr.addstr(4 + si + 1, x, "ENTANGLEMENTS")
    stdscr.attroff(curses.A_BOLD)
    stdscr.addstr(4 + si + 2, x, f" {meta.get('entanglement_pairs', 0)} active bonds")
    overrides = len([a for a in data["artifacts"] if a.get("override")])
    stdscr.addstr(4 + si + 3, x, f" {overrides} frozen (overrides)")

    y2 = 4 + si + 5
    stdscr.attron(curses.A_BOLD)
    stdscr.addstr(y2, x, "NEXT CRON")
    stdscr.attroff(curses.A_BOLD)
    stdscr.addstr(y2 + 1, x, f" {_next_cron_str()}")
    stdscr.addstr(y2 + 3, x, f" LAST TICK: {meta.get('scan_duration_seconds', 0):.2f}s")

    y3 = y2 + 5
    stdscr.attron(curses.A_BOLD)
    stdscr.addstr(y3, x, "RECENT TRANSITIONS")
    stdscr.attroff(curses.A_BOLD)
    if REPORT_PATH.exists():
        text = REPORT_PATH.read_text(encoding="utf-8", errors="replace")
        ticks = text.split("## Jitterbug Tick Report")
        if len(ticks) > 1:
            trans = []
            in_tbl = False
            for line in ticks[-1].splitlines():
                if "### Stage Transitions" in line:
                    in_tbl = True
                    continue
                if in_tbl:
                    if line.startswith("|") and "---" not in line:
                        trans.append(line)
                    elif not line.startswith("|") and trans:
                        break
            for ti, line in enumerate(trans[:5]):
                parts = [p.strip() for p in line.split("|") if p.strip()]
                if len(parts) >= 4:
                    name = parts[0].rsplit("/", 1)[-1]
                    stdscr.addstr(y3 + 1 + ti, x, f" {name:18s} {parts[1].split()[-1]}→{parts[2].split()[-1]}")

    # Footer
    footer = "[1-5] drill stage  [r] refresh  [q] quit"
    stdscr.attron(curses.A_DIM)
    stdscr.addstr(h - 1, max(0, (w - len(footer)) // 2), footer)
    stdscr.attroff(curses.A_DIM)

    # Pulse
    intensity = 0.3 + 0.7 * abs(math.sin(frame * 0.05))
    clr = 1 if intensity > 0.6 else 6
    stdscr.attron(curses.color_pair(clr))
    for xb in range(2, w - 2):
        stdscr.addch(h - 2, xb, "─")
    stdscr.attroff(curses.color_pair(clr))

    return spoon_level


def _render_drill(stdscr, data, stage, h, w):
    """Render drill-down view for a specific stage."""
    artifacts = [a for a in data["artifacts"] if a["stage"] == stage]
    icon = STAGE_ICONS.get(stage, " ")
    color = STAGE_COLORS.get(stage, 6)

    stdscr.attron(curses.color_pair(color) | curses.A_BOLD)
    title = f" {icon} {stage} — {len(artifacts)} artifacts "
    stdscr.addstr(0, max(0, (w - len(title)) // 2), title[:w-1])
    stdscr.attroff(curses.color_pair(color) | curses.A_BOLD)
    stdscr.addstr(1, 0, "─" * (w - 2))

    # Header row
    stdscr.attron(curses.A_BOLD | curses.A_UNDERLINE)
    stdscr.addstr(3, 2, f"{'ARTIFACT':30s} {'OVERALL':8s} {'TEST':6s} {'CODE':6s} {'DOCS':6s} {'OPS':6s} {'SEC':6s} WEAKEST")
    stdscr.attroff(curses.A_BOLD | curses.A_UNDERLINE)

    # Sort by overall score ascending (worst first)
    artifacts.sort(key=lambda a: a["overall"])

    max_rows = h - 6
    for i, a in enumerate(artifacts[:max_rows]):
        s = a["scores"]
        weakest = min(s, key=s.get)
        overall = a["overall"]
        y = 4 + i
        clr = 1 if overall >= 3 else (3 if overall >= 2 else 5)
        stdscr.attron(curses.color_pair(clr))
        stdscr.addstr(y, 2, f"{a['name']:30s}")
        stdscr.addstr(y, 33, f"{overall:7.2f} ")
        stdscr.addstr(y, 41, f"{s['TEST']:5.1f} ")
        stdscr.addstr(y, 48, f"{s['CODE']:5.1f} ")
        stdscr.addstr(y, 55, f"{s['DOCS']:5.1f} ")
        stdscr.addstr(y, 62, f"{s['OPS']:5.1f} ")
        stdscr.addstr(y, 69, f"{s['SEC']:5.1f} ")
        stdscr.attroff(curses.color_pair(clr))
        stdscr.addstr(y, 76, f"{weakest}")

        # Show depressed flag
        if a.get("depressed"):
            stdscr.attron(curses.color_pair(5) | curses.A_BOLD)
            stdscr.addstr(y, 84, "⚠ DEPRESSED")
            stdscr.attroff(curses.color_pair(5) | curses.A_BOLD)

    if len(artifacts) > max_rows:
        stdscr.addstr(h - 3, 2, f"... and {len(artifacts) - max_rows} more")

    # Footer
    footer = "[q] back to overview"
    stdscr.attron(curses.A_DIM)
    stdscr.addstr(h - 1, max(0, (w - len(footer)) // 2), footer)
    stdscr.attroff(curses.A_DIM)


def main_loop(stdscr):
    curses.curs_set(0)
    curses.init_pair(1, curses.COLOR_GREEN, -1)
    curses.init_pair(2, curses.COLOR_CYAN, -1)
    curses.init_pair(3, curses.COLOR_YELLOW, -1)
    curses.init_pair(4, curses.COLOR_MAGENTA, -1)
    curses.init_pair(5, curses.COLOR_RED, -1)
    curses.init_pair(6, curses.COLOR_WHITE, -1)
    stdscr.nodelay(1)

    frame = 0
    drill_stage: str | None = None

    while True:
        frame += 1
        stdscr.erase()
        h, w = stdscr.getmaxyx()
        if h < 20 or w < 60:
            stdscr.addstr(0, 0, "Terminal too small (need 60x20)")
            stdscr.refresh()
            time.sleep(1)
            continue

        data = _load(INDEX_PATH)
        if not data:
            stdscr.addstr(h // 2, max(0, (w - 25) // 2), "Waiting for grading-index.json...")
            stdscr.refresh()
            time.sleep(1)
            continue

        if drill_stage:
            _render_drill(stdscr, data, drill_stage, h, w)
        else:
            _render_overview(stdscr, data, w // 2, w, frame)

        stdscr.refresh()

        # Non-blocking input
        for _ in range(20):
            key = stdscr.getch()
            if key == -1:
                break
            if key == ord("q"):
                if drill_stage:
                    drill_stage = None
                else:
                    return
            elif key == ord("r"):
                break  # Force refresh
            elif key in FOCUS_STAGES:
                drill_stage = FOCUS_STAGES[key]
            elif key == ord("1"):
                drill_stage = "FRUIT"
            elif key == ord("2"):
                drill_stage = "BLOOM"
            elif key == ord("3"):
                drill_stage = "SAPLING"
            elif key == ord("4"):
                drill_stage = "SPROUT"
            elif key == ord("5"):
                drill_stage = "SEED"
            elif key == 27:  # Escape
                drill_stage = None

        time.sleep(0.1)


if __name__ == "__main__":
    print("P31 Jitterbug Live Dashboard — Ctrl+C to quit", file=sys.stderr)
    try:
        curses.wrapper(main_loop)
    except KeyboardInterrupt:
        print("\nDashboard closed.", file=sys.stderr)
