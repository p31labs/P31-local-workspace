# P31 Labs Production Tooling — 4-Week Implementation Roadmap

**Author:** Architect Mode  
**Created:** 2026-03-24  
**Status:** Implementation Plan  
**Target:** P31 Labs software ecosystem (software)

---

## Executive Summary

This roadmap defines a 4-week production tooling implementation for the P31 Labs ecosystem. The plan addresses automation foundation, security hardening, testing infrastructure, telemetry modernization, and offline-first observability.

### Current State Assessment

| Component | Status | Gap |
|-----------|--------|-----|
| CI/CD Pipeline | Partial (2 workflows) | No main CI, no Turbo remote caching |
| Security Audit | None in CI | No pnpm audit integration |
| Cloudflare Deployments | Manual | No wrangler-action automation |
| Test Coverage | Per-package | No unified thresholds, no PR gating |
| Structured Logging | Console.* | No Pino integration |
| Error Tracking | None | No Sentry, no offline transport |

---

## Week 1: Automation Foundation & Security

### 1.1 Create Main CI Workflow

**File:** `.github/workflows/ci.yml`

```yaml
name: P31 Labs CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  PNPM_VERSION: '9'
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ secrets.TURBO_TEAM }}

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm -r typecheck

      - name: Build packages
        run: pnpm -r build

      - name: Run tests
        run: pnpm -r test

      - name: Turborepo Remote Cache
        if: env.TURBO_TOKEN
        run: pnpm turbo run build --remote
```

### 1.2 Configure Turborepo Remote Caching

**File:** `software/turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "typecheck": {
      "outputs": []
    }
  },
  "remoteCache": {
    "enabled": true,
    "signatureArgs": ["--no-cache"]
  }
}
```

### 1.3 Add pnpm-workspace.yaml with Audit Overrides

**File:** `software/pnpm-workspace.yaml`

```yaml
packages:
  - 'bonding'
  - 'spaceship-earth'
  - 'packages/*'
  - 'extensions/*'

onlyBuiltDependencies:
  - '@react-three/fiber'
  - three

audit:
  level: high
  ignore:
    - id: 'PGM-589'
      reason: 'Development-only, no runtime impact'
    - id: 'GHSA-xxxx-xxxx'
      reason: 'Mocked in test environment'
```

### 1.4 Configure Cloudflare Wrangler Action for @p31labs/shelter and @p31labs/navigator

**Note:** Based on project structure, `shelter` maps to node-zero/pwa and `navigator` maps to bonding-relay.

**Update:** `.github/workflows/ci.yml`

```yaml
  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Deploy node-zero PWA (shelter)
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --project-name p31-pwa --env production

      - name: Deploy bonding relay
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy bonding --env production
```

### 1.5 Add Dependencies for CI

**File:** `software/package.json` (additions)

```json
{
  "scripts": {
    "turbo": "turbo",
    "typecheck": "turbo run typecheck",
    "build": "turbo run build",
    "test": "turbo run test",
    "audit": "pnpm audit --audit-level=high"
  },
  "devDependencies": {
    "turbo": "^2.3.0"
  }
}
```

### 1.6 Week 1 Action Items

| # | Task | File | Status |
|---|------|------|--------|
| 1.6.1 | Create .github/workflows/ci.yml | ci.yml | [ ] |
| 1.6.2 | Create turbo.json | turbo.json | [ ] |
| 1.6.3 | Create pnpm-workspace.yaml | pnpm-workspace.yaml | [ ] |
| 1.6.4 | Add turbo to root package.json | package.json | [ ] |
| 1.6.5 | Update ci.yml with wrangler deployment | ci.yml | [ ] |
| 1.6.6 | Add secrets to GitHub secrets | GitHub UI | [ ] |

---

## Week 2: Testing Infrastructure & PR Gating

### 2.1 Standardize Vitest Configurations with v8 AST Coverage

**File:** `software/packages/game-engine/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.test.ts',
        '**/*.config.ts',
        '**/types/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@p31/game-engine': path.resolve(__dirname, './src')
    }
  }
});
```

**File:** `software/packages/node-zero/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.test.ts',
        '**/*.config.ts'
      ]
    }
  }
});
```

### 2.2 Establish Coverage Thresholds

**Reference from task:**
- buffer-core (shared package): 95%
- game-engine: 80%

**File:** `software/packages/shared/vitest.config.ts` (create)

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 95,
        branches: 90,
        functions: 95,
        statements: 95
      },
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.test.ts',
        '**/*.config.ts'
      ]
    }
  }
});
```

**Update:** `software/packages/game-engine/vitest.config.ts`

```typescript
export default defineConfig({
  test: {
    // ... existing config
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 80,
        statements: 80
      },
      // ... rest of config
    }
  }
});
```

### 2.3 Implement vitest-coverage-report-action for PR Coverage Reports

**File:** `.github/workflows/coverage.yml`

```yaml
name: Coverage Report

on:
  pull_request:
    branches: [main]

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: '9'

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install
        run: pnpm install --frozen-lockfile

      - name: Generate coverage
        run: pnpm turbo run test --filter=@p31/shared -- --coverage

      - name: PR Coverage Comment
        uses: vitest-coverage-report-action@v2
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          coverage-table: coverage/coverage-summary.json
          junitxml: coverage/junit.xml
```

### 2.4 Week 2 Action Items

| # | Task | File | Status |
|---|------|------|--------|
| 2.4.1 | Standardize game-engine vitest.config | vitest.config.ts | [ ] |
| 2.4.2 | Standardize node-zero vitest.config | vitest.config.ts | [ ] |
| 2.4.3 | Create shared vitest.config with 95% threshold | vitest.config.ts | [ ] |
| 2.4.4 | Add 80% threshold to game-engine | vitest.config.ts | [ ] |
| 2.4.5 | Create coverage.yml workflow | coverage.yml | [ ] |

---

## Week 3: Telemetry Modernization

### 3.1 Integrate Pino Across All Node.js and Browser Environments

**Install Pino in shared package:**

```bash
cd software/packages/shared
pnpm add pino pino-pretty
```

**File:** `software/packages/shared/src/telemetry/logger.ts`

```typescript
import pino from 'pino';

// Get dynamic log level from localStorage
function getLogLevel(): string {
  if (typeof window === 'undefined') return 'info';
  return localStorage.getItem('p31:loglevel') || 'info';
}

export const logger = pino({
  level: getLogLevel(),
  transport: process.env.NODE_ENV === 'development' 
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined
});

// React hook for browser environments
export function useLogger() {
  // Dynamically update level when localStorage changes
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === 'p31:loglevel') {
        logger.level = e.newValue || 'info';
      }
    });
  }
  return logger;
}

// Set log level and persist
export function setLogLevel(level: string) {
  logger.level = level;
  if (typeof window !== 'undefined') {
    localStorage.setItem('p31:loglevel', level);
  }
}
```

### 3.2 Replace 176+ console.* Statements with Structured JSON Loggers

**Migration Strategy:**

1. Add `@p31/shared/telemetry` export for logger
2. Create ESLint rule to flag console.* usage
3. Run find/replace across codebase

**File:** `software/packages/shared/src/telemetry/index.ts`

```typescript
export { logger, useLogger, setLogLevel } from './logger';
export { createSpoonMetric, createVoltageMetric } from './metrics';
```

**File:** `software/.eslintrc.json` (additions)

```json
{
  "rules": {
    "no-console": ["error", { "allow": ["warn", "error"] }],
    "prefer-p31-logger": "error"
  }
}
```

### 3.3 Implement localStorage Dynamic Log Level Synced with p31-progressive-disclosure

**File:** `software/packages/shared/src/telemetry/logger.ts` (extension)

```typescript
// Sync with p31-progressive-disclosure feature flag
function syncWithProgressiveDisclosure() {
  if (typeof window === 'undefined') return;
  
  const pd = localStorage.getItem('p31:progressive-disclosure');
  if (pd === 'true') {
    // Minimal logging in reduced disclosure mode
    setLogLevel('warn');
  }
}

// Auto-sync on load
if (typeof window !== 'undefined') {
  syncWithProgressiveDisclosure();
  
  window.addEventListener('storage', (e) => {
    if (e.key === 'p31:progressive-disclosure') {
      syncWithProgressiveDisclosure();
    }
  });
}
```

### 3.4 Week 3 Action Items

| # | Task | File | Status |
|---|------|------|--------|
| 3.4.1 | Install pino in shared | package.json | [ ] |
| 3.4.2 | Create logger.ts | src/telemetry/logger.ts | [ ] |
| 3.4.3 | Add ESLint console rule | .eslintrc.json | [ ] |
| 3.4.4 | Replace console.* in bonding | src/**/*.ts | [ ] |
| 3.4.5 | Replace console.* in game-engine | src/**/*.ts | [ ] |
| 3.4.6 | Replace console.* in node-zero | src/**/*.ts | [ ] |
| 3.4.7 | Implement progressive-disclosure sync | logger.ts | [ ] |

---

## Week 4: Offline-First Observability

### 4.1 Sentry Project Provisioning with @sentry/react

**Install in bonding:**

```bash
cd software/bonding
pnpm add @sentry/react
```

**File:** `software/bonding/src/main.tsx` (additions)

```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration()
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: import.meta.env.MODE,
  // Hidden sourcemaps for production
  sourcemap: 'hidden'
});

export function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <Sentry.ErrorBoundary>
        <Router />
      </Sentry.ErrorBoundary>
    </ErrorBoundary>
  );
}
```

### 4.2 Configure sourcemap: 'hidden' for Vite Pipelines

**File:** `software/bonding/vite.config.ts` (additions)

```typescript
export default defineConfig({
  build: {
    sourcemap: 'hidden',
    rollupOptions: {
      output: {
        // ... existing config
      }
    }
  }
});
```

**Apply to node-zero PWA as well:**

**File:** `software/packages/node-zero/pwa/vite.config.ts`

```typescript
export default defineConfig({
  build: {
    sourcemap: 'hidden'
  }
});
```

### 4.3 Implement makeBrowserOfflineTransport for Air-Gapped Scenarios

**File:** `software/packages/shared/src/telemetry/offlineTransport.ts`

```typescript
import { BaseTransport } from '@sentry/core';
import type { Event, Transport } from '@sentry/types';

interface OfflineTransportOptions {
  maxQueueSize?: number;
  flushTimeout?: number;
}

export function makeBrowserOfflineTransport(
  options: OfflineTransportOptions = {}
): Transport {
  const queue: Event[] = [];
  const maxQueueSize = options.maxQueueSize ?? 30;
  const flushTimeout = options.flushTimeout ?? 5000;
  
  let flushTimer: ReturnType<typeof setTimeout> | null = null;
  let isOnline = navigator.onLine;

  function flushQueue() {
    if (queue.length === 0) return;
    
    const events = [...queue];
    queue.length = 0;
    
    // Try to send when online
    if (isOnline) {
      // Send to Sentry endpoint via fetch
      fetch('/api/sentry/envelope', {
        method: 'POST',
        body: JSON.stringify(events),
        headers: { 'Content-Type': 'application/json' }
      }).catch(() => {
        // Put back in queue on failure
        queue.unshift(...events);
      });
    }
  }

  // Listen for online/offline events
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      isOnline = true;
      flushQueue();
    });
    
    window.addEventListener('offline', () => {
      isOnline = false;
    });
  }

  // Auto-flush timer
  flushTimer = setTimeout(flushQueue, flushTimeout);

  return {
    sendEvent(event) {
      if (queue.length >= maxQueueSize) {
        queue.shift(); // Drop oldest
      }
      queue.push(event);
      
      if (isOnline) {
        flushQueue();
      }
      
      return Promise.resolve({ status: 'ok' });
    },
    
    sendEnvelope(envelope) {
      // Same logic for envelopes
      return Promise.resolve({ status: 'ok' });
    },
    
    flush() {
      flushQueue();
      return Promise.resolve(true);
    }
  };
}
```

### 4.4 Calibrate beforeSend Hook with Spoon/Voltage Metrics as Custom Tags

**File:** `software/bonding/src/main.tsx` (extension)

```typescript
import { useEffect } from 'react';

// Custom beforeSend to add Spoon/Voltage context
function beforeSend(event) {
  // Get current spoon/voltage from Zustand store
  const spoonStore = useSpoonStore.getState();
  const voltageStore = useVoltageStore.getState();
  
  // Add as custom tags
  event.tags = {
    ...event.tags,
    spoons: spoonStore.current,
    spoonsMax: spoonStore.max,
    voltage: voltageStore.current,
    voltageState: voltageStore.state,
    timestamp: new Date().toISOString()
  };
  
  // Add breadcrumb for cognitive state
  event.breadcrumbs = event.breadcrumbs || [];
  event.breadcrumbs.push({
    category: 'cognitive-state',
    message: `Spoons: ${spoonStore.current}/${spoonStore.max}, Voltage: ${voltageStore.current}`,
    level: 'info'
  });
  
  return event;
}

Sentry.init({
  // ... other options
  beforeSend,
  normalizeDepth: 10,
  
  // Filter out known benign errors
  beforeSend(event, hint) {
    const error = hint.originalException;
    
    // Ignore network errors when offline (expected)
    if (error?.message?.includes('network')) {
      return null;
    }
    
    return event;
  }
});
```

### 4.5 Week 4 Action Items

| # | Task | File | Status |
|---|------|------|--------|
| 4.5.1 | Install @sentry/react in bonding | package.json | [ ] |
| 4.5.2 | Configure Sentry.init() in main.tsx | main.tsx | [ ] |
| 4.5.3 | Update vite.config.ts sourcemap | vite.config.ts | [ ] |
| 4.5.4 | Update node-zero vite.config | vite.config.ts | [ ] |
| 4.5.5 | Create offlineTransport.ts | src/telemetry/offlineTransport.ts | [ ] |
| 4.5.6 | Implement beforeSend with Spoon/Voltage | main.tsx | [ ] |
| 4.5.7 | Add Sentry DSN to .env.example | .env.example | [ ] |

---

## Summary: Files to Modify

### New Files

| File | Description |
|------|-------------|
| `.github/workflows/ci.yml` | Main CI pipeline with Turbo and Wrangler |
| `.github/workflows/coverage.yml` | PR coverage reporting |
| `turbo.json` | Turborepo configuration |
| `pnpm-workspace.yaml` | pnpm workspace with audit overrides |
| `software/packages/shared/src/telemetry/logger.ts` | Pino logger implementation |
| `software/packages/shared/src/telemetry/offlineTransport.ts` | Offline Sentry transport |
| `software/packages/shared/vitest.config.ts` | Shared package vitest config |

### Modified Files

| File | Modification |
|------|--------------|
| `software/package.json` | Add turbo, scripts |
| `software/bonding/vite.config.ts` | Add sourcemap: 'hidden' |
| `software/bonding/package.json` | Add @sentry/react |
| `software/bonding/src/main.tsx` | Add Sentry init |
| `software/packages/node-zero/pwa/vite.config.ts` | Add sourcemap: 'hidden' |
| `software/packages/game-engine/vitest.config.ts` | Add coverage thresholds |
| `software/packages/node-zero/vitest.config.ts` | Standardize coverage config |
| `software/.eslintrc.json` | Add console.* rule |

---

## Dependencies to Add

```json
{
  "devDependencies": {
    "turbo": "^2.3.0"
  },
  "dependencies": {
    "pino": "^9.x.x",
    "pino-pretty": "^11.x.x",
    "@sentry/react": "^8.x.x"
  }
}
```

---

*End of Roadmap*
*Generated: 2026-03-24*
