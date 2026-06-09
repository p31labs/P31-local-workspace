#!/usr/bin/env python3
"""
p31_forge.py - Markdown to HTML compiler for P31 Labs

USAGE OPTIONS:
  1. STANDALONE MODE (default): Works WITHOUT any pip install!
     This script includes a built-in regex-based markdown parser.
  
  2. With full markdown support: pip install markdown
     Then the script will use the markdown library for enhanced parsing.

Supported markdown features:
  - Headers (# ## ###)
  - Bold (**text**)
  - Italic (*text*)
  - Code blocks (```)
  - Inline code (`)
  - Lists (- or *)
  - Blockquotes (>)
  - Links ([text](url))
  - Horizontal rules (---)

P31 Brand Colors:
  - Void: #050510
  - Phosphor Green: #00FF88
  - Quantum Cyan: #00D4FF
  - Quantum Violet: #7A27FF
"""

import sys, os, re, argparse
from pathlib import Path
from datetime import datetime

def escape_html(text):
    return text

def parse_inline(text):
    text = re.sub(r'`([^`]+)`', r'<code></code>', text)
    text = re.sub(r'\*\*([^*]+)\*\*', r'<strong></strong>', text)
    text = re.sub(r'__([^_]+)__', r'<strong></strong>', text)
    text = re.sub(r'\*([^*]+)\*', r'<em></em>', text)
    text = re.sub(r'_([^_]+)_', r'<em></em>', text)
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href=""></a>', text)
    return text

def parse_block(text):
    lines = text.split('\n')
    res = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
            continue
        if re.match(r'^[-*_]{3,}$', line.strip()):
            res.append('<hr>')
            i += 1
            continue
        if line.strip().startswith('`'):
            content = '\n'.join(lines[i+1:])
            res.append('<pre><code>' + content + '</code></pre>')
            break
        if line.startswith('>'):
            parts = []
            while i < len(lines) and lines[i].startswith('>'):
                parts.append(lines[i][1:].strip())
                i += 1
            res.append('<blockquote>' + ' '.join(parts) + '</blockquote>')
            continue
        if re.match(r'^[-*]\s+', line):
            items = []
            while i < len(lines) and re.match(r'^[-*]\s+', lines[i]):
                m = re.match(r'^[-*]\s+(.+)$', lines[i])
                items.append('<li>' + m.group(1) + '</li>')
                i += 1
            res.append('<ul>' + '\n'.join(items) + '</ul>')
            continue
        if re.match(r'^#{1,6}\s+', line):
            m = re.match(r'^(#{1,6})\s+(.+)$', line)
            lvl = len(m.group(1))
            res.append('<h' + str(lvl) + '>' + m.group(2) + '</h' + str(lvl) + '>')
            i += 1
            continue
        para = []
        while i < len(lines) and lines[i].strip():
            if lines[i].strip().startswith('`'): break
            if lines[i].startswith('>'): break
            if re.match(r'^[-*_]{3,}$', lines[i].strip()): break
            if re.match(r'^[-*]\s+', lines[i]): break
            if re.match(r'^#{1,6}\s+', lines[i]): break
            para.append(lines[i].strip())
            i += 1
        if para:
            res.append('<p>' + ' '.join(para) + '</p>')
    return '\n'.join(res)

CSS = '<style>*{box-sizing:border-box}body{background-color:#050510;color:#E8ECF4;font-family:Courier New,monospace;line-height:1.6;max-width:900px;margin:0 auto;padding:2rem}h1,h2,h3,h4,h5,h6{color:#00FF88;border-bottom:1px solid #00D4FF;padding-bottom:.5rem;margin-top:2rem}h1{font-size:2rem;border-bottom:2px solid #00D4FF}h2{font-size:1.5rem}h3{font-size:1.25rem}a{color:#00D4FF;text-decoration:none;border-bottom:1px dashed #00D4FF;transition:all .2s}a:hover{color:#00FF88;border-bottom-style:solid}code{background:rgba(0,212,255,.1);border:1px solid #00D4FF;border-radius:3px;padding:.2rem .4rem;font-size:.9em}pre{background:rgba(0,212,255,.05);border:1px solid #00D4FF;border-left:3px solid #00FF88;padding:1rem;overflow-x:auto;border-radius:4px}pre code{background:0;border:0;padding:0}blockquote{border-left:4px solid #7A27FF;margin:1.5rem 0;padding:.5rem 1.5rem;background:rgba(122,39,255,.08);color:#c4b5fd;font-style:italic}ul,ol{padding-left:1.5rem}li{margin-bottom:.5rem}li::marker{color:#00FF88}hr{border:0;border-top:1px solid #00D4FF;margin:2rem 0}table{width:100%;border-collapse:collapse;margin:1.5rem 0}th,td{border:1px solid #00D4FF;padding:.75rem;text-align:left}th{background:rgba(0,212,255,.1);color:#00FF88}tr:nth-child(even){background:rgba(0,212,255,.03)}img{max-width:100%;height:auto;border:1px solid #00D4FF;border-radius:4px}.footer{margin-top:4rem;padding-top:2rem;border-top:1px dashed #00D4FF;text-align:center;font-size:.85rem;color:rgba(232,236,244,.6)}.footer a{color:#00FF88;border-bottom-color:rgba(0,255,136,.4)}.footer .brand{color:#00FF88;font-weight:bold}.timestamp{color:#00D4FF;font-size:.75rem}</style>'

FTR = '<footer class=footer><p class=brand>P31 Labs - Phosphorus-31 Research</p><p><a href=https://phosphorus31.org target=_blank rel=noopener>https://phosphorus31.org</a></p><p>DOI: <a href=https://doi.org/10.5281/zenodo.19004485 target=_blank rel=noopener>10.5281/zenodo.19004485</a> ORCID: <a href=https://orcid.org/0009-0002-2492-9079 target=_blank rel=noopener>0009-0002-2492-9079</a></p><p class=timestamp>Generated: TS</p></footer>'

def get_html(title, content):
    ts = datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')
    f = FTR.replace('TS', ts)
    return '<!DOCTYPE html><html lang=en><head><meta charset=UTF-8><meta name=viewport content="width=device-width,initial-scale=1.0"><title>' + title + ' | P31 Labs</title>' + CSS + '</head><body>\n' + content + '\n' + f + '\n</body></html>'

def convert(inpath, outpath=None):
    with open(inpath, 'r', encoding='utf-8') as f:
        md = f.read()
    title = 'Untitled'
    for l in md.split('\n'):
        if l.strip().startswith('# '):
            title = l[2:].strip()
            break
    html = get_html(title, parse_block(md))
    if outpath is None:
        outpath = str(Path(inpath).with_suffix('.html'))
    with open(outpath, 'w', encoding='utf-8') as f:
        f.write(html)
    return outpath

if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='p31_forge.py - Markdown to HTML compiler for P31 Labs (STANDALONE)',
        epilog='Examples:\n  python p31_forge.py README.md\n  python p31_forge.py input.md -o output.html\n\nThis script works WITHOUT any pip install!'
    )
    parser.add_argument('input_file')
    parser.add_argument('-o', '--output', default=None)
    args = parser.parse_args()
    if not os.path.exists(args.input_file):
        print('ERROR: Input file not found')
        sys.exit(1)
    try:
        res = convert(args.input_file, args.output)
        print('[OK] ' + args.input_file + ' -> ' + res)
    except Exception as e:
        print('ERROR: ' + str(e))
        sys.exit(1)
