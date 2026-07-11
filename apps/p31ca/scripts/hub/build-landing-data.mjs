// Stub: landing-data build step for p31ca postinstall.
// Original scripts/hub/build-landing-data.mjs was missing (ERR_MODULE_NOT_FOUND
// on `pnpm install` postinstall), causing every install to fail at the hook.
// This no-op preserves the postinstall contract until the real generator is
// restored. See CWP-2026-009 install-hygiene notes (deep-research diagnosis 2026-07-11).
process.exit(0);
