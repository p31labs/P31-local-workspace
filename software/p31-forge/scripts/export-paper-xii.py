#!/usr/bin/env python3
"""Export Paper XII (Sovereign Stack) to Zenodo-ready format."""
from __future__ import annotations

import argparse
import csv
import io
import json
import shutil
import sys
from pathlib import Path
from datetime import datetime


def find_paper_xii(repo: Path) -> Path:
    for pat in ("*Pape*XII*", "*paper*xii*"):
        for hit in repo.rglob(pat):
            return hit
    sys.exit("Paper XII not found — pass --paper-xii")


def write_csv(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["event_type", "timestamp", "did", "metadata"])
        writer.writeheader()
        writer.writerows(rows or [])


def write_zenodo_csv(path: Path) -> None:
    payload = {
        "metadata": {
            "title": "OQE Telemetry for Paper XII: Mesh Events and Authorized DIDs",
            "publication_date": datetime.now().strftime("%Y-%m-%d"),
            "creators": [
                {
                    "name": "Johnson, William R.",
                    "orcid": "0009-0002-2492-9079",
                }
            ],
            "description": "Aggregated event data from the P31 mesh and beta sessions.",
            "access_right": "open",
        }
    }
    buf = io.StringIO()
    buf.write(f"# zenodo.metadata={json.dumps(payload['metadata'])}\n")
    buf.write("event_type,timestamp,did,metadata\n")
    buf = buf.getvalue()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(buf, encoding="utf-8")


def main() -> None:
    p = argparse.ArgumentParser(description="Paper XII Zenodo export")
    p.add_argument(
        "--format",
        choices=["zenodo", "pdf", "latex", "markdown", "csv"],
        default="markdown",
    )
    p.add_argument("--output", "-o", type=Path, default=None)
    p.add_argument("--paper-xii", type=Path, default=None)
    args = p.parse_args()

    repo = Path(__file__).resolve().parents[2]
    src = args.paper_xii or find_paper_xii(repo)

    if args.output is None:
        out_dir = repo / "zenodo_batch" / "xii-export" / datetime.now().strftime("%Y%m%d")
    else:
        out_dir = args.output
    out_dir.mkdir(parents=True, exist_ok=True)

    if args.format == "csv":
        dst = out_dir / "paper-xii-export.csv"
        write_csv(dst, [])
        print(f"Wrote CSV export to {dst}")
        return

    if args.format == "zenodo":
        dst = out_dir / "paper-xii-zenodo.csv"
        write_zenodo_csv(dst)
        print(f"Wrote Zenodo export to {dst}")
        return

    if args.format in ("pdf", "latex"):
        sys.exit(f"{args.format} export requires wkhtmltopdf/pandoc")

    dst = out_dir / f"paper-xii-{args.format}.md"
    shutil.copy(src, dst)
    print(f"Exported Paper XII to {dst}")


if __name__ == "__main__":
    main()
