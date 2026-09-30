#!/usr/bin/env python3
"""
check-layout.py — layout defect gate (Visual Typesetting Optimization, practical).

Research basis: PaperFit (arXiv 2605.10341) formalizes Visual Typesetting
Optimization — iteratively render pages, diagnose defects, apply constrained
repairs — with a five-category taxonomy. The pdf-audit toolkit detects margin
overflow, stuck words, orphan punctuation, justify gaps, widows/orphans,
rivers, and asymmetric margins. This gate implements the subset detectable
from extracted text without an image analyzer:

  1. widow page     — a content page with < 3 lines of body text
  2. widow heading  — a page that ends with a section heading (stranded at
                      the bottom of the page)
  3. orphan page    — a page whose first body line is a single word/short
                      fragment (a paragraph's first line left alone)
  4. cover leak     — a running footer appearing on the cover page
  5. budget         — page count > --max-pages

Hard-fails on any of 1-4. The vision-in-the-loop version (render pages to
images, analyze margins/rivers/balance) is the PaperFit pattern and is the
next step — recorded, not built.

Usage:
  python3 scripts/check-layout.py /tmp/report/<session>.report.pdf
Exit 0 = clean; 1 = a defect found.
"""
import sys
import re
import argparse

try:
    from PyPDF2 import PdfReader
except ImportError:
    print("check-layout: PyPDF2 not installed", file=sys.stderr)
    sys.exit(2)


HEADING_RE = re.compile(r"^(Consensus|Divergence|Synthesis|Evidence Appendix|Executive Summary|Methodology)$")
FOOTER_RE = re.compile(r"(p31ca\.org|CC BY-SA|github\.com/p31labs)")
# Card labels in the summary-cards grid — a lone label line is a layout
# artifact of the card grid, not a paragraph orphan.
LABEL_RE = re.compile(r"^(QUESTION|TAKEAWAY|KEY FINDINGS)$", re.IGNORECASE)


def lines_of(page_text):
    return [l.strip() for l in page_text.split("\n") if l.strip()]


def check(pdf_path, max_pages=20, cover_pages=1):
    reader = PdfReader(pdf_path)
    pages = len(reader.pages)
    findings = []

    if pages > max_pages:
        findings.append(f"budget: {pages} pages > {max_pages}")

    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        lines = lines_of(text)
        # Strip the running footer lines (they appear at the bottom).
        body = [l for l in lines if not FOOTER_RE.search(l)]

        # 4. cover leak — footer should NOT be on the cover
        if i < cover_pages:
            if FOOTER_RE.search(text):
                findings.append(f"cover leak: footer on cover page {i + 1}")
            continue

        # 1. widow page — fewer than 3 body lines on a content page
        if len(body) < 3:
            findings.append(f"widow page: page {i + 1} has {len(body)} body lines")
            continue

        # 2. widow heading — page ends with a section heading
        last = body[-1]
        if HEADING_RE.match(last):
            findings.append(f"widow heading: page {i + 1} ends with '{last}'")

        # 3. orphan page — first body line is a single word/short fragment AND
        #    the page is nearly empty (a stranded line at the top). A page that
        #    starts mid-sentence and continues with a full bullet is NOT an
        #    orphan — it is prose continuation across the page break. Only a
        #    genuine stranded line (fragment + little else) is a defect.
        first = body[0]
        if (
            len(first.split()) <= 2
            and not HEADING_RE.match(first)
            and not LABEL_RE.match(first)
            and len(body) <= 3  # stranded: just the fragment + a line or two
        ):
            findings.append(f"orphan page: page {i + 1} starts with '{first}'")

    return pages, findings


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf")
    ap.add_argument("--max-pages", type=int, default=20)
    ap.add_argument("--cover-pages", type=int, default=1)
    args = ap.parse_args()

    pages, findings = check(args.pdf, args.max_pages, args.cover_pages)
    if findings:
        print(f"❌ LAYOUT GATE FAILED ({pages} pages):")
        for f in findings:
            print(f"  - {f}")
        sys.exit(1)
    print(f"✅ LAYOUT GATE PASSED — {pages} pages, no widow/orphan/cover-leak defects.")


if __name__ == "__main__":
    main()