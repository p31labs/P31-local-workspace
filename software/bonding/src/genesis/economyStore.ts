// Re-exports from @p31/shared — WCD-M02
// Canonical implementation promoted to packages/shared/src/economy/economyStore.ts
// Zero behavior change. All bonding imports from this path continue to work.
// PATCH 4 (2026-03-27): Added initLoveSync export for cloud sync bridge.
export { useEconomyStore, initLoveSync } from '@p31/shared/economy';
