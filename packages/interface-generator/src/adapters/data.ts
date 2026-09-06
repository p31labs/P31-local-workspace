// Data-source adapters. Used by the MCP tool / server-side generation.
// The PWA fetches via its own hooks; this is for non-browser callers.

export async function fetchViewData(apiBase: string, role: string, pseudonym?: string): Promise<any> {
  const url = pseudonym
    ? `${apiBase}/usertest/views/${role}?pseudonym=${encodeURIComponent(pseudonym)}`
    : `${apiBase}/usertest/views/${role}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchPassport(url?: string): Promise<any> {
  if (!url) return null;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}
