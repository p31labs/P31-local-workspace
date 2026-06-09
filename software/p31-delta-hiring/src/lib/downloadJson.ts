export function downloadJsonFile(filename: string, data: object): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.setAttribute('aria-label', 'Download ' + filename);
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export async function readJsonFile(f: File): Promise<unknown> {
  const text = await f.text();
  return JSON.parse(text) as unknown;
}
