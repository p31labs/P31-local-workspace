export interface IntentRule {
  keywords: string[];
  surface: string;
  maxSpoons?: number;
}

export const INTENT_RULES: IntentRule[] = [
  { keywords: ['panic', 'overwhelm', 'overwhelmed', 'stop', 'emergency', 'crisis'], surface: 'GREETING', maxSpoons: 1 },
  { keywords: ['start', 'onboard', 'ignite', 'setup', 'begin', 'hello', 'hi'], surface: 'IGNITION', maxSpoons: 2 },
  { keywords: ['ready', 'begin', 'start', 'ignite'], surface: 'IGNITION' },
  { keywords: ['play', 'game', 'games', 'fun', 'arcade', 'entertain'], surface: 'ARCADE' },
  { keywords: ['bond', 'bonding', 'family', 'together', 'love', 'connect'], surface: 'BONDING' },
  { keywords: ['work', 'code', 'develop', 'system', 'deploy', 'build', 'project'], surface: 'NODE_ZERO' },
  { keywords: ['hardware', 'house', 'telemetry', 'sensors', 'physical', 'base', 'node zero'], surface: 'NODE_ZERO' },
  { keywords: ['grid', 'mesh', 'network', 'connect', 'service', 'status', 'all'], surface: 'GRID' },
  { keywords: ['lost', 'confused', 'dont', 'guide', 'compass', 'help', 'stuck'], surface: 'COMPASS' },
  { keywords: ['buffer', 'rest', 'pause', 'breathe', 'calm', 'quiet', 'reset', 'journal', 'write'], surface: 'THE_BUFFER' },
  { keywords: ['vault', 'safe', 'secure', 'asset', 'store', 'save', 'protect'], surface: 'VAULT' },
  { keywords: ['love', 'karma', 'value', 'economy', 'credits', 'ledger', 'balance'], surface: 'LOVE' },
  { keywords: ['log', 'ledger', 'history', 'memory', 'events', 'timeline', 'review'], surface: 'LEDGER' },
  { keywords: ['search', 'archive', 'knowledge', 'query', 'ask', 'oracle', 'document', 'embed', 'rag'], surface: 'ARCHIVE' },
  { keywords: ['setting', 'config', 'preference', 'tune', 'customize', 'adjust'], surface: 'SETTINGS' },
];

export function parseRagQuery(input: string): string | null {
  const clean = input.trim();
  if (clean.startsWith('?')) {
    const params = clean.slice(1).trim();
    if (params.startsWith('query=')) return params.slice(6).trim();
    return params;
  }
  if (clean.toLowerCase().startsWith('/ask')) return clean.slice(4).trim();
  return null;
}

export function routeIntent(input: string, _spoons: number): string {
  const cleaned = input.toLowerCase().replace(/[^\w\s]/g, '').trim();
  if (!cleaned) return 'GREETING';
  const words = cleaned.split(/\s+/);
  for (const rule of INTENT_RULES) {
    for (const kw of rule.keywords) {
      if (cleaned === kw || words.includes(kw)) {
        return rule.surface;
      }
    }
  }
  return 'GREETING';
}
