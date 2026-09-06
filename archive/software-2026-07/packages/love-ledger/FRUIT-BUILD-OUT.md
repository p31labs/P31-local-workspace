# love-ledger + Orchestrator — FRUIT Build-out Plan

## Current State
- Location: `software/packages/love-ledger/`
- Tests: 4 test files in `__tests__/`
- Build: TypeScript compiled to `dist/`
- Maturity: SPROUT (avg 3.0) → FRUIT target

## Gaps to Close

### 1. Version Export
- ✅ `src/version.ts` created (exports VERSION + getVersion)
- ✅ `src/version.test.ts` created

### 2. Health Module
- Package libraries don't use HTTP health endpoints
- Add `src/lib/health.ts` with package-level health check
- Validate peer dependency integrity

### 3. Documentation
- ✅ README.md with PMM badge marker
- ✅ DEPLOY.md (build + npm publish)
- ✅ RUNBOOK.md

### 4. Test Coverage
- Current: 4 test files
- Need: coverage >60% for FRUIT
- Add edge case tests for ledger, vesting, wallet

### 5. CI Pipeline
- Add `.github/workflows/ci-love-ledger.yml`
- Lint → test → build → coverage gate 70%

## Next Steps
1. Run `npm test` to verify current suite passes
2. Add missing edge case tests
3. Create CI workflow
4. Regenerate maturity badges
5. Verify FRUIT criteria met
