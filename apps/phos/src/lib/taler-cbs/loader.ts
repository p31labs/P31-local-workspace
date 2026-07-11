// taler-cbs/loader.ts (browser) — runs blind()/unblind() client-side so
// the issuer (love-ledger) can NEVER link a withdrawal to its resulting
// token. Fetches taler_cs.wasm (served same-origin) and instantiates.
//
// Memory layout mirrors the worker loader (safe base above Rust stack/data),
// so offsets stay in sync with lib.rs / AXIS-1_FINAL_DELIVERABLE.md §5.

let INST: WebAssembly.Instance | null = null;
let MEM: WebAssembly.Memory | null = null;
const P = 32;
let BASE = 0;

export async function initCbs(wasmUrl: string): Promise<void> {
  if (INST) return;
  const bytes = await (await fetch(wasmUrl)).arrayBuffer();
  const mod = await WebAssembly.instantiate(bytes, { env: {} });
  INST = mod.instance;
  MEM = INST.exports.memory as WebAssembly.Memory;
  BASE = Math.ceil((INST.exports.__heap_base.value as number) / 1024) * 1024;
}

function ensure(off: number, n: number) {
  while (MEM!.buffer.byteLength < off + n) MEM!.grow(1);
}
function wr(off: number, d: Uint8Array) {
  ensure(off, d.length);
  new Uint8Array(MEM!.buffer, off, d.length).set(d);
}
function rd(off: number, n: number): Uint8Array {
  ensure(off, n);
  return new Uint8Array(MEM!.buffer, off, n).slice();
}

const OFF_A = () => BASE + 0;
const OFF_B = () => BASE + P;
const OFF_R = () => BASE + 2 * P;
const OFF_X = () => BASE + 3 * P;
const OFF_C = () => BASE + 4 * P;
const OFF_CP = () => BASE + 5 * P;
const OFF_BUF = () => BASE + 6 * P;

// Client blinds msg with random a,b against issuer R,X. Returns the blinded
// challenge `c` (sent to issuer) and `cPrime` (carried to unblind).
export function blind(
  msg: Uint8Array,
  a: Uint8Array,
  b: Uint8Array,
  R: Uint8Array,
  X: Uint8Array,
): { cPrime: Uint8Array; c: Uint8Array } {
  const m = OFF_BUF() + P;
  wr(m, msg);
  wr(OFF_A(), a);
  wr(OFF_B(), b);
  wr(OFF_R(), R);
  wr(OFF_X(), X);
  const ok = (INST!.exports as any).cs_blind(
    m, msg.length, OFF_A(), OFF_B(), OFF_R(), OFF_X(), OFF_C(), OFF_CP(),
  );
  if (ok !== 0) throw new Error('cs_blind failed');
  return { cPrime: rd(OFF_CP(), P), c: rd(OFF_C(), P) };
}

// Client unblinds the issuer response s with a: s' = s + a.
export function unblind(s: Uint8Array, a: Uint8Array): Uint8Array {
  wr(OFF_A(), s);
  wr(OFF_B(), a);
  const ok = (INST!.exports as any).cs_unblind(OFF_A(), OFF_B(), OFF_C());
  if (ok !== 0) throw new Error('cs_unblind failed');
  return rd(OFF_C(), P);
}
