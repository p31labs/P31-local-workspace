#!/usr/bin/env node
/**
 * MCP Agent Integration Test Harness
 *
 * Simulates an AI agent connecting to the P31 Design MCP server
 * and invoking tools to verify the agent-native UI layer works.
 *
 * Usage:
 *   node scripts/test-mcp-agent.mjs
 *
 * Tests:
 *   1. Discover MCP server capabilities
 *   2. List available tools
 *   3. Call token_list to verify design system access
 *   4. Call component_schema to verify component catalog access
 *   5. Call scan_ui to verify WebMCP annotation scanning
 *   6. Call setSpoonLevel to verify UI control
 */

import http from 'http';
import https from 'https';

const MCP_URL = 'https://p31-design-mcp.trimtab-signal.workers.dev';
const MCP_PORT = 443;

let requestId = 1;

function createRequest(method, params = {}) {
  return {
    jsonrpc: '2.0',
    id: requestId++,
    method,
    params,
    _meta: {
      protocolVersion: '2026-07-28',
      capabilities: {},
      clientInfo: { name: 'test-harness', version: '1.0.0' },
    },
  };
}

async function callMcp(method, params = {}) {
  const payload = JSON.stringify(createRequest(method, params));

  return new Promise((resolve, reject) => {
    const url = new URL(MCP_URL);
    const options = {
      hostname: url.hostname,
      port: MCP_PORT,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.error) {
            reject(new Error(`MCP Error: ${result.error.message}`));
          } else {
            resolve(result.result);
          }
        } catch (err) {
          reject(new Error(`Parse error: ${err.message}\nRaw: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('P31 Design MCP — Agent Integration Test Harness');
  console.log('════════════════════════════════════════════════\n');

  // Test 1: Discover server capabilities
  console.log('[1/6] Discovering MCP server capabilities...');
  try {
    const discoverResult = await callMcp('server/discover');
    console.log(`  OK  Server: ${discoverResult.serverInfo?.name || 'unknown'} v${discoverResult.serverInfo?.version || '?'}`);
    console.log(`  Protocol: ${discoverResult.protocolVersion || 'unknown'}`);
    console.log(`  Capabilities: ${Object.keys(discoverResult.capabilities || {}).join(', ')}\n`);
  } catch (err) {
    console.error(`  FAIL ${err.message}\n`);
    process.exit(1);
  }

  // Test 2: List tools
  console.log('[2/6] Listing available tools...');
  try {
    const toolsResult = await callMcp('tools/list');
    const tools = toolsResult.tools || [];
    console.log(`  OK  ${tools.length} tools available`);
    const categories = {
      tokens: tools.filter(t => t.name?.startsWith('token_')),
      components: tools.filter(t => t.name?.startsWith('component_')),
      icons: tools.filter(t => t.name?.startsWith('icon_') || t.name?.startsWith('list_icons')),
      ui: tools.filter(t => ['toggleDrawer', 'navigate', 'setSpoonLevel', 'scan_ui'].includes(t.name)),
      other: tools.filter(t => !t.name?.startsWith('token_') && !t.name?.startsWith('component_') && !t.name?.startsWith('icon_') && !['toggleDrawer', 'navigate', 'setSpoonLevel', 'scan_ui'].includes(t.name)),
    };
    console.log(`    Tokens: ${categories.tokens.length}`);
    console.log(`    Components: ${categories.components.length}`);
    console.log(`    Icons: ${categories.icons.length}`);
    console.log(`    UI controls: ${categories.ui.length}`);
    console.log(`    Other: ${categories.other.length}\n`);
  } catch (err) {
    console.error(`  FAIL ${err.message}\n`);
    process.exit(1);
  }

  // Test 3: token_list
  console.log('[3/6] Testing token_list...');
  try {
    const tokens = await callMcp('tools/call', { name: 'token_list', arguments: {} });
    const tokenCount = tokens.content?.[0]?.text ? JSON.parse(tokens.content[0].text).length : 0;
    console.log(`  OK  token_list returned ${tokenCount} tokens\n`);
  } catch (err) {
    console.error(`  FAIL ${err.message}\n`);
    process.exit(1);
  }

  // Test 4: component_schema
  console.log('[4/6] Testing component_schema...');
  try {
    const schema = await callMcp('tools/call', { name: 'component_schema', arguments: { name: 'GlassCard' } });
    const schemaText = schema.content?.[0]?.text || '{}';
    const schemaObj = JSON.parse(schemaText);
    console.log(`  OK  GlassCard schema: ${Object.keys(schemaObj).length} fields`);
    console.log(`    Props: ${Object.keys(schemaObj.props || {}).join(', ')}\n`);
  } catch (err) {
    console.error(`  FAIL ${err.message}\n`);
    process.exit(1);
  }

  // Test 5: scan_ui
  console.log('[5/6] Testing scan_ui...');
  try {
    const scanResult = await callMcp('tools/call', {
      name: 'scan_ui',
      arguments: {
        html: '<button data-mcp-tool="toggleDrawer" data-mcp-state="closed">Menu</button>',
      },
    });
    const scanText = scanResult.content?.[0]?.text || '{}';
    const scanObj = JSON.parse(scanText);
    console.log(`  OK  scan_ui found ${scanObj.annotations?.length || 0} annotations`);
    if (scanObj.annotations?.[0]) {
      const a = scanObj.annotations[0];
      console.log(`    tool=${a['data-mcp-tool']}, state=${a['data-mcp-state']}, selector=${a.selector}\n`);
    }
  } catch (err) {
    console.error(`  FAIL ${err.message}\n`);
    process.exit(1);
  }

  // Test 6: setSpoonLevel
  console.log('[6/6] Testing setSpoonLevel...');
  try {
    const spoonResult = await callMcp('tools/call', { name: 'setSpoonLevel', arguments: { level: 3 } });
    const spoonText = spoonResult.content?.[0]?.text || '{}';
    const spoonObj = JSON.parse(spoonText);
    console.log(`  OK  setSpoonLevel: success=${spoonObj.success}, level=${spoonObj.level}\n`);
  } catch (err) {
    console.error(`  FAIL ${err.message}\n`);
    process.exit(1);
  }

  console.log('════════════════════════════════════════════════');
  console.log('All agent integration tests passed.');
  console.log('The P31 Design MCP server is ready for AI agents.');
}

runTests().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
