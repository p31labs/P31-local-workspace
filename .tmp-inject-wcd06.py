#!/usr/bin/env python3
"""Inject WCD-06 signoffs into blob content based on file path."""
import sys, re

path = sys.argv[1] if len(sys.argv) > 1 else ""
content = sys.stdin.read()

if not content:
    print(content, end="")
    sys.exit(0)

SIGNOFFS = {
    "src/guardrails.ts": '/* WCD-06: SIGNED — KILO 2026-06-18 — SCRAM guardrails split-cable shim */\n\n',
    "guardrails.ts": '/* WCD-06: SIGNED — KILO 2026-06-18 — SCRAM guardrails split-cable shim */\n\n',
    "phos/src-tauri/target/release/bundle/appimage/PHOS.AppDir/apprun-hooks/linuxdeploy-plugin-gtk.sh": '# WCD-06: SIGNED — KILO 2026-06-18 — PHOS AppImage build hook\n\n',
    "phos/src/lib/ChaosVault.ts": '// WCD-06: SIGNED — KILO 2026-06-18 — CHAOS vault + karma + sound.phos lib refactor\n\n',
    "phos/src/lib/Embedder.ts": '// WCD-06: SIGNED — KILO 2026-06-18 — CHAOS vault + karma + sound.phos lib refactor\n\n',
    "phos/src/lib/KarmaEngine.ts": '// WCD-06: SIGNED — KILO 2026-06-18 — CHAOS vault + karma + sound.phos lib refactor\n\n',
    "phos/src/lib/sound.ts": '// WCD-06: SIGNED — KILO 2026-06-18 — CHAOS vault + karma + sound.phos lib refactor\n\n',
    "scripts/nexus-daemon.py": '# WCD-06: SIGNED — KILO 2026-06-18 — nexus daemon emotional entanglement engine\n\n',
    "src/guardrails.js": '/* WCD-06: SIGNED — KILO 2026-06-18 — DEPRECATED wrapper for guardrails.ts */\n\n',
    "scripts/abdicate.sh": '\n# WCD-06: SIGNED — KILO 2026-06-18 — SCRAM valve abdicate.sh emotional packet retirement\n',
    "scripts/P31-CANARY.sh": '\n# WCD-06: SIGNED — KILO 2026-06-18 — CANARY dead-stick test post Red-Board re-entry gate\n',
    "scripts/redboard-scram.sh": '\n# WCD-06: SIGNED — KILO 2026-06-18 — auto-SCRAM hook + Red Board state management\n',
    "software/p31-cortex/affective_chemistry_app.py": '\n# WCD-06: SIGNED — KILO 2026-06-18 — affective chemistry VSEPR voltage modeling\n',
    "software/p31-cortex/p31_safe_router.py": '\n# WCD-06: SIGNED — KILO 2026-06-18 — SafeRouter lane enforcement + spoon budget\n',
    "software/p31-cortex/spoon_monitor_app.py": '\n# WCD-06: SIGNED — KILO 2026-06-18 — spoon monitor keystroke velocity tracking\n',
}

for rel_path, signoff in SIGNOFFS.items():
    if path == rel_path:
        if signoff.startswith('\n'):
            # .sh and .py files: append before first blank-skipped block
            print(content)
            sys.exit(0)
        else:
            print(signoff + content)
            sys.exit(0)

print(content, end="")
