// taler-cbs-client.ts — browser-side Axis-1 withdrawal.
//
// Drives: GET /blind-pubkey (X, R, t) -> blind (local) -> POST /blind-sign
// (c, t) -> unblind (local) -> POST /withdraw ({msg,cPrime,sPrime,R}).
// blind/unblind run in the browser via taler_cs.wasm so the issuer never
// sees the link between a blind-sign request and the final token.
import wasmUrl from './taler-cbs/taler_cs.wasm?url';
import { initCbs, blind, unblind } from './taler-cbs/loader';

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function bytesToB64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function utcPeriod(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface WithdrawResult {
  token: string;
  transactionId: string;
}

export class TalerCBSClient {
  private readonly baseUrl: string;
  private wasmReady = false;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async ensureWasm() {
    if (!this.wasmReady) {
      await initCbs(wasmUrl);
      this.wasmReady = true;
    }
  }

  async withdraw(did: string, amount: number): Promise<WithdrawResult> {
    await this.ensureWasm();

    const pk = await (await fetch(`${this.baseUrl}/blind-pubkey`)).json() as {
      X: string; R: string; t: string;
    };
    const X = b64ToBytes(pk.X);
    const R = b64ToBytes(pk.R);

    // Court-scoped message: DID + sink + amount + UTC day.
    const msg = new TextEncoder().encode(
      [did, 'system:love-issuer', String(amount), utcPeriod()].join('|'),
    );
    const a = crypto.getRandomValues(new Uint8Array(32));
    const b = crypto.getRandomValues(new Uint8Array(32));

    const { c, cPrime } = blind(msg, a, b, R, X);

    const signRes = await (await fetch(`${this.baseUrl}/blind-sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ c: bytesToB64(c), t: pk.t }),
    })).json() as { s?: string; error?: string };

    if (!signRes.s) throw new Error(signRes.error || 'blind-sign failed');

    const sPrime = unblind(b64ToBytes(signRes.s), a);

    const wres = await (await fetch(`${this.baseUrl}/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        did,
        amount,
        msg: bytesToB64(msg),
        cPrime: bytesToB64(cPrime),
        sPrime: bytesToB64(sPrime),
        t: pk.t,
      }),
    })).json() as { success?: boolean; blind_signature?: string; transactionId?: string; error?: string };

    if (!wres.success || !wres.blind_signature) {
      throw new Error(wres.error || 'withdraw failed');
    }
    return { token: wres.blind_signature, transactionId: wres.transactionId ?? '' };
  }
}
