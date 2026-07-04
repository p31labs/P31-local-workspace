interface EndpointConfig {
  vectorProxy: string;
  ragProxy: string;
  dbConnection: string;
  k4Api: string;
  cashpilotSync: string;
  bufferWorker: string;
  loveLedger: string;
  contractEngine: string;
  governanceEngine: string;
  aiProxy: string;
  jitterbugProxy: string;
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
    k4Api: (import.meta as any).env?.VITE_K4_API || undefined,
    cashpilotSync: (import.meta as any).env?.VITE_CASHPILOT_SYNC || undefined,
    bufferWorker: (import.meta as any).env?.VITE_BUFFER_URL || undefined,
    loveLedger: (import.meta as any).env?.VITE_LOVE_LEDGER_URL || undefined,
    contractEngine: (import.meta as any).env?.VITE_CONTRACT_ENGINE_URL || undefined,
    governanceEngine: (import.meta as any).env?.VITE_GOVERNANCE_ENGINE_URL || undefined,
    aiProxy: (import.meta as any).env?.VITE_AI_PROXY || undefined,
    jitterbugProxy: (import.meta as any).env?.VITE_JITTERBUG_PROXY || undefined,
  };
}

const GATEWAY = 'https://gateway.p31ca.org';

const DEFAULTS: EndpointConfig = {
  vectorProxy: 'http://localhost:4000/v1/embeddings',
  ragProxy: 'http://localhost:4001',
  dbConnection: '',
  k4Api: GATEWAY,
  cashpilotSync: GATEWAY,
  bufferWorker: 'https://buffer-worker.trimtab-signal.workers.dev',
  loveLedger: 'https://love-ledger.trimtab-signal.workers.dev',
  contractEngine: 'https://contract-engine.trimtab-signal.workers.dev',
  governanceEngine: 'https://governance-engine.trimtab-signal.workers.dev',
  aiProxy: GATEWAY,
  jitterbugProxy: GATEWAY,
};

export const endpoints: EndpointConfig = {
  vectorProxy: getOverride().vectorProxy || getEnv().vectorProxy || DEFAULTS.vectorProxy,
  ragProxy: getOverride().ragProxy || getEnv().ragProxy || DEFAULTS.ragProxy,
  dbConnection: getOverride().dbConnection || getEnv().dbConnection || DEFAULTS.dbConnection,
  k4Api: getOverride().k4Api || getEnv().k4Api || DEFAULTS.k4Api,
  cashpilotSync: getOverride().cashpilotSync || getEnv().cashpilotSync || DEFAULTS.cashpilotSync,
  bufferWorker: getOverride().bufferWorker || getEnv().bufferWorker || DEFAULTS.bufferWorker,
  loveLedger: getOverride().loveLedger || getEnv().loveLedger || DEFAULTS.loveLedger,
  contractEngine: getOverride().contractEngine || getEnv().contractEngine || DEFAULTS.contractEngine,
  governanceEngine: getOverride().governanceEngine || getEnv().governanceEngine || DEFAULTS.governanceEngine,
  aiProxy: getOverride().aiProxy || getEnv().aiProxy || DEFAULTS.aiProxy,
  jitterbugProxy: getOverride().jitterbugProxy || getEnv().jitterbugProxy || DEFAULTS.jitterbugProxy,
};

export function setEndpointOverride(partial: Partial<EndpointConfig>) {
  const current = getOverride();
  localStorage.setItem('phos-endpoint-override', JSON.stringify({ ...current, ...partial }));
}
