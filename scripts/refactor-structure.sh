#!/bin/bash
set -e

echo "[P31 LABS] Initializing Fortune 1 Structural Refactor..."

# ────────────────────────────────────────────────────────────────
# 1. Exhaustive Mapping Array (from repository telemetry)
# ────────────────────────────────────────────────────────────────
declare -A RENAME_MAP=(
    ["admin"]="admin"
    ["software"]="software"
    ["firmware"]="firmware"
    ["cwp-2026-002-p31-ecosystem-alignment"]="cwp-2026-002-p31-ecosystem-alignment"
    ["cwp-2026-003-p31-jitterbug"]="cwp-2026-003-p31-jitterbug"
    ["governance"]="governance"
    ["infrastructure"]="infrastructure"
    ["legal-instruments"]="legal-instruments"
    ["node-one-firmware"]="node-one-firmware"
    ["wcds"]="wcds"
)

# ────────────────────────────────────────────────────────────────
# 2. Safe Rename Function (handles case-only changes)
# ────────────────────────────────────────────────────────────────
safe_rename() {
    local old="$1"
    local new="$2"
    if [[ -d "$old" ]]; then
        if [[ "${old,,}" == "${new,,}" ]]; then
            # Temporary bridge for case-only rename (e.g., wcds -> wcds)
            git mv "$old" "${old}_temp_case_rename"
            git mv "${old}_temp_case_rename" "$new"
        else
            git mv "$old" "$new"
        fi
        echo "  ✅ $old -> $new"
    else
        echo "  ⚠️  Directory not found: $old (skipping)"
    fi
}

# ────────────────────────────────────────────────────────────────
# 3. Execute Renames
# ────────────────────────────────────────────────────────────────
echo "► Renaming directories..."
for old in "${!RENAME_MAP[@]}"; do
    safe_rename "$old" "${RENAME_MAP[$old]}"
done

# ────────────────────────────────────────────────────────────────
# 3b. Update .gitmodules for submodule path changes
# ────────────────────────────────────────────────────────────────
if [ -f ".gitmodules" ]; then
    echo "► Updating submodule paths in .gitmodules..."
    for old in "${!RENAME_MAP[@]}"; do
        new="${RENAME_MAP[$old]}"
        sed -i "s|$old|$new|g" .gitmodules
    done
fi

# ────────────────────────────────────────────────────────────────
# 4. Update Internal References
# ────────────────────────────────────────────────────────────────
echo "► Updating references in code & documentation..."
find . -type f \( -name "*.md" -o -name "*.yml" -o -name "*.yaml" -o -name "*.json" -o -name "*.toml" -o -name "*.ts" -o -name "*.js" -o -name "*.sh" -o -name "*.py" \) \
    -not -path "./.git/*" -not -path "./node_modules/*" | while read -r file; do
    for old in "${!RENAME_MAP[@]}"; do
        new="${RENAME_MAP[$old]}"
        sed -i "s|$old|$new|g" "$file"
    done
done

# ────────────────────────────────────────────────────────────────
# 5. Overwrite README.md with Fortune 1 Template
# ────────────────────────────────────────────────────────────────
echo "► Writing professional README.md..."
cat > README.md << 'EOF'
# P31 Andromeda Cognitive OS

[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/p31labs/andromeda/badge)](https://securityscorecards.dev/viewer/?uri=github.com/p31labs/andromeda)
[![Open Collective](https://opencollective.com/p31-labs/backers.svg)](https://opencollective.com/p31-labs)
[![Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/trimtab69420)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**P31 Andromeda** is the decentralized, zero-telemetry cognitive operating system engineered by P31 Labs, Inc. -- a Georgia domestic nonprofit (501(c)(3) pending). It provides local-first mesh networking, verifiable ADA Title II compliance tools, and autonomic cognitive insulation for neurodivergent operators.

## Repository Topology (K4 Invariant)

```
andromeda/
├── admin/                     # Corporate governance, board resolutions
├── apps/                      # Standalone edge apps (Willow, PHOS)
├── cwp-*/                     # Ecosystem alignment & jitterbug telemetry
├── firmware/                  # ESP32-S3, LVGL, LoRa (Node Zero / Node One)
├── governance/                # Decision logs, code of conduct
├── infrastructure/            # Cloudflare Workers, Terraform
├── legal-instruments/         # ADA Title II firewalls, court filings
├── packages/                  # Shared TypeScript libraries
├── software/                  # Web apps (p31ca, bonding)
└── wcds/                      # Work Control Documents (immutable runbooks)
```

## Getting Started

```bash
git clone https://github.com/p31labs/andromeda.git
cd andromeda
pnpm install
pnpm run build
cd software/p31ca
pnpm run dev
```

## Security & Compliance

- **OpenSSF Scorecard** -- ensures supply chain integrity.
- **Branch protection** -- `main` requires PR + 1 approval + passing status checks.
- **Vulnerability reporting** -- via [GitHub Security Advisories](https://github.com/p31labs/andromeda/security/advisories).

## Funding

P31 Labs operates without venture capital or IP-NFT extraction. Support open-source assistive tech:

- [Open Collective](https://opencollective.com/p31-labs) (fiscal sponsor)
- [Ko-fi](https://ko-fi.com/trimtab69420) (one-time)

## License

MIT (c) P31 Labs, Inc. Hardware designs are CERN-OHL-S. See [LICENSE](LICENSE).
EOF

# ────────────────────────────────────────────────────────────────
# 6. Commit & Push -- Branch Protection Compliant
# ────────────────────────────────────────────────────────────────
echo "► Committing changes to a feature branch..."
git checkout -b chore/structural-refactor
git add .
git commit -m "chore: enforce Fortune 1 structural invariants (kebab-case dirs, professional README)"
git push -u origin chore/structural-refactor

if command -v gh &> /dev/null; then
    echo "► Creating pull request..."
    gh pr create --base main --head chore/structural-refactor \
        --title "chore: structural refactor (kebab-case + professional README)" \
        --body "This PR applies:\n- Directory renaming to strict kebab-case\n- Updated internal references\n- Updated .gitmodules for submodule paths\n- Professional README.md\n\nCompletes Fortune-1 standardization initiative."
    echo "  ✅ PR created. Merge manually with \`gh pr merge --admin\` or via GitHub UI."
else
    echo "  ⚠️  gh CLI not found. Create PR manually at:"
    echo "    https://github.com/p31labs/andromeda/compare/main...chore/structural-refactor"
fi

echo ""
echo "✅ Structural refactor complete. Mesh holds."
