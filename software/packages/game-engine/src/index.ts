/**
 * @module @p31/game-engine
 * @description Geodesic building game engine for the P31 assistive technology platform.
 *
 * Built on @p31/node-zero (identity, bonds) and @p31/love-ledger (LOVE).
 * Maxwell rigidity, 7 seed challenges, player progression, ledger adapter.
 *
 * @version 0.1.0-alpha.0
 */

export * from "./types.js";
export * from "./geometry.js";
export * from "./structures.js";
export * from "./challenges.js";
export * from "./player.js";
export { GameEngine } from "./engine.js";
export type { LedgerAdapter, GameEngineConfig } from "./engine.js";
