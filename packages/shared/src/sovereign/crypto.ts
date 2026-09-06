export async function generateDID(): Promise<string> {
  const rawBytes = crypto.getRandomValues(new Uint8Array(32));
  const hex = Array.from(rawBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `did:key:z6Mk${hex}`;
}

export async function hashTelemetry(didKey: string, activeRoom: string): Promise<string> {
  // 16 bytes = 128 bits — above the 96-bit minimum for nonce collision safety
  const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  const payload = Date.now().toString() + nonce + didKey + activeRoom;
  const data = new TextEncoder().encode(payload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
}

export function exportLedgerJSON(didKey: string, telemetryHashes: string[]) {
  if (telemetryHashes.length === 0) return;
  const payload = {
    os_version: "2026.03.06",
    hardware_root_did: didKey,
    export_timestamp_iso: new Date().toISOString(),
    chain_length: telemetryHashes.length,
    telemetry_ledger: telemetryHashes
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `p31_ledger_export_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
