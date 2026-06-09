/**
 * SpIn Mesh — Combined Worker for Matchmaking and Logistics Durable Objects
 *
 * This worker exports both Durable Objects needed for the SpIn Mesh system:
 * - MatchmakingDO: Handles intent matching and cycle detection
 * - HandoverDO: Coordinates physical handshakes and key exchange
 */

// Import Matchmaking DO implementation
export { default as MatchmakingDO } from '../matchmaking-do/index.js';

// Import Logistics DO implementation  
export { default as HandoverDO } from '../logistics-do/index.js';