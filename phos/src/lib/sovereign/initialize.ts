import init, { SovereignNode } from '../../../../../packages/sovereign-core/pkg/sovereign_core.js';

export async function initSovereign(signalingUrl?: string): Promise<string> {
  let wasmReady = false;
  try {
    await init();
    wasmReady = true;
  } catch (err) {
    console.warn('[Sovereign] WASM init failed — continuing without sovereign core:', err);
  }

  if (!wasmReady) {
    return 'unavailable';
  }

  const nodeId = crypto.randomUUID();
  try {
    const node = await new SovereignNode(nodeId, signalingUrl);
    const status = node.get_status();
    console.log('[Sovereign]', status);
    return status;
  } catch (err) {
    console.warn('[Sovereign] Node construction failed (non-fatal):', err);
    return 'unavailable';
  }
}
