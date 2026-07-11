// taler-cbs/loader.ts — Clause Blind Schnorr WASM loader (love-ledger Worker).
//
// Cloudflare Workers (workerd) BLOCKS runtime WASM code-gen from raw bytes
// ("Wasm code generation disallowed by embedder"). The supported path is a
// pre-compiled module: wrangler's [[rules]] type = "CompiledWasm" compiles
// ./taler_cs.wasm at deploy time into a WebAssembly.Module, which we import
// here. We then instantiate that pre-compiled module ONCE (this is allowed —
// only compiling from raw bytes is blocked) and cache instance.exports
// (memory, __heap_base, cs_*). See AXIS-1_FINAL_DELIVERABLE.md §6.1.

import * as wasmNs from './taler_cs.wasm';

const P = 32;

let instance: WebAssembly.Instance | null = null;
let initialized = false;

// Captured after init so hot-path functions avoid null checks.
let MEM!: WebAssembly.Memory;
let csBlind!: (m: number, ml: number, a: number, b: number, r: number, x: number, c: number, cp: number) => number;
let csSign!: (c: number, n: number, x: number, out: number) => number;
let csUnblind!: (s: number, a: number, out: number) => number;
let csVerify!: (m: number, ml: number, cp: number, sp: number, x: number, r: number) => number;
let csBase!: (x: number, out: number) => number;

let BASE = 0;

export async function ensureCbs(): Promise<void> {
  if (initialized) return;
  // Pre-compiled module — instantiate is allowed (no runtime code-gen).
  // With ESM .wasm imports the bound value may arrive as the Module
  // directly, as a namespace with a `.default` Module, or as a
  // pre-instantiated Instance. Handle all three shapes defensively.
  const input: any = (wasmNs as any)?.default ?? wasmNs;
  let inst: WebAssembly.Instance;
  if (input instanceof WebAssembly.Instance) {
    inst = input;
  } else {
    inst = await WebAssembly.instantiate(input as WebAssembly.Module);
  }
  instance = inst;
  const ex = instance.exports as Record<string, any>;
  MEM = ex.memory as WebAssembly.Memory;
  const heapBase = (ex.__heap_base as WebAssembly.Global).value as number;
  BASE = Math.ceil(heapBase / 1024) * 1024;
  csBlind = ex.cs_blind;
  csSign = ex.cs_sign_blinded;
  csUnblind = ex.cs_unblind;
  csVerify = ex.cs_verify;
  csBase = ex.cs_base;
  initialized = true;
}

function ensure(off: number, n: number) {
  while (MEM.buffer.byteLength < off + n) MEM.grow(1);
}
function wr(off: number, d: Uint8Array) {
  ensure(off, d.length);
  new Uint8Array(MEM.buffer, off, d.length).set(d);
}
function rd(off: number, n: number): Uint8Array {
  ensure(off, n);
  return new Uint8Array(MEM.buffer, off, n).slice();
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
  const ok = csBlind(m, msg.length, OFF_A(), OFF_B(), OFF_R(), OFF_X(), OFF_C(), OFF_CP());
  if (ok !== 0) throw new Error('cs_blind failed');
  return { cPrime: rd(OFF_CP(), P), c: rd(OFF_C(), P) };
}

export function signBlinded(c: Uint8Array, n: Uint8Array, x: Uint8Array): Uint8Array {
  wr(OFF_A(), c);
  wr(OFF_B(), n);
  wr(OFF_X(), x);
  const ok = csSign(OFF_A(), OFF_B(), OFF_X(), OFF_C());
  if (ok !== 0) throw new Error('cs_sign_blinded failed');
  return rd(OFF_C(), P);
}

export function unblind(s: Uint8Array, a: Uint8Array): Uint8Array {
  wr(OFF_A(), s);
  wr(OFF_B(), a);
  const ok = csUnblind(OFF_A(), OFF_B(), OFF_C());
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
  return csVerify(m, msg.length, OFF_A(), OFF_B(), OFF_X(), OFF_R()) === 0;
}

export function base(x: Uint8Array): Uint8Array {
  wr(OFF_A(), x);
  const ok = csBase(OFF_A(), OFF_C());
  if (ok !== 0) throw new Error('cs_base failed');
  return rd(OFF_C(), P);
}
