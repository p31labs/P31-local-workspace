export type ToolName = 'getLoveBalance' | 'setSpoonLevel' | 'getState' | 'getTrustTier' | 'aiProxy';

export interface ToolSchema {
  name: ToolName;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export const TOOLS: ToolSchema[] = [
  {
    name: 'getLoveBalance',
    description: 'Get the current LOVE balance for the session user.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'setSpoonLevel',
    description: 'Set the spoon (energy/capacity) level for the session (0-5).',
    inputSchema: {
      type: 'object',
      properties: {
        level: { type: 'number', minimum: 0, maximum: 5 },
      },
      required: ['level'],
    },
  },
  {
    name: 'getState',
    description: 'Get the current gateway session state (spoons, trust tier, LOVE balance).',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'getTrustTier',
    description: 'Get the current trust tier for the session user.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'aiProxy',
    description: 'Proxy an LLM request to the p31-llm-proxy service with the current session context.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string' },
        model: { type: 'string' },
        maxTokens: { type: 'number' },
      },
      required: ['prompt'],
    },
  },
];

export const TOOL_NAMES = TOOLS.map(t => t.name);
