export type BridgeMessage = {
  type: 'SPOON_UPDATE' | 'SURFACE_CHANGE' | 'PRESENCE_PING' | 'SETTINGS_UPDATE';
  source: 'PHOS' | 'WILLOW' | 'HUB';
  payload: Record<string, unknown>;
  timestamp: number;
};

const HUB_ORIGINS = ['https://p31ca.org', 'https://phos.p31ca.org', 'https://willow.p31ca.org'];

export const postToHub = (message: BridgeMessage, targetOrigin?: string) => {
  const origin = targetOrigin || window.location.origin;
  try {
    window.parent.postMessage(message, origin);
  } catch {
    // postMessage failed — silently ignore
  }
};

export const listenToHub = (callback: (msg: BridgeMessage) => void) => {
  const handler = (event: MessageEvent) => {
    if (!HUB_ORIGINS.includes(event.origin)) return;
    if (event.data && typeof event.data === 'object' && 'type' in event.data) {
      callback(event.data as BridgeMessage);
    }
  };
  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
};

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 2
): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok || res.status < 500) return res;
    } catch {
      // network error — retry
    }
    if (i === retries) throw new Error('Network failed');
    await new Promise(r => setTimeout(r, 1000 * (i + 1)));
  }
  throw new Error('Unreachable');
}
