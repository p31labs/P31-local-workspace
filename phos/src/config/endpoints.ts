/**
 * Environment-aware proxy configuration.
 *
 * Priority:
 * 1. VITE_* env vars (at build time via Vite)
 * 2. Runtime override via localStorage (`phos-endpoint-override`)
 * 3. Default to localhost (dev defaults)
 *
 * This allows the app to work with local dev proxies out of the box,
 * while permitting production overrides via env vars or localStorage
 * without requiring a rebuild.
 */

interface EndpointConfig {
  vectorProxy: string;
  ragProxy: string;
  dbConnection: string;
}

function getOverride(): Partial<EndpointConfig> {
  try {
    const raw = localStorage.getItem('phos-endpoint-override');
    if (raw) return JSON.parse(raw);
  } catch { /* */ }
  return {};
}

function getEnv(): Partial<EndpointConfig> {
  return {
    vectorProxy: (import.meta as any).env?.VITE_VECTOR_PROXY || undefined,
    ragProxy: (import.meta as any).env?.VITE_RAG_PROXY || undefined,
    dbConnection: (import.meta as any).env?.VITE_DB_CONNECTION || undefined,
  };
}

const DEFAULTS: EndpointConfig = {
  vectorProxy: 'http://localhost:4000/v1/embeddings',
  ragProxy: 'http://localhost:4001',
  dbConnection: '',
};

export const endpoints: EndpointConfig = {
  vectorProxy: getOverride().vectorProxy || getEnv().vectorProxy || DEFAULTS.vectorProxy,
  ragProxy: getOverride().ragProxy || getEnv().ragProxy || DEFAULTS.ragProxy,
  dbConnection: getOverride().dbConnection || getEnv().dbConnection || DEFAULTS.dbConnection,
};

export function setEndpointOverride(partial: Partial<EndpointConfig>) {
  const current = getOverride();
  localStorage.setItem('phos-endpoint-override', JSON.stringify({ ...current, ...partial }));
}
