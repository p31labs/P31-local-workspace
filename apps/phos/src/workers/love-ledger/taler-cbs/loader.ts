// taler-cbs/loader.ts — shared CBS WASM loader (worker + browser).
//
// Binds taler_cs.wasm (Rust + curve25519-dalek). Exposes the CBS
// protocol: blind / signBlinded / unblind / verify / base(x·G).
// The WASM memory layout uses a SAFE base above the Rust stack/data
// region (see AXIS-1_FINAL_DELIVERABLE.md §5) to avoid clobbering
// call frames.

let INST: any = null;
let MEM: WebAssembly.Memory | null = null;
const P = 32;
const CAP = 1024;
let BASE = 0;

export async function init(
  input: WebAssembly.Module | ArrayBuffer | Uint8Array,
): Promise<void> {
  if (INST) return;
  const mod =
    input instanceof WebAssembly.Module
      ? await WebAssembly.instantiate(input, { env: {} })
      : await WebAssembly.instantiate(input as ArrayBuffer, { env: {} });
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
  const ok = INST.exports.cs_blind(
    m, msg.length, OFF_A(), OFF_B(), OFF_R(), OFF_X(), OFF_C(), OFF_CP(),
  );
  if (ok !== 0) throw new Error('cs_blind failed');
  return { cPrime: rd(OFF_CP(), P), c: rd(OFF_C(), P) };
}

export function signBlinded(
  c: Uint8Array,
  n: Uint8Array,
  x: Uint8Array,
): Uint8Array {
  wr(OFF_A(), c);
  wr(OFF_B(), n);
  wr(OFF_X(), x);
  const ok = INST.exports.cs_sign_blinded(OFF_A(), OFF_B(), OFF_X(), OFF_C());
  if (ok !== 0) throw new Error('cs_sign_blinded failed');
  return rd(OFF_C(), P);
}

export function unblind(s: Uint8Array, a: Uint8Array): Uint8Array {
  wr(OFF_A(), s);
  wr(OFF_B(), a);
  const ok = INST.exports.cs_unblind(OFF_A(), OFF_B(), OFF_C());
  if (ok !== 0) throw new Error('cs_unblind failed');
  return rd(OFF_C(), P);
}

export function verify(
  msg: Uint8Array,
  cPrime: Uint8Array,
  sPrime: Uint8Array,
  X: Uint8Array,
  R: Uint8Array,
): boolean {
  const m = OFF_BUF() + P;
  wr(m, msg);
  wr(OFF_A(), cPrime);
  wr(OFF_B(), sPrime);
  wr(OFF_X(), X);
  wr(OFF_R(), R);
  return INST.exports.cs_verify(m, msg.length, OFF_A(), OFF_B(), OFF_X(), OFF_R()) === 0;
}

export function base(x: Uint8Array): Uint8Array {
  wr(OFF_A(), x);
  const ok = INST.exports.cs_base(OFF_A(), OFF_C());
  if (ok !== 0) throw new Error('cs_base failed');
  return rd(OFF_C(), P);
}
