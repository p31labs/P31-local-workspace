#!/usr/bin/env python3
import os, json, stat, subprocess, datetime, pathlib, re

REPO_ROOT = pathlib.Path('/home/p31/P31-local-workspace')
HOME = pathlib.Path('/home/p31')
AUDIT_DIR = HOME / '.p31' / 'audit'
AUDIT_DIR.mkdir(parents=True, exist_ok=True)

audit_id = f"CORE-AUDIT-{datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d-%H%M%S')}"
ts = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
manifest = {
    'audit': {
        'id': audit_id,
        'timestamp': ts,
        'findings_total': 0,
        'systems': {
            'GROUND_TRUTH': {'status': 'GREEN', 'findings': []},
            'BUSBAR': {'status': 'GREEN', 'findings': []},
            'BUS_SAFETY_WARNINGS': {'status': 'GREEN', 'findings': []},
            'SUSPICIOUS_ROUTES': {'status': 'GREEN', 'findings': []},
            'COGNITIVE_PASSPORT': {'status': 'GREEN', 'findings': []},
            'IDENTITY': {'status': 'GREEN', 'findings': []},
            'SEMANTIC': {'status': 'GREEN', 'findings': []},
        },
    }
}

def add(system, severity, title, description, location, fix, status='open'):
    finding = {
        'id': f"{audit_id}-{manifest['audit']['findings_total'] + 1}",
        'severity': severity,
        'title': title,
        'description': description,
        'location': location,
        'fix': fix,
        'status': status,
    }
    manifest['audit']['systems'][system]['findings'].append(finding)
    manifest['audit']['findings_total'] += 1
    return finding

def file_contains_legacy(path: pathlib.Path) -> bool:
    try:
        text = path.read_text(errors='ignore')
    except Exception:
        return False
    if any(k in text for k in ['scram', 'redboard', 'reactor', 'submarine', 'RedBoard', 'SCRAM', 'REACTOR', 'SUBMARINE']):
        rel = str(path.relative_to(REPO_ROOT))
        SEMANTIC_EXEMPT = {
            # Self-referential policy enforcement — these files *mandate* the ban
            'admin/AGENTS.md', 'admin/01-p31-global.md', 'admin/p31-rules.md',
            'admin/docs.instructions.md', 'admin/context-v1.1.md',
            'admin/P31_COGNITIVE_PASSPORT_v2_1.md',
            'admin/00_CORE_AXIOMS.md', 'admin/P31_MASTER_DOCTRINE_JFMM.md',
            'p31-surrogate-backend/CognitivePassport-v2_5.md',
            'cwp-2026-002-p31-ecosystem-alignment/01_REFERENCES/01.1_Core_Doctrine/Cognitive_Passport_v3.2.md',
            # Self-referential audit tooling — they reference the terms they detect
            'scripts/p31-audit-scan.sh', 'p31-core-audit.sh', 'p31-core-audit.py',
            'frontend-audit.sh',
            # Technical domain schemas / event logs (not metaphors)
            'P31-FUEL-BUDGET.yaml', 'admin/SPEC_SHEET.md',
            'docs/ARCHITECTURE_DATA_LAYER.md',
            # Whitepaper biographic (factual work history)
            'cwp-2026-002-p31-ecosystem-alignment/01_REFERENCES/01.2_White_Papers/P31_Genesis_Whitepaper_v1.md',
            'wcds/files/FACEBOOK_POST.md', 'wcds/files/FACEBOOK_POST (1).md',
            # Top-level instruction cache files
            'CLAUDE.md', 'CLAUDE_CODE_HANDOVER.md', 'DEEP_RESEARCH_REPORT.md',
            'P31_COGNITIVE_PASSPORT.md', 'prompts/GEMINI_KOFI_STORE_ARTIFACTS.md',
            'prompts/GEMINI_SUBSTACK_GENERATION.md', 'prompts/GEMINI_ZENODO_POLISH.md',
            'software/discord/INTEGRATION.md',
            # Shipyard protocol is the change control document that *describes* the migration table
            'docs/P31_SHIPYARD_PROTOCOL.md',
            # Archived historical Spoon Economics document (legacy terminology preserved as-is)
            'admin/_ARCHIVE/02_SPOON_ECONOMICS.md',
            # Sanitized injection stub for WCD-06 (already sanitized)
            '.tmp-inject-wcd06.py',
            # Self-referential policy enforcement in system prompts / schemas / handoffs
            'software/p31ca/ground-truth/cognitive-passport-v1-1.schema.json',
            'software/p31ca/public/doc-library/index.json',
            'software/integration-handoff/SHIFT-TURNOVER-2026-04-26.md',
            'wcds/CWP-WYE-001.docx.md',
            'admin/P31_WORK_CONTROL_DOCS_v1.0.md',
            # False positive: "scrambled" is an anagram shuffle word, not "scram"
            'software/discord/p31-bot/src/commands/deep.ts',
        }
        if any(rel == ex or rel.endswith('/' + ex) for ex in SEMANTIC_EXEMPT):
            return False
        return True
    return False

# Whitelist of next-hop key patterns for task delegation directories.
# Each pattern matches a `dest_key` token inside a `suspended:` follow-up block.
# Paths living inside a matching directory are expected delegation targets, not suspicious.
SUSPICIOUS_ROUTES_WHITELIST = [
    'p31-codex-next', 'p31-harness-next', 'p31-validation-next',
    'p31-hearing-ops', 'p31-surrogate-backend', 'p31-atlas-next',
    'p31-shipyard', 'harmony-helper', 'pwa-harmony-helper',
]

# -------------------------------------------------------------------
# 1. GROUND_TRUTH
# -------------------------------------------------------------------
gt = manifest['audit']['systems']['GROUND_TRUTH']
gt_file = HOME / 'meatspace' / 'GROUND_TRUTH.yaml'
if not gt_file.exists():
    gt['status'] = 'RED'
    add('GROUND_TRUTH', 'critical', 'GROUND_TRUTH.yaml missing',
        'Canonical source of system constants not found.', str(gt_file),
        'Create GROUND_TRUTH.yaml from the canonical template.')
else:
    mode = gt_file.stat().st_mode
    if stat.S_IMODE(mode) != 0o600:
        gt['status'] = 'YELLOW'
        add('GROUND_TRUTH', 'high', 'GROUND_TRUTH.yaml permissions not 600',
            f'File has permissions {oct(stat.S_IMODE(mode))}; should be 600.',
            f'{gt_file}:{oct(stat.S_IMODE(mode))}',
            f'chmod 600 {gt_file}')
    p31ca_gt = REPO_ROOT / 'software' / 'p31ca' / 'ground-truth'
    if not p31ca_gt.exists():
        gt['status'] = 'YELLOW'
        add('GROUND_TRUTH', 'high', 'p31ca ground-truth directory missing',
            'Expected directory not found.', str(p31ca_gt),
            'Create ground-truth directory with schema files.')

# -------------------------------------------------------------------
# 1a. BUS_SAFETY_WARNINGS
# -------------------------------------------------------------------
bsw = manifest['audit']['systems']['BUS_SAFETY_WARNINGS']
bsw_dir = REPO_ROOT / 'p31-cortex'
if not bsw_dir.exists():
    bsw['status'] = 'YELLOW'
    add('BUS_SAFETY_WARNINGS', 'medium', 'p31-cortex directory missing',
        'BUSBAR safety and route directory not present.', str(bsw_dir),
        'Clone or mount p31-cortex into the workspace.')
else:
    safety_fns = [
        'check_address_is_local.py',
        'compliance.py',
        'internal_network_audit.py',
        'network_audit.py',
        'route_audit.py',
        'ssid_audit.py',
        'ssid_check.py',
    ]
    missing_safety = [str(bsw_dir / fn) for fn in safety_fns if not (bsw_dir / fn).exists()]
    if missing_safety:
        bsw['status'] = 'YELLOW'
        add('BUS_SAFETY_WARNINGS', 'medium', 'Missing BUSBAR safety tooling',
            f'{len(missing_safety)} expected audit scripts absent: {", ".join(missing_safety)}',
            str(bsw_dir), 'Restore missing safety-script files.')

    monitored = [
        'emergency_halt_system.py',
        'emergency-halt.sh',
        'network_halt_system.py',
        'network_monitor.py',
    ]
    for fn in monitored:
        p = bsw_dir / fn
        if not p.exists():
            bsw['status'] = 'YELLOW' if bsw['status'] == 'GREEN' else bsw['status']
            add('BUS_SAFETY_WARNINGS', 'medium', f'Missing BUSBAR safety tool {fn}',
                'Expected monitor/halt script not present.', str(p), 'Restore or recreate safety tool.')
        else:
            try:
                text = p.read_text(errors='ignore')
                if re.search(r'log\s*\(|logger\.|print\s*\(', text, re.IGNORECASE):
                    bsw['status'] = 'YELLOW' if bsw['status'] == 'GREEN' else bsw['status']
                    add('BUS_SAFETY_WARNINGS', 'medium', f'Leaking telemetry: {fn}',
                        'Reference to a logging or print call detected in a safety wrapper; violates muted-medium-only output.',
                        str(p), 'Route messages through the mute-locked deferred-log bridge.') 
            except Exception:
                pass

# -------------------------------------------------------------------
# 2. SUSPICIOUS_ROUTES
# -------------------------------------------------------------------
sr = manifest['audit']['systems']['SUSPICIOUS_ROUTES']
task_root = REPO_ROOT / 'p31-codex-next'
if not task_root.exists():
    sr['status'] = 'YELLOW'
    add('SUSPICIOUS_ROUTES', 'medium', 'Missing p31-codex-next root task directory',
        'Expected follow-up task tree not mounted.', str(task_root),
        'Mount or create p31-codex-next with task marker files.')
else:
    recommended = 0
    pending = 0
    missing = 0
    invalid_dests = 0
    whitelist_hits = []
    suspicious_dirs = []
    yield_queue = []
    for root, dirs, files in os.walk(str(task_root)):
        dirs[:] = [d for d in dirs if d not in ('.git', '__pycache__', 'node_modules', 'dist')]
        for fname in files:
            p = pathlib.Path(root) / fname
            try:
                if p.suffix.lower() not in {'.md', '.yaml', '.yml', '.json', '.txt'}:
                    continue
                text = p.read_text(errors='ignore')
            except Exception:
                missing += 1
                continue
            if re.search(r'recommended:\s*yield', text, re.IGNORECASE):
                recommended += 1
            if re.search(r'queue:\s*pending', text, re.IGNORECASE):
                pending += 1
            for m in re.finditer(r'dest_key:\s*([^\s]+)', text):
                dest_dir = pathlib.Path(root).name
                if p.name in {'README.md', 'INDEX.md'}:
                    continue
                if any(pattern in dest_dir for pattern in SUSPICIOUS_ROUTES_WHITELIST):
                    whitelist_hits.append(f'{fname}::{m.group(1)}')
                    continue
                task_norm = re.sub(r'[-\s]+', '-', dest_dir).lower()
                if not re.search(r'next$|triad|p31', task_norm, re.IGNORECASE):
                    invalid_dests += 1
                    suspicious_dirs.append(f'{str(p)} :: dest_key={m.group(1)}')
                else:
                    yield_queue.append(f'{fname} -> {m.group(1)} (dir={dest_dir})')
    if invalid_dests:
        sr['status'] = 'YELLOW'
        add('SUSPICIOUS_ROUTES', 'medium', 'Delegation destination key points outside authorized task tree',
            f'{invalid_dests} next-hop key assignments resolved to directories below a non-next-hop path.',
            '; '.join(suspicious_dirs[:5]) + ('...' if len(suspicious_dirs) > 5 else ''),
            'Route these entries to the canonical follow-up task tree or move the active files into the authorized directory.')
    if yield_queue:
        for q in yield_queue:
            add('SUSPICIOUS_ROUTES', 'info', 'Queued delegation link present',
                f'Task delegation recorded: {q}, marked `recommended: yield`.',
                'p31-codex-next tree', 'Await dispatch to the monitored downstream network.')
    if not recommended and not pending:
        sr['status'] = 'YELLOW' if sr['status'] == 'GREEN' else sr['status']
        add('SUSPICIOUS_ROUTES', 'low', 'No delegation markers found in task tree',
            'Zero `recommended: yield` or `queue: pending` markers detected in p31-codex-next.',
            str(task_root), 'Confirm the follow-up tree has been initialized with terminal task summaries.')
    if not whitelist_hits:
        sr['status'] = 'YELLOW' if sr['status'] == 'GREEN' else sr['status']
        add('SUSPICIOUS_ROUTES', 'low', 'No whitelist-confirmed safe next hops detected',
            'Task files did not declare authorized next-hop routing; verify whitelist prefixes.',
            str(task_root), 'Confirm task files use the approved next-hop keys listed under SUSPICIOUS_ROUTES_WHITELIST.')

# -------------------------------------------------------------------
# 3. BUSBAR
# -------------------------------------------------------------------
bus = manifest['audit']['systems']['BUSBAR']
bus_files = [
    REPO_ROOT / 'p31-cortex' / 'p31_safe_router.py',
    REPO_ROOT / 'p31-cortex' / 'affective_chemistry_app.py',
    REPO_ROOT / 'p31-cortex' / 'spoon_monitor_app.py',
    HOME / '.p31' / 'emergency-halt.sh',
    HOME / '.p31' / 'redboard-scram.sh',
]
bus_files_candidates = [
    [REPO_ROOT / 'p31-cortex' / 'p31_safe_router.py', 'contains' in ''],
    [REPO_ROOT / 'p31-cortex' / 'affective_chemistry_app.py', ''],
    [REPO_ROOT / 'p31-cortex' / 'spoon_monitor_app.py', ''],
    [HOME / '.p31' / 'abdicate.sh', ''],
    [HOME / '.p31' / 'emergency-halt.sh', ''],
    [REPO_ROOT / 'scripts' / 'p31-yardmaster.sh', ''],
    [REPO_ROOT / 'scripts' / 'p31-audit-scan.sh', ''],
    [REPO_ROOT / 'p31-cortex' / 'spoon_monitor_app.py', ''],
]
bus_files = [p for p, _ in bus_files_candidates if str(p).startswith(str(REPO_ROOT)) or str(p).startswith(str(HOME))]
# Keep only existing paths that are not handled under BUS_SAFETY_WARNINGS
skip = {REPO_ROOT / 'p31-cortex' / 'emergency_halt_system.py', REPO_ROOT / 'p31-cortex' / 'network_halt_system.py', REPO_ROOT / 'p31-cortex' / 'network_monitor.py'}
bus_files = [p for p in bus_files if p.exists() and p not in skip]
if not bus_files:
    bus['status'] = 'YELLOW'
    add('BUSBAR', 'high', 'BUSBAR component files missing',
        'No validator, affective, or monitor files present.', '; '.join(str(p) for p,_ in bus_files_candidates),
        'Restore missing BUSBAR core files.')
else:
    for p in bus_files:
        try:
            text = p.read_text(errors='ignore')
        except Exception:
            continue
        hits = re.findall(r'scram|redboard|reactor|submarine|SCRAM|RedBoard|REACTOR|SUBMARINE', text)
        if hits:
            bus['status'] = 'YELLOW'
            add('BUSBAR', 'medium', f'Legacy terminology in BUSBAR component {p.name}',
                f'Military/naval terms found: {hits}',
                str(p), 'Replace with plain language (halt, SystemHold, temperature).')
        if re.search(r'obscure|truncate|strip|redact|pseudoanonym|pii', text, re.IGNORECASE):
            bus['status'] = 'YELLOW' if bus['status'] == 'GREEN' else bus['status']
            add('BUSBAR', 'medium', f'PII-obscuring term found in BUSBAR component {p.name}',
                'Quarantine term obscures redaction handling in validator logic; raises inadvertent PII leakage risk.',
                str(p),
                'Sanitize the validator logic with a downstream redact/minimize cluster; never auto-discard operator-visible elements.')

# -------------------------------------------------------------------
# 4. COGNITIVE_PASSPORT
# -------------------------------------------------------------------
cp = manifest['audit']['systems']['COGNITIVE_PASSPORT']
cp_file = HOME / '.p31' / 'cognitive-passport.json'
cp_dir = HOME / '.p31' / 'cognitive-passport'
if not cp_file.exists():
    cp['status'] = 'RED'
    add('COGNITIVE_PASSPORT', 'critical', 'Cognitive passport state file missing',
        'Live operator state not persisted.', str(cp_file),
        'Initialize cognitive-passport.json with baseline schema.')
else:
    try:
        json.load(open(cp_file))
    except Exception as e:
        cp['status'] = 'RED'
        add('COGNITIVE_PASSPORT', 'critical', 'Cognitive passport JSON invalid',
            f'State file is not valid JSON: {e}', str(cp_file),
            'Repair JSON structure or reinitialize from baseline.')
    mode = cp_file.stat().st_mode
    if stat.S_IMODE(mode) != 0o600:
        cp['status'] = 'YELLOW'
        add('COGNITIVE_PASSPORT', 'high', 'Cognitive passport permissions not 600',
            f'File has permissions {oct(stat.S_IMODE(mode))}; should be 600.',
            f'{cp_file}:{oct(stat.S_IMODE(mode))}',
            f'chmod 600 {cp_file}')
if not cp_dir.exists():
    add('COGNITIVE_PASSPORT', 'medium', 'Cognitive passport directory missing',
        'Expected directory not found.', str(cp_dir),
        'Create directory for session logs and retired tasks.')
else:
    abdicate_files = list(cp_dir.glob('*.abdicate')) + list(cp_dir.glob('*.retired'))
    if not abdicate_files:
        add('COGNITIVE_PASSPORT', 'low', 'No retired task tombstones found',
            'Directory exists but contains no .abdicate or .retired files.',
            str(cp_dir), 'Verify tombstone writing is functional.')

canary = HOME / '.p31' / 'task-logs' / 'check.done'
if not canary.exists():
    add('COGNITIVE_PASSPORT', 'medium', 'Canary re-entry gate not cleared',
        'check.done missing; CANARY gate may block Track B/C.',
        str(canary),
        'Complete grounding task or use --force override.')

# -------------------------------------------------------------------
# 5. IDENTITY
# -------------------------------------------------------------------
idt = manifest['audit']['systems']['IDENTITY']
idt_dir = HOME / '.p31' / 'identity'
if not idt_dir.exists():
    idt['status'] = 'RED'
    add('IDENTITY', 'critical', 'IDENTITY system directory missing',
        'No identity directory found; auth/authz not materialized.',
        str(idt_dir),
        'Create identity directory with roles.yaml and admins.txt.')
else:
    for fname in ['roles.yaml', 'admins.txt', 'access.log']:
        f = idt_dir / fname
        if not f.exists():
            sev = 'high' if fname in ('roles.yaml', 'admins.txt') else 'medium'
            idt['status'] = 'YELLOW' if idt['status'] == 'GREEN' else idt['status']
            add('IDENTITY', sev, f'{fname} missing',
                f'Expected identity file {fname} not found.', str(f),
                f'Create {fname} with required content.')

# -------------------------------------------------------------------
# 6. SEMANTIC cross-check
# -------------------------------------------------------------------
sem = manifest['audit']['systems']['SEMANTIC']
legacy_hits = []
for root, dirs, files in os.walk(str(REPO_ROOT)):
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', 'dist', '__pycache__')]
    for fname in files:
        p = pathlib.Path(root) / fname
        try:
            if p.suffix.lower() in {'.py', '.sh', '.yaml', '.yml', '.md', '.ts', '.tsx', '.js', '.jsx', '.astro', '.json', '.toml'}:
                if file_contains_legacy(p):
                    legacy_hits.append(str(p))
        except Exception:
            pass
if legacy_hits:
    sem['status'] = 'YELLOW'
    add('SEMANTIC', 'medium', 'Legacy terminology in core system files',
        f'{len(legacy_hits)} files contain military/naval terms.',
        '; '.join(legacy_hits[:5]) + ('...' if len(legacy_hits) > 5 else ''),
        'Replace legacy terms with plain language equivalents across all files.')
else:
    sem['status'] = 'GREEN'

# -------------------------------------------------------------------
# Write manifest (matched YAML shape)
# -------------------------------------------------------------------
out = AUDIT_DIR / 'P31_CORE_AUDIT_MANIFEST.yaml'
with open(out, 'w') as f:
    f.write('audit:\n')
    f.write(f"  id: {manifest['audit']['id']}\n")
    f.write(f"  timestamp: {manifest['audit']['timestamp']}\n")
    f.write(f"  findings_total: {manifest['audit']['findings_total']}\n")
    f.write('  systems:\n')
    for sys_name in ['GROUND_TRUTH', 'BUSBAR', 'BUS_SAFETY_WARNINGS', 'SUSPICIOUS_ROUTES', 'COGNITIVE_PASSPORT', 'IDENTITY', 'SEMANTIC']:
        s = manifest['audit']['systems'][sys_name]
        f.write(f"    {sys_name}:\n")
        f.write(f"      status: {s['status']}\n")
        f.write(f"      findings:\n")
        if not s['findings']:
            f.write('      []\n')
        else:
            for finding in s['findings']:
                f.write(f"        - id: {finding['id']}\n")
                f.write(f"          severity: {finding['severity']}\n")
                f.write(f"          title: \"{finding['title']}\"\n")
                f.write(f"          description: \"{finding['description']}\"\n")
                f.write(f"          location: \"{finding['location']}\"\n")
                f.write(f"          fix: \"{finding['fix']}\"\n")
                f.write(f"          status: {finding['status']}\n")

findings = manifest['audit']['findings_total']
print(f"Audit complete: {audit_id}")
print(f"Findings: {findings}")
print(f"Manifest: {out}")
for sys_name in ['GROUND_TRUTH', 'BUSBAR', 'BUS_SAFETY_WARNINGS', 'SUSPICIOUS_ROUTES', 'COGNITIVE_PASSPORT', 'IDENTITY', 'SEMANTIC']:
    s = manifest['audit']['systems'][sys_name]
    print(f"  {sys_name}: {s['status']}")
exit(min(findings, 127))
