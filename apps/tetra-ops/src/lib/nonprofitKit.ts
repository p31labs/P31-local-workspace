/**
 * @file NonprofitKit — Shared form + list utilities for tetra-based nonprofit panels.
 */

export const TETRA_API = 'https://tetra-tools.trimtab-signal.workers.dev';

export async function listTetras(cls: string): Promise<any[]> {
  const res = await fetch(`${TETRA_API}/tetra/list?class=${cls}&limit=50`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}

export async function createTetra(data: any): Promise<boolean> {
  const res = await fetch(`${TETRA_API}/tetra`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.ok;
}

export async function deleteTetra(id: string): Promise<boolean> {
  const res = await fetch(`${TETRA_API}/tetra/${id}`, { method: 'DELETE' });
  return res.ok;
}

export async function getTetraFull(id: string): Promise<any | null> {
  const res = await fetch(`${TETRA_API}/tetra/${id}`);
  if (!res.ok) return null;
  return res.json();
}

export function exportTetrasAsCSV(items: any[]): string {
  const header = 'id,label,class,created_at';
  const rows = items.map(item =>
    `${item.id},${item.label || ''},${item.class || ''},${item.created_at || ''}`
  );
  return [header, ...rows].join('\n');
}

export function exportTetrasAsJSON(items: any[]): string {
  return JSON.stringify(items.map(item => ({
    id: item.id,
    label: item.label,
    class: item.class,
    created_at: item.created_at,
  })), null, 2);
}

export function downloadBlob(content: string, filename: string, type = 'text/csv') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export async function importTetrasFromJSON(json: string): Promise<number> {
  let count = 0;
  try {
    const items = JSON.parse(json);
    const arr = Array.isArray(items) ? items : [items];
    for (const item of arr) {
      if (item.id && item.class) {
        await createTetra(item);
        count++;
      }
    }
  } catch {}
  return count;
}

export function makeTetraId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export const EMPTY_VERTEX = { id: '', label: '', val: 0, color: '#00f0ff' };
export const EMPTY_EDGE = { source: '', target: '', weight: 0.5 };
