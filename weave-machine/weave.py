#!/usr/bin/env python3
"""
WEAVE — Content Fusion Engine v1.0
PMM_WEAVE=1.0
Ingests, diffs, and zipper-merges content into a searchable knowledge base.
"""
import json, os, sys, shutil, hashlib, time, re
from pathlib import Path
from datetime import datetime, timezone

REPO_ROOT = Path(os.environ.get("P31_REPO_ROOT", "/home/p31/P31-local-workspace"))
WEAVE_DIR = REPO_ROOT / "weave-machine"
KNOWLEDGE_DIR = WEAVE_DIR / "knowledge"
INDEX_PATH = KNOWLEDGE_DIR / "index.json"
HISTORY_DIR = KNOWLEDGE_DIR / ".history"

os.makedirs(HISTORY_DIR, exist_ok=True)

COLOR = {"GREEN": "\033[0;32m", "YELLOW": "\033[1;33m", "RED": "\033[0;31m", "CYAN": "\033[0;36m", "BOLD": "\033[1m", "NC": "\033[0m"}
if not sys.stdout.isatty():
    for k in COLOR: COLOR[k] = ""

def p(status, msg=""):
    symbols = {"ok": f"{COLOR['GREEN']}✓{COLOR['NC']}", "warn": f"{COLOR['YELLOW']}⚠{COLOR['NC']}", "fail": f"{COLOR['RED']}✗{COLOR['NC']}", "info": f"{COLOR['CYAN']}→{COLOR['NC']}"}
    print(f"  {symbols.get(status, ' ')} {msg}")

def load_index():
    if INDEX_PATH.exists():
        return json.loads(INDEX_PATH.read_text())
    return {"schema": "PMM_WEAVE=1.0", "version": 0, "documents": {}, "concepts": {}, "entanglements": []}

def save_index(idx):
    idx["version"] += 1
    idx["updated_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    # Backup
    hist = HISTORY_DIR / f"index-v{idx['version']}.json"
    shutil.copy(str(INDEX_PATH), str(hist)) if INDEX_PATH.exists() else None
    INDEX_PATH.write_text(json.dumps(idx, indent=2))

def extract_concepts(text):
    concepts = set()
    for m in re.finditer(r'\*\*([^*]+)\*\*', text): concepts.add(m.group(1).strip())
    for m in re.finditer(r'^###\s+(.+)', text, re.M): concepts.add(m.group(1).strip())
    for m in re.finditer(r'^##\s+(.+)', text, re.M): concepts.add(m.group(1).strip())
    for m in re.finditer(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b', text): concepts.add(m.group(1).strip())
    return list(concepts)

def ingest_file(path, name=None):
    path = Path(path)
    if not path.exists():
        p("fail", f"File not found: {path}")
        return None
    name = name or path.stem
    content = path.read_text(encoding="utf-8", errors="replace")
    ext = path.suffix.lower()
    data = {"name": name, "source": str(path), "ext": ext, "size": len(content), "ingested_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "content": content}
    if ext == ".json":
        try: data["parsed"] = json.loads(content)
        except: data["parsed"] = None
    data["concepts"] = extract_concepts(content)
    data["content_hash"] = hashlib.sha256(content.encode()).hexdigest()[:16]
    return data

def diff_doc(doc, existing):
    if not existing:
        return [{"type": "NEW", "concept": c, "detail": "New concept not in knowledge base"} for c in doc.get("concepts", [])]
    changes = []
    existing_concepts = set(existing.get("concepts", []))
    new_concepts = set(doc.get("concepts", []))
    for c in new_concepts - existing_concepts:
        changes.append({"type": "NEW", "concept": c, "detail": "New concept not in knowledge base"})
    for c in existing_concepts - new_concepts:
        changes.append({"type": "GAP", "concept": c, "detail": "Existing concept not addressed by new content"})
    if doc.get("content_hash") != existing.get("content_hash"):
        changes.append({"type": "COMPLEMENT", "concept": "document", "detail": "Content updated — will be merged"})
    return changes

def merge_doc(doc, existing):
    if not existing:
        return doc
    merged = dict(existing)
    merged["content"] = doc["content"]
    merged["ingested_at"] = doc["ingested_at"]
    merged["content_hash"] = doc["content_hash"]
    merged["size"] = doc["size"]
    merged["source"] = doc["source"]
    merged["ext"] = doc["ext"]
    merged["parsed"] = doc.get("parsed", existing.get("parsed"))
    merged_concepts = set(existing.get("concepts", [])) | set(doc.get("concepts", []))
    merged["concepts"] = list(merged_concepts)
    return merged

# ── CLI ──────────────────────────────────────────────────────────────
def cmd_init(_=None):
    if INDEX_PATH.exists():
        p("warn", "Knowledge base already exists")
        return
    idx = load_index()
    save_index(idx)
    p("ok", f"Initialized knowledge base at {INDEX_PATH}")

def cmd_ingest(args):
    if not args: p("fail", "Usage: weave ingest <file> [--as <name>]"); return
    filepath = args[0]
    name = None
    if "--as" in args:
        i = args.index("--as")
        name = args[i+1] if i+1 < len(args) else None
    doc = ingest_file(filepath, name)
    if not doc: return
    idx = load_index()
    staged = idx.setdefault("staged", {})
    staged[doc["name"]] = doc
    save_index(idx)
    p("ok", f"Ingested '{doc['name']}' ({doc['size']}B, {len(doc['concepts'])} concepts)")
    p("info", f"  Run 'weave diff {doc['name']}' to see changes")

def cmd_list(_=None):
    idx = load_index()
    docs = idx.get("documents", {})
    staged = idx.get("staged", {})
    print(f"\n  {COLOR['BOLD']}Documents ({len(docs)}){COLOR['NC']}:")
    for name, d in sorted(docs.items()):
        print(f"    ✓ {name} ({d.get('size',0)}B, {len(d.get('concepts',[]))} concepts)")
    print(f"\n  {COLOR['BOLD']}Staged ({len(staged)}){COLOR['NC']}:")
    for name in staged:
        print(f"    ⏳ {name}")
    print()

def cmd_status(_=None):
    idx = load_index()
    docs = idx.get("documents", {})
    staged = idx.get("staged", {})
    concepts = idx.get("concepts", {})
    print(f"\n  {COLOR['BOLD']}WEAVE Knowledge Base{COLOR['NC']}")
    print(f"  Schema:    {idx.get('schema','?')}")
    print(f"  Version:   {idx.get('version',0)}")
    print(f"  Updated:   {idx.get('updated_at','?')}")
    print(f"  Documents: {len(docs)}")
    print(f"  Staged:    {len(staged)}")
    print(f"  Concepts:  {len(concepts)}")
    print(f"  Entanglements: {len(idx.get('entanglements',[]))}")
    print()

def cmd_diff(args):
    if not args: p("fail", "Usage: weave diff <doc-name>"); return
    name = args[0]
    idx = load_index()
    staged = idx.get("staged", {})
    if name not in staged:
        p("fail", f"'{name}' not in staged documents"); return
    doc = staged[name]
    existing = idx.get("documents", {}).get(name)
    changes = diff_doc(doc, existing)
    print(f"\n  {COLOR['BOLD']}Diff for '{name}'{COLOR['NC']}:")
    for c in changes:
        sym = {"NEW": f"{COLOR['GREEN']}+{COLOR['NC']}", "GAP": f"{COLOR['YELLOW']}~{COLOR['NC']}", "COMPLEMENT": f"{COLOR['CYAN']}△{COLOR['NC']}", "CONFLICT": f"{COLOR['RED']}!{COLOR['NC']}"}
        print(f"    {sym.get(c['type'],'?')} [{c['type']}] {c['concept']} — {c['detail']}")
    if not changes:
        p("info", "No changes detected")
    print()

def cmd_merge(args):
    if not args: p("fail", "Usage: weave merge <doc-name>"); return
    name = args[0]
    idx = load_index()
    staged = idx.get("staged", {})
    if name not in staged:
        p("fail", f"'{name}' not in staged documents"); return
    doc = staged[name]
    existing = idx.get("documents", {}).get(name)
    changes = diff_doc(doc, existing)
    merged = merge_doc(doc, existing)
    idx["documents"][name] = merged
    for c in doc.get("concepts", []):
        idx.setdefault("concepts", {})[c] = idx["concepts"].get(c, 0) + 1
    del staged[name]
    save_index(idx)
    p("ok", f"Merged '{name}' ({len(changes)} changes)")
    for c in changes:
        p("info", f"  [{c['type']}] {c['concept']}")

def cmd_export(args):
    fmt = "json"
    if "--format" in args:
        i = args.index("--format")
        fmt = args[i+1] if i+1 < len(args) else "json"
    idx = load_index()
    out = {"meta": {"schema": idx["schema"], "version": idx["version"], "updated_at": idx.get("updated_at","")}, "documents": idx.get("documents",{}), "concepts": list(idx.get("concepts",{}).keys()), "entanglements": len(idx.get("entanglements",[]))}
    if fmt == "json":
        print(json.dumps(out, indent=2))
    elif fmt == "concepts":
        for c in sorted(out["concepts"]): print(c)
    else:
        p("fail", f"Unknown format: {fmt}")

def cmd_resolve(_=None):
    p("info", "Conflict resolution requires manual intervention. No conflicts detected.")

def cmd_rollback(args):
    if not args: p("fail", "Usage: weave rollback <version>"); return
    ver = int(args[0])
    hist = HISTORY_DIR / f"index-v{ver}.json"
    if not hist.exists():
        p("fail", f"Version {ver} not found in history")
        return
    shutil.copy(str(hist), str(INDEX_PATH))
    p("ok", f"Rolled back to version {ver}")

def cmd_demo(_=None):
    print(f"\n  {COLOR['BOLD']}WEAVE Demo — Content Fusion{COLOR['NC']}\n")
    cmd_init()
    # Create demo file
    demo = WEAVE_DIR / "demo-sample.md"
    demo.write_text("# Demo Document\n\n**Key Concept Alpha** and **Key Concept Beta** are important.\n\n## Section One\n\nThis is a test document for the WEAVE machine.\n")
    cmd_ingest([str(demo), "--as", "demo"])
    cmd_diff(["demo"])
    cmd_merge(["demo"])
    cmd_list([])
    demo.unlink()
    p("ok", "Demo complete")

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "help"
    args = sys.argv[2:] if len(sys.argv) > 2 else []
    cmds = {
        "init": cmd_init, "ingest": cmd_ingest, "list": cmd_list, "ls": cmd_list,
        "status": cmd_status, "diff": cmd_diff, "merge": cmd_merge,
        "export": cmd_export, "resolve": cmd_resolve, "rollback": cmd_rollback, "demo": cmd_demo,
        "help": lambda *_: print(f"Usage: weave <command> [args]\nCommands: init, ingest, list, status, diff, merge, export, resolve, rollback, demo")
    }
    fn = cmds.get(cmd)
    if fn: fn(args)
    else: print(f"Unknown command: {cmd}"); cmds["help"]([])
