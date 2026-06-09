#!/usr/bin/env python3
"""
P31 FORGE — DOCX → PDF bridge

Converts .docx files in ../out/ to matching .pdf files using
Microsoft Word COM automation via docx2pdf (Windows only).

Usage:
    python scripts/docx_to_pdf.py                    # Convert everything in out/
    python scripts/docx_to_pdf.py path/to/file.docx  # Convert one file
"""
from __future__ import annotations

import os
import sys
import glob
from pathlib import Path


def convert(docx_path: str | Path) -> str:
    """Convert a single .docx to .pdf in the same directory. Returns output path."""
    try:
        from docx2pdf import convert as _convert
    except ImportError:
        print("[forge:pdf] docx2pdf not installed. Run: pip install docx2pdf", file=sys.stderr)
        sys.exit(1)

    docx_path = Path(docx_path).resolve()
    if not docx_path.exists():
        print(f"[forge:pdf] NOT FOUND: {docx_path}", file=sys.stderr)
        sys.exit(1)

    pdf_path = docx_path.with_suffix(".pdf")
    _convert(str(docx_path), str(pdf_path))
    print(f"[forge:pdf] {docx_path.name} -> {pdf_path.name}")
    return str(pdf_path)


def convert_all(out_dir: Path) -> list[str]:
    """Convert every .docx in out_dir. Returns list of output paths."""
    docx_files = sorted(out_dir.glob("*.docx"))
    if not docx_files:
        print(f"[forge:pdf] No .docx files in {out_dir}")
        return []

    results = []
    for d in docx_files:
        try:
            results.append(convert(d))
        except Exception as e:
            print(f"[forge:pdf] FAILED {d.name}: {e}", file=sys.stderr)
    return results


def main() -> None:
    repo_root = Path(__file__).resolve().parent.parent
    out_dir = repo_root / "out"
    out_dir.mkdir(exist_ok=True)

    argv = sys.argv[1:]
    if argv:
        # Convert a specific file
        convert(argv[0])
    else:
        # Convert everything in out/
        convert_all(out_dir)


if __name__ == "__main__":
    main()
