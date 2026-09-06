import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const tokens = {
  colors: {
    cyan: '#00d4ff',
    violet: '#a78bfa',
    amber: '#fbbf24',
    emerald: '#34d399',
    red: '#f87171',
    iris: '#8b5cf6',
    gold: '#fbbf24',
  },
  spacing: {
    xs: '0.75rem',
    sm: '1rem',
    md: '1.333rem',
    lg: '1.778rem',
    xl: '2.37rem',
    '2xl': '3.16rem',
    '3xl': '4.21rem',
  },
  typography: {
    fontSans: 'system-ui, sans-serif',
    fontMono: 'ui-monospace, monospace',
    size: {
      caption: '0.75rem',
      body: '1rem',
      h3: '1.333rem',
      h2: '1.778rem',
      h1: '2.37rem',
      display: '3.16rem',
    },
  },
};

const server = new Server(
  {
    name: 'p31-ui-tokens',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_token',
      description: 'Get a design token value by category and key',
      inputSchema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['colors', 'spacing', 'typography'],
            description: 'Token category',
          },
          key: {
            type: 'string',
            description: 'Token key (e.g., "cyan", "md", "h1")',
          },
        },
        required: ['category', 'key'],
      },
    },
    {
      name: 'list_tokens',
      description: 'List all design tokens in a category',
      inputSchema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['colors', 'spacing', 'typography'],
            description: 'Token category',
          },
        },
        required: ['category'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'get_token') {
    const { category, key } = args as { category: string; key: string };
    const categoryData = tokens[category as keyof typeof tokens];
    if (!categoryData) {
      return {
        content: [{ type: 'text', text: `Category "${category}" not found` }],
        isError: true,
      };
    }
    const value = categoryData[key as keyof typeof categoryData];
    if (value === undefined) {
      return {
        content: [{ type: 'text', text: `Key "${key}" not found in ${category}` }],
        isError: true,
      };
    }
    return {
      content: [{ type: 'text', text: JSON.stringify({ [key]: value }, null, 2) }],
    };
  }

  if (name === 'list_tokens') {
    const { category } = args as { category: string };
    const categoryData = tokens[category as keyof typeof tokens];
    if (!categoryData) {
      return {
        content: [{ type: 'text', text: `Category "${category}" not found` }],
        isError: true,
      };
    }
    return {
      content: [{ type: 'text', text: JSON.stringify(categoryData, null, 2) }],
    };
  }

  return {
    content: [{ type: 'text', text: `Unknown tool: ${name}` }],
    isError: true,
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP token server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
