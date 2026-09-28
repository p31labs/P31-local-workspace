export const JUSTICE_HUB_URL = 'https://p31-justice-hub.trimtab-signal.workers.dev/mcp';

export async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function justiceRpc(name: string, args: Record<string, unknown>): Promise<any> {
  const res = await fetch(JUSTICE_HUB_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: crypto.randomUUID(),
      method: 'tools/call',
      params: { name, arguments: args },
    }),
  });
  if (!res.ok) throw new Error(`Justice hub responded ${res.status}`);
  const body = await res.json();
  if (body.error) throw new Error(body.error.message ?? 'Justice hub RPC error');
  const text = body?.result?.content?.[0]?.text;
  return typeof text === 'string' ? JSON.parse(text) : body?.result;
}