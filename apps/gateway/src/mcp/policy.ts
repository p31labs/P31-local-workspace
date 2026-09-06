/**
 * @file policy.ts — Tool access control policy for the P31 gateway.
 *
 * Defines which tools are available to each trust tier.
 * Bronze: read-only (getLoveBalance, getState, getTrustTier)
 * Silver: read + moderate writes (adds setSpoonLevel)
 * Gold: full access (adds aiProxy)
 *
 * Future: load from KV or env for dynamic updates.
 */

import type { ToolSchema } from './catalog.js';

// Trust tier → allowed tool names (explicit allowlist)
const TRUST_TIER_POLICY: Record<string, string[]> = {
  bronze: ['getLoveBalance', 'getState', 'getTrustTier'],
  silver: ['getLoveBalance', 'getState', 'getTrustTier', 'setSpoonLevel'],
  gold: ['getLoveBalance', 'getState', 'getTrustTier', 'setSpoonLevel', 'aiProxy'],
  // 'admin' can be added for full access (all tools)
};

// Tools available to unauthenticated sessions (no session ID)
const PUBLIC_TOOLS = ['getLoveBalance', 'getState'];

/**
 * Filter the full tool catalog based on the session's trust tier.
 * @param tools - Full tool catalog (from catalog.ts)
 * @param trustTier - Current trust tier (bronze | silver | gold)
 * @returns Filtered tool array
 */
export function filterTools(tools: ToolSchema[], trustTier?: string): ToolSchema[] {
  if (!trustTier || !TRUST_TIER_POLICY[trustTier]) {
    // Fallback: public tools for unknown tiers or missing session
    return tools.filter(t => PUBLIC_TOOLS.includes(t.name));
  }
  const allowedNames = TRUST_TIER_POLICY[trustTier];
  return tools.filter(t => allowedNames.includes(t.name));
}

/**
 * Get the allowed tool names for a given trust tier.
 * @param tier - Trust tier string
 * @returns Array of tool names or undefined if tier unknown
 */
export function getPolicyForTier(tier: string): string[] | undefined {
  return TRUST_TIER_POLICY[tier];
}

/**
 * Check if a specific tool is allowed for a trust tier.
 * @param toolName - Name of the tool to check
 * @param trustTier - Current trust tier
 * @returns True if the tool is allowed
 */
export function isToolAllowed(toolName: string, trustTier?: string): boolean {
  if (!trustTier || !TRUST_TIER_POLICY[trustTier]) {
    return PUBLIC_TOOLS.includes(toolName);
  }
  return TRUST_TIER_POLICY[trustTier].includes(toolName);
}
