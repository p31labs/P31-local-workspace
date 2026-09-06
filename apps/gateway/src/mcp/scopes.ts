export const SCOPES = {
  'state:read': { description: 'Read session state (spoons, trust tier, LOVE balance)', tools: ['getState', 'getLoveBalance', 'getTrustTier'] },
  'state:write': { description: 'Mutate session state (set spoon level)', tools: ['setSpoonLevel'] },
  'ai:chat': { description: 'Proxy LLM chat requests', tools: ['aiProxy'] },
  'admin:audit': { description: 'Read audit logs', tools: [] },
  'token:mint': { description: 'Issue scoped tokens', tools: [] },
} as const;

export type Scope = keyof typeof SCOPES;

const TOOL_SCOPE_MAP: Record<string, Scope> = {};
for (const [scope, def] of Object.entries(SCOPES)) {
  for (const tool of def.tools) {
    TOOL_SCOPE_MAP[tool] = scope as Scope;
  }
}

export function getRequiredScope(toolName: string): Scope | null {
  return TOOL_SCOPE_MAP[toolName] || null;
}

export function parseTokenScopes(tokenPayload: Record<string, any>): Set<string> {
  const raw = tokenPayload.scope;
  if (typeof raw === 'string') return new Set(raw.split(/\s+/).filter(Boolean));
  if (Array.isArray(raw)) return new Set(raw);
  return new Set();
}

export function hasScope(tokenPayload: Record<string, any>, requiredScope: string): boolean {
  const scopes = parseTokenScopes(tokenPayload);
  return scopes.has(requiredScope);
}
