# Accessibility Baseline — June 9, 2026

## Environment Note
aXe CLI requires a browser (Chrome/Chromium), which is not available in this headless Crostini environment. Full aXe scans will be run on June 11+ when browser access is available.

## HTTP Header Audit

### p31ca.org ✅
- **Status:** 200
- **CSP:** `default-src 'self'; script-src ... 'unsafe-inline' ...; style-src 'self' 'unsafe-inline' ...`
- **HSTS:** `max-age=31536000; includeSubDomains; preload`
- **Permissions Policy:** camera=(), microphone=(), geolocation=()
- **Referrer Policy:** `strict-origin`
- **html lang="en"** — correct
- **data-p31-appearance="hub"** — correct
- **color-scheme: dark** — correct

### phosphorus31.org ✅
- **Status:** 200
- **CSP:** Strong CSP with Stripe frame-src for donations
- **HSTS:** Present with preload
- **Permissions Policy:** Blocked
- **Semantic HTML:** Schema.org JSON-LD for NGO type
- **Open Graph / Twitter Card:** Present
- **html lang="en"** — correct
- **theme-color:** `#2A9D8F`

### bonding.p31ca.org ✅
- **Status:** 200
- **CSP:** Present (allows WebSocket + blob for Three.js)
- **HSTS:** Present with preload
- **Permissions Policy:** Blocked
- **Minimal initial HTML** (React SPA — rest rendered client-side)

## Planned aXe Runs (June 11+)
```bash
npx @axe-core/cli https://p31ca.org --save accessibility-reports/baseline-p31ca.json
npx @axe-core/cli https://phosphorus31.org --save accessibility-reports/baseline-phosphorus31.json
npx @axe-core/cli https://bonding.p31ca.org --save accessibility-reports/baseline-bonding.json
```
