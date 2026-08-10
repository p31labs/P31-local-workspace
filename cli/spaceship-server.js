#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// SPACESHIP — DUNA / System Health / Dome Structure / NeoPixel Expert
// Exposes the spaceship-earth dome as MCP tools for agents:
//   duna_status        — read-only DUNA readiness (members, target, progress)
//   system_health      — read-only system health (coherence, spoons, mesh)
//   dome_structure     — read-only dome geometry facts (480-edge geodesic)
//   neo_pixel_control  — validated write: LED mode/speed/color/brightness
// Stateless JSON-RPC over stdio, zero external dependencies. Mirrors the
// soulsafe-server.js / ground-truth-server.js pattern (MCP 2026-07-28).
// Persistent state (optional): ~/p31-agents/spaceship-state.json.
// ═══════════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

const AGENTS_ROOT = path.resolve(process.env.HOME || '/home/p31', 'p31-agents');
const STATE_PATH = path.join(AGENTS_ROOT, 'spaceship-state.json');

const DOME_RADIUS = 12;
const PORT_COUNT = 120;
const SEGMENTS_PER_EDGE = 20;
const LAYERS = 4;
const TETRA_FRAME = 6;

// ---------------------------------------------------------------------------
// Pure-JS geodesic subdivision (port of packages/spaceship-earth/src/math/
// geodesic.ts) so dome_structure matches the live app exactly (480 edges at
// detail=2). No THREE dependency on the CLI side.
// ---------------------------------------------------------------------------

const BASE = [
  [-1, 1.618034, 0], [1, 1.618034, 0], [-1, -1.618034, 0], [1, -1.618034, 0],
  [0, -1, 1.618034], [0, 1, 1.618034], [0, -1, -1.618034], [0, 1, -1.618034],
  [1.618034, 0, -1], [1.618034, 0, 1], [-1.618034, 0, -1], [-1.618034, 0, 1],
];

const BASE_FACES = [
  [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
  [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
  [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
  [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
];

const KEY_PRECISION = 8;
const pkey = (p) => p.map((n) => n.toFixed(KEY_PRECISION)).join(',');

function normalize(p, radius) {
  const len = Math.sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2]);
  const s = len > 0 ? radius / len : 1;
  return [p[0] * s, p[1] * s, p[2] * s];
}

function midpoint(a, b, radius) {
  return normalize([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], radius);
}

function geodesicEdgeCount(radius, detail) {
  const verts = BASE.map((p) => normalize(p, radius));
  const index = new Map();
  verts.forEach((v, i) => index.set(pkey(v), i));
  const point = (p) => {
    const k = pkey(p);
    const hit = index.get(k);
    if (hit !== undefined) return hit;
    const id = verts.length;
    verts.push(p);
    index.set(k, id);
    return id;
  };

  let faces = BASE_FACES.slice();
  for (let d = 0; d < detail; d++) {
    const next = [];
    for (const [a, b, c] of faces) {
      const ab = point(midpoint(verts[a], verts[b], radius));
      const bc = point(midpoint(verts[b], verts[c], radius));
      const ca = point(midpoint(verts[c], verts[a], radius));
      next.push([a, ab, ca]);
      next.push([b, bc, ab]);
      next.push([c, ca, bc]);
      next.push([ab, bc, ca]);
    }
    faces = next;
  }

  const edgeSet = new Set();
  for (const [a, b, c] of faces) {
    for (const [x, y] of [[a, b], [b, c], [c, a]]) {
      const k = x < y ? `${x},${y}` : `${y},${x}`;
      if (!edgeSet.has(k)) edgeSet.add(k);
    }
  }
  return edgeSet.size;
}

const OUTER_EDGES = geodesicEdgeCount(DOME_RADIUS, 2);

// ---------------------------------------------------------------------------
// State helpers
// ---------------------------------------------------------------------------

const DEFAULT_STATE = {
  spoons: 4,
  coherence: 0.8,
  engagement: 5,
  memberCount: 0,
  dunaTarget: 100,
  dockedPorts: 0,
  led: { mode: 'rainbow', speed: 5, color: '#22d3ee', brightness: 80 },
};

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(path.resolve(filePath), 'utf-8');
  } catch {
    return null;
  }
}

function readJsonSafe(filePath) {
  const content = readFileSafe(filePath);
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function loadState(file) {
  const target = file || STATE_PATH;
  const saved = readJsonSafe(target);
  return { target, state: deepMerge({ ...DEFAULT_STATE }, saved || {}) };
}

function deepMerge(base, patch) {
  for (const k of Object.keys(patch)) {
    if (patch[k] !== null && typeof patch[k] === 'object' && !Array.isArray(patch[k])) {
      base[k] = deepMerge(base[k] && typeof base[k] === 'object' ? { ...base[k] } : {}, patch[k]);
    } else {
      base[k] = patch[k];
    }
  }
  return base;
}

function writeJsonAtomic(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, filePath);
}

// ---------------------------------------------------------------------------
// Tool Definitions
// ---------------------------------------------------------------------------

const LED_MODES = ['rainbow', 'chase', 'solid', 'breath', 'gradient', 'dual-chase', 'off'];

const TOOLS = [
  {
    name: 'duna_status',
    description: 'Get DUNA readiness: member count vs target, progress bar, readiness label, and active ships. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Optional state file path (default: ~/p31-agents/spaceship-state.json)' },
      },
    },
  },
  {
    name: 'system_health',
    description: 'Get system health: coherence, spoons, engagement, docked ports, and mesh status. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Optional state file path (default: ~/p31-agents/spaceship-state.json)' },
      },
    },
  },
  {
    name: 'dome_structure',
    description: 'Get the docking-dome geometry facts: layers, mode, radius, outer edges, ports, NeoPixel segments, K4 tetra frame, inner dome. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'neo_pixel_control',
    description: 'Set the NeoPixel LED controller state (mode, speed, color, brightness). Validated and persisted to the spaceship state file.',
    inputSchema: {
      type: 'object',
      properties: {
        mode: { type: 'string', enum: LED_MODES, description: 'LED animation mode' },
        speed: { type: 'number', description: 'Animation speed 0-10' },
        color: { type: 'string', description: 'Hex color (e.g. #22d3ee)' },
        brightness: { type: 'number', description: 'Brightness 0-100' },
        file: { type: 'string', description: 'Optional state file path (default: ~/p31-agents/spaceship-state.json)' },
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Tool Implementations
// ---------------------------------------------------------------------------

function readinessLabel(dunaReady) {
  if (dunaReady >= 1) return 'READY';
  if (dunaReady >= 0.75) return 'near-ready';
  if (dunaReady >= 0.5) return 'deploying';
  if (dunaReady >= 0.25) return 'assembling';
  return 'initializing';
}

function meshStatus(coherence, dockedPorts) {
  if (dockedPorts === 0) return 'idle';
  if (coherence >= 0.7) return 'stable';
  if (coherence >= 0.4) return 'forming';
  return 'critical';
}

function dunaStatus({ file } = {}) {
  const { target, state } = loadState(file);
  const members = Number(state.memberCount) || 0;
  const targetCount = Number(state.dunaTarget) || DEFAULT_STATE.dunaTarget;
  const dunaReady = Math.min(1, members / targetCount);
  return {
    status: 'ok',
    members,
    target: targetCount,
    active_ships: members,
    progress: Math.round(dunaReady * 100),
    readiness: readinessLabel(dunaReady),
    duna_ready: dunaReady,
    state_file: target,
  };
}

function systemHealth({ file } = {}) {
  const { target, state } = loadState(file);
  const coherence = Math.min(1, Math.max(0, Number(state.coherence) ?? DEFAULT_STATE.coherence));
  const spoons = Math.min(5, Math.max(0, Number(state.spoons) ?? DEFAULT_STATE.spoons));
  const engagement = Math.min(10, Math.max(0, Number(state.engagement) ?? DEFAULT_STATE.engagement));
  const dockedPorts = Number(state.dockedPorts) || 0;
  return {
    status: 'ok',
    coherence,
    spoons,
    engagement,
    docked_ports: dockedPorts,
    mesh: meshStatus(coherence, dockedPorts),
    state_file: target,
  };
}

function domeStructure() {
  return {
    status: 'ok',
    dome: {
      layers: LAYERS,
      mode: 'docking-dome',
      radius: DOME_RADIUS,
      outerEdges: OUTER_EDGES,
      ports: PORT_COUNT,
      neoPixelSegments: OUTER_EDGES * SEGMENTS_PER_EDGE,
      tetraFrame: TETRA_FRAME,
      innerDome: true,
    },
  };
}

function neoPixelControl({ mode, speed, color, brightness, file } = {}) {
  const { target, state } = loadState(file);
  const led = { ...(state.led || {}), ...DEFAULT_STATE.led };
  const errors = [];

  if (mode !== undefined) {
    if (!LED_MODES.includes(mode)) {
      errors.push(`mode must be one of: ${LED_MODES.join(', ')}`);
    } else {
      led.mode = mode;
    }
  }
  if (speed !== undefined) {
    if (typeof speed !== 'number' || Number.isNaN(speed) || speed < 0 || speed > 10) {
      errors.push('speed must be a number 0-10');
    } else {
      led.speed = speed;
    }
  }
  if (color !== undefined) {
    if (typeof color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(color)) {
      errors.push('color must be a hex string like #22d3ee');
    } else {
      led.color = color.toLowerCase();
    }
  }
  if (brightness !== undefined) {
    if (typeof brightness !== 'number' || Number.isNaN(brightness) || brightness < 0 || brightness > 100) {
      errors.push('brightness must be a number 0-100');
    } else {
      led.brightness = brightness;
    }
  }

  if (errors.length > 0) {
    return { status: 'error', errors, message: errors.join('; ') };
  }

  state.led = led;
  try {
    writeJsonAtomic(target, state);
  } catch (e) {
    return { status: 'error', error: e.message };
  }

  return {
    status: 'ok',
    persisted: true,
    file: target,
    led,
  };
}

// ---------------------------------------------------------------------------
// Tool Execution Router
// ---------------------------------------------------------------------------

function executeTool(name, args) {
  switch (name) {
    case 'duna_status':
      return dunaStatus(args);
    case 'system_health':
      return systemHealth(args);
    case 'dome_structure':
      return domeStructure(args);
    case 'neo_pixel_control':
      return neoPixelControl(args);
    default:
      return { status: 'error', error: `Unknown tool: ${name}` };
  }
}

// ---------------------------------------------------------------------------
// JSON-RPC over stdio
// ---------------------------------------------------------------------------

let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop();
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      handleRequest(JSON.parse(trimmed));
    } catch (_) {}
  }
});

function handleRequest(req) {
  const { id, method, params } = req;
  switch (method) {
    case 'initialize':
      respond(id, {
        protocolVersion: '2026-07-28',
        capabilities: { tools: {} },
        serverInfo: { name: 'p31-spaceship', version: '1.0.0', upgraded: true },
      });
      break;
    case 'notifications/initialized':
      break;
    case 'tools/list':
      respond(id, { tools: TOOLS });
      break;
    case 'tools/call': {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      const tool = TOOLS.find((t) => t.name === toolName);
      if (!tool) {
        respondError(id, -32602, `Unknown tool: ${toolName}`);
        break;
      }
      try {
        const out = executeTool(toolName, toolArgs);
        respond(id, { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] });
      } catch (e) {
        respond(id, {
          content: [{ type: 'text', text: JSON.stringify({ error: e.message, status: 'error' }) }],
          isError: true,
        });
      }
      break;
    }
    case 'ping':
      respond(id, {});
      break;
    default:
      if (id !== undefined) respondError(id, -32601, `Method not found: ${method}`);
  }
}

function respond(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
}
function respondError(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n');
}
