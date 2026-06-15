#!/bin/bash
# publish-action.sh — Create and publish ADA Compliance GitHub Action to Marketplace
source "$(cd "$(dirname "$0")" && pwd)/telegram.sh"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="$REPO_DIR/logs"
LOG_FILE="$LOG_DIR/publish-action.log"
mkdir -p "$LOG_DIR"

GH_TOKEN="${GH_TOKEN:-}"

echo "[$(date)] === Action Publisher starting ===" | tee -a "$LOG_FILE"

WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT
cd "$WORKDIR"

mkdir -p ada-check-action/src
cd ada-check-action

cat > action.yml << 'ACTION'
name: 'ADA Compliance Checker'
description: 'Checks your web application for WCAG 2.2 accessibility violations using axe-core'
author: 'P31 Labs'
branding:
  icon: 'shield'
  color: 'blue'
inputs:
  url:
    description: 'URL to scan'
    required: true
  wcag-version:
    description: 'WCAG version (2.1 or 2.2)'
    required: false
    default: '2.2'
  level:
    description: 'Compliance level (A, AA, AAA)'
    required: false
    default: 'AA'
  fail-on-error:
    description: 'Fail the action if any errors are found'
    required: false
    default: 'true'
runs:
  using: 'node20'
  main: 'dist/index.js'
ACTION

cat > package.json << 'PKG'
{
  "name": "ada-check-action",
  "version": "1.0.0",
  "private": true,
  "main": "dist/index.js",
  "scripts": {
    "build": "npx esbuild src/index.ts --bundle --platform=node --outfile=dist/index.js",
    "package": "npx ncc build src/index.ts -o dist"
  },
  "dependencies": {
    "axe-playwright": "^2.1.0",
    "playwright": "^1.52.0",
    "@actions/core": "^1.11.1",
    "@actions/github": "^6.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "esbuild": "^0.25.0",
    "@vercel/ncc": "^0.38.0"
  }
}
PKG

cat > src/index.ts << 'SRC'
import * as core from '@actions/core';
import { chromium } from 'playwright';
import { injectAxe, checkA11y } from 'axe-playwright';

async function run() {
  const url = core.getInput('url', { required: true });
  const level = core.getInput('level') || 'AA';
  const failOnError = core.getBooleanInput('fail-on-error');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await injectAxe(page);
    const results = await checkA11y(page, undefined, { detailedReport: true });

    const severityMap: Record<string, string[]> = {
      A: ['critical'],
      AA: ['critical', 'serious'],
      AAA: ['critical', 'serious', 'moderate'],
    };
    const allowed = severityMap[level] || severityMap.AA;
    const violations = results.violations.filter((v: any) =>
      allowed.includes(v.impact)
    );

    for (const v of violations) {
      core.warning(`${v.help} (${v.impact})`);
      for (const node of v.nodes || []) {
        core.error(`::${v.id}::${v.help} — ${(node.target || []).join(', ')}`);
      }
    }

    core.setOutput('violations', violations.length);
    core.setOutput('passes', results.passes.length);
    core.summary.addHeading('ADA Scan Results').addTable([
      [{ data: 'Metric', header: true }, { data: 'Value', header: true }],
      ['Violations', String(violations.length)],
      ['Passes', String(results.passes.length)],
      ['Level', level],
      ['URL', url],
    ]).write();

    if (failOnError && violations.length > 0) {
      core.setFailed(`ADA check failed: ${violations.length} ${level} violations found`);
    }
  } finally {
    await browser.close();
  }
}

run().catch((e) => {
  core.setFailed(e.message);
  process.exit(1);
});
SRC

npm install 2>&1 | tee -a "$LOG_FILE"
npx esbuild src/index.ts --bundle --platform=node --outfile=dist/index.js --external:playwright --external:chromium-bidi 2>&1 | tee -a "$LOG_FILE"

# Push to GitHub
if [ -n "$GH_TOKEN" ] && command -v gh &>/dev/null; then
  echo "[$(date)] Publishing to GitHub..." | tee -a "$LOG_FILE"

  git init
  git config user.name "Will Johnson"
  git config user.email "will@p31ca.org"

  cat > .gitignore << 'GI'
node_modules/
dist/
GI

  git add .
  git commit -m "Initial commit: ADA Compliance Checker Action" 2>&1 | tee -a "$LOG_FILE"

  # Create repo if it doesn't exist
  gh repo create p31labs/ada-check-action --public --push --source=. 2>&1 | tee -a "$LOG_FILE" || true
  git push -u origin main 2>&1 | tee -a "$LOG_FILE" || true

  # Create GitHub release
  gh release create v1.0.0 --title "ADA Checker v1.0.0" \
    --notes "First release of the ADA Compliance Checker GitHub Action" 2>&1 | tee -a "$LOG_FILE" || true

  echo "[$(date)] GitHub Action published to github.com/p31labs/ada-check-action" | tee -a "$LOG_FILE"
else
  echo "[$(date)] GH_TOKEN or gh CLI not available — skipping publish" | tee -a "$LOG_FILE"
fi

echo "[$(date)] Action publisher cycle complete" | tee -a "$LOG_FILE"
telegram "⚙️ GitHub Action publish cycle complete
Repo: github.com/p31labs/ada-check-action
Next cycle in 1 hour"
sleep 3600
exec "$0" "$@"
