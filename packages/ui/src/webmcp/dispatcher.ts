/**
 * P31 WebMCP Browser Dispatcher
 *
 * Bridges MCP tool calls to live DOM mutations.
 * Include this script in your app to enable agent control.
 *
 * Usage:
 *   import { initWebMcpDispatcher } from '@p31/ui/webmcp';
 *   initWebMcpDispatcher();
 */

export interface WebMcpToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface WebMcpDispatcherOptions {
  serverUrl?: string;
  debug?: boolean;
}

/**
 * Initialize the WebMCP dispatcher.
 * Connects to the MCP server and sets up tool dispatch.
 */
export function initWebMcpDispatcher(options: WebMcpDispatcherOptions = {}) {
  const serverUrl = options.serverUrl || 'https://p31-design-mcp.trimtab-signal.workers.dev';
  const debug = options.debug || false;

  if (debug) {
    console.log('[WebMCP] Initializing dispatcher...', { serverUrl });
  }

  registerBrowserTools();

  window.addEventListener('message', handleMessage);
}

/**
 * Register browser-executable tools.
 * These tools run in the browser context and mutate the DOM.
 */
function registerBrowserTools() {
  const ctx = (document as any).modelContext || (navigator as any).modelContext;
  if (!ctx || typeof ctx.registerTool !== 'function') {
    console.warn('[WebMCP] modelContext not available. Tools will not be registered.');
    return;
  }

  ctx.registerTool({
    name: 'clickElement',
    description: 'Click a DOM element by CSS selector',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector for the element' },
      },
      required: ['selector'],
    },
    execute: async ({ selector }) => {
      const el = document.querySelector(selector);
      if (!el) {
        return { success: false, error: `Element not found: ${selector}` };
      }
      (el as HTMLElement).click();
      return { success: true, selector };
    },
  });

  ctx.registerTool({
    name: 'setInputValue',
    description: 'Set the value of an input element',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector for the input' },
        value: { type: 'string', description: 'Value to set' },
      },
      required: ['selector', 'value'],
    },
    execute: async ({ selector, value }) => {
      const el = document.querySelector(selector) as HTMLInputElement | null;
      if (!el) {
        return { success: false, error: `Input not found: ${selector}` };
      }
      el.value = String(value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return { success: true, selector, value };
    },
  });

  ctx.registerTool({
    name: 'scrollToElement',
    description: 'Scroll an element into view',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector for the element' },
        behavior: { type: 'string', enum: ['auto', 'smooth'], default: 'smooth' },
      },
      required: ['selector'],
    },
    execute: async ({ selector, behavior = 'smooth' }) => {
      const el = document.querySelector(selector);
      if (!el) {
        return { success: false, error: `Element not found: ${selector}` };
      }
      el.scrollIntoView({ behavior: behavior as ScrollBehavior, block: 'center' });
      return { success: true, selector };
    },
  });

  ctx.registerTool({
    name: 'toggleDrawer',
    description: 'Open or close a navigation drawer',
    inputSchema: {
      type: 'object',
      properties: {
        state: { type: 'string', enum: ['open', 'closed', 'toggle'] },
        target: { type: 'string', description: 'Target drawer ID' },
      },
      required: ['state'],
    },
    execute: async ({ state, target }) => {
      const drawer = target
        ? document.querySelector(target)
        : document.querySelector('[data-mcp-tool="toggleDrawer"]');

      if (!drawer) {
        return { success: false, error: 'Drawer not found' };
      }

      const shouldOpen = state === 'toggle'
        ? !drawer.hasAttribute('open')
        : state === 'open';

      if (shouldOpen) {
        drawer.setAttribute('open', '');
        drawer.dispatchEvent(new Event('open', { bubbles: true }));
      } else {
        drawer.removeAttribute('open');
        drawer.dispatchEvent(new Event('close', { bubbles: true }));
      }

      return { success: true, state: shouldOpen ? 'open' : 'closed' };
    },
  });

  ctx.registerTool({
    name: 'setSpoonLevel',
    description: 'Set the cognitive load spoon level (0-5)',
    inputSchema: {
      type: 'object',
      properties: {
        level: { type: 'number', minimum: 0, maximum: 5 },
      },
      required: ['level'],
    },
    execute: async ({ level }) => {
      const clamped = Math.max(0, Math.min(5, Number(level)));
      document.documentElement.setAttribute('data-spoons', String(clamped));
      window.dispatchEvent(new CustomEvent('spoons:changed', {
        detail: { level: clamped },
        bubbles: true,
      }));
      return { success: true, level: clamped };
    },
  });

  ctx.registerTool({
    name: 'navigate',
    description: 'Navigate to a URL',
    inputSchema: {
      type: 'object',
      properties: {
        href: { type: 'string', description: 'URL to navigate to' },
        external: { type: 'boolean', default: false },
      },
      required: ['href'],
    },
    execute: async ({ href, external = false }) => {
      if (external) {
        window.open(href as string, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = href as string;
      }
      return { success: true, href };
    },
  });

  console.log('[WebMCP] Registered browser tools');
}

function handleMessage(event: MessageEvent) {
  const data = event.data;
  if (!data || data.source !== 'p31-mcp') return;

  const { tool, arguments: args }: WebMcpToolCall = data;

  console.log('[WebMCP] Received tool call:', tool, args);

  const result = executeBrowserTool(tool, args);

  if (event.ports && event.ports[0]) {
    event.ports[0].postMessage({ result });
  }
}

function executeBrowserTool(name: string, args: Record<string, unknown>): unknown {
  const tools: Record<string, (args: Record<string, unknown>) => Promise<unknown>> = {
    clickElement: async ({ selector }) => {
      const el = document.querySelector(selector as string);
      if (!el) return { success: false, error: `Element not found: ${selector}` };
      (el as HTMLElement).click();
      return { success: true, selector };
    },

    setInputValue: async ({ selector, value }) => {
      const el = document.querySelector(selector as string) as HTMLInputElement | null;
      if (!el) return { success: false, error: `Input not found: ${selector}` };
      el.value = String(value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return { success: true, selector, value };
    },

    scrollToElement: async ({ selector, behavior = 'smooth' }) => {
      const el = document.querySelector(selector as string);
      if (!el) return { success: false, error: `Element not found: ${selector}` };
      el.scrollIntoView({ behavior: behavior as ScrollBehavior, block: 'center' });
      return { success: true, selector };
    },

    toggleDrawer: async ({ state, target }) => {
      const drawer = target
        ? document.querySelector(target as string)
        : document.querySelector('[data-mcp-tool="toggleDrawer"]');

      if (!drawer) return { success: false, error: 'Drawer not found' };

      const shouldOpen = state === 'toggle'
        ? !drawer.hasAttribute('open')
        : state === 'open';

      if (shouldOpen) {
        drawer.setAttribute('open', '');
        drawer.dispatchEvent(new Event('open', { bubbles: true }));
      } else {
        drawer.removeAttribute('open');
        drawer.dispatchEvent(new Event('close', { bubbles: true }));
      }

      return { success: true, state: shouldOpen ? 'open' : 'closed' };
    },

    setSpoonLevel: async ({ level }) => {
      const clamped = Math.max(0, Math.min(5, Number(level)));
      document.documentElement.setAttribute('data-spoons', String(clamped));
      window.dispatchEvent(new CustomEvent('spoons:changed', {
        detail: { level: clamped },
        bubbles: true,
      }));
      return { success: true, level: clamped };
    },

    navigate: async ({ href, external = false }) => {
      if (external) {
        window.open(href as string, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = href as string;
      }
      return { success: true, href };
    },
  };

  const handler = tools[name];
  if (!handler) {
    return { success: false, error: `Unknown tool: ${name}` };
  }

  return handler(args);
}

export function destroyWebMcpDispatcher() {
  window.removeEventListener('message', handleMessage);
}

if (typeof window !== 'undefined' && document.documentElement.hasAttribute('data-mcp-bridge')) {
  initWebMcpDispatcher({ debug: true });
}
