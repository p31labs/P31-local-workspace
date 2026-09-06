/**
 * C.A.R.S. mock WebSocket vocabulary — mirrors `cars-contract/p31.carsWire.json` (p31.carsWire/0.1.0).
 * Use from classroom glue, mocks, or any TS consumer; drift breaks `npm run verify:cars-wire`.
 */

export const CARS_WIRE_SCHEMA = 'p31.carsWire/0.1.0' as const;

/** Server → broadcast interval (matches mock server) */
export const CARS_MOLECULE_BROADCAST_INTERVAL_MS = 500 as const;

/** Browser heartbeat when in mock room */
export const CARS_HEARTBEAT_INTERVAL_MS = 5000 as const;

export const CARS_WORLD_BOUNDS_PX = { width: 1600, height: 800 } as const;

/** Order aligned with cars-contract soupEngine.handlesIncomingTypes */
export const CARS_SOUP_ENGINE_INBOUND_TYPES = [
  'moleculeStateUpdate',
  'ping',
  'eventLog',
  'connectionInit',
  'heartbeat',
] as const;

/** Order aligned with cars-contract mockServer.sendsToClientTypes */
export const CARS_MOCK_SERVER_TO_CLIENT_TYPES = [
  'connectionInit',
  'moleculeStateUpdate',
  'heartbeat',
  'ping',
  'eventLog',
] as const;

/** Parses client payloads (mock accepts) — cars-contract.mockServer.acceptsClientParsingTypes */
export const CARS_MOCK_ACCEPTS_CLIENT_TYPES = ['playerState', 'heartbeat', 'ping', 'labTelemetry'] as const;

/** SoupEngine sends — cars-contract.browserClientOutbound.sendsTypes */
export const CARS_BROWSER_CLIENT_OUTBOUND_TYPES = ['playerState', 'heartbeat', 'ping'] as const;

export type CarsSoupInboundType = (typeof CARS_SOUP_ENGINE_INBOUND_TYPES)[number];

export type CarsMockServerToClientType = (typeof CARS_MOCK_SERVER_TO_CLIENT_TYPES)[number];

export type CarsMockAcceptsClientType = (typeof CARS_MOCK_ACCEPTS_CLIENT_TYPES)[number];

export type CarsBrowserOutboundType = (typeof CARS_BROWSER_CLIENT_OUTBOUND_TYPES)[number];
