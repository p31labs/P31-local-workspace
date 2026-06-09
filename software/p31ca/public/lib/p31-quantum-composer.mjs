/**
 * P31 Quantum Composer — Web Audio K₄ partials + Larmor harmonic lattice + TRIM-rate interference.
 *
 * - Larmor Hz is operator-locked to P31 home `p31-constants.json` → `physics.larmorHz` (display as 863Hz in shell).
 * - TRIM slow rhythm reuses grandfather boot (verify:quantum-clock family).
 *
 * Not physics simulation — a musical instrument that borrows honest P31 vocabulary (same posture as quantum-clock.html).
 */

import { TRIM_HZ_MIN } from "./p31-quantum-grandfather-boot.mjs";

/** @type {number} Must match `physics.larmorHz` in P31 home p31-constants.json */
export const LARMOR_HZ = 863;

const TAU = Math.PI * 2;
const K4 = 4;

/** Harmonic ladder: Larmor / d — four incommensurate-ish partials forming an open chord */
export const LARMOR_DIVISORS = [8, 6, 5, 4];

/**
 * @param {number} i
 * @returns {number}
 */
export function vertexFrequencyHz(i) {
  const d = LARMOR_DIVISORS[Math.max(0, Math.min(K4 - 1, i))] || 8;
  return LARMOR_HZ / d;
}

/**
 * Normalize four non-negative weights to sum 1 (Born-style display; audio uses sqrt for RMS-ish balance).
 * @param {number[]} w
 * @returns {number[]}
 */
export function bornNormalize(w) {
  const a = w.map((x) => Math.max(0, Number(x) || 0));
  const s = a.reduce((u, v) => u + v, 0) || 1;
  return a.map((x) => x / s);
}

/**
 * @typedef {Object} QuantumComposerOptions
 * @property {(state: { playing: boolean, weights: number[], phase: number }) => void} [onFrame]
 */

export class QuantumComposerEngine {
  /** @param {QuantumComposerOptions} [opts] */
  constructor(opts = {}) {
    this._opts = opts;
    /** @type {AudioContext | null} */
    this._ctx = null;
    /** @type {GainNode | null} */
    this._master = null;
    /** @type {OscillatorNode[]} */
    this._oscs = [];
    /** @type {GainNode[]} */
    this._gains = [];
    /** @type {BiquadFilterNode[]} */
    this._filters = [];
    this._playing = false;
    /** vertex weights (linear UI, 0–1) */
    this._weights = [0.85, 0.78, 0.72, 0.8];
    /** 0–1 interference depth (TRIM-rate beat) */
    this._interference = 0.35;
    /** 0–1 entangle: pairwise opposite LFO on detune */
    this._entangle = 0.5;
    this._t0 = 0;
    this._raf = 0;
    this._collapseUntil = 0;
    this._collapseVertex = -1;
  }

  /**
   * @returns {Promise<boolean>}
   */
  async resume() {
    if (typeof window === "undefined" || !window.AudioContext) return false;
    if (!this._ctx) {
      this._ctx = new AudioContext();
      this._master = this._ctx.createGain();
      this._master.gain.value = 0.22;

      const comp = this._ctx.createDynamicsCompressor();
      comp.threshold.value = -28;
      comp.knee.value = 18;
      comp.ratio.value = 8;
      comp.attack.value = 0.02;
      comp.release.value = 0.28;

      this._master.connect(comp);
      comp.connect(this._ctx.destination);

      for (let i = 0; i < K4; i++) {
        const o = this._ctx.createOscillator();
        o.type = i === 0 || i === 3 ? "sine" : "triangle";
        const f = this._ctx.createBiquadFilter();
        f.type = "lowpass";
        f.frequency.value = 5200 + i * 800;
        const g = this._ctx.createGain();
        g.gain.value = 0;
        o.connect(f);
        f.connect(g);
        g.connect(this._master);
        o.frequency.value = vertexFrequencyHz(i);
        o.start();
        this._oscs.push(o);
        this._filters.push(f);
        this._gains.push(g);
      }
    }
    if (this._ctx.state === "suspended") {
      await this._ctx.resume();
    }
    return true;
  }

  start() {
    if (!this._ctx) return;
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = 0;
    }
    this._playing = true;
    this._t0 = this._ctx.currentTime;
    this._loop();
  }

  stop() {
    this._playing = false;
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = 0;
    }
    for (const g of this._gains) {
      if (g && this._ctx) {
        g.gain.setTargetAtTime(0, this._ctx.currentTime, 0.05);
      }
    }
  }

  /** Tear down nodes */
  destroy() {
    this.stop();
    for (const o of this._oscs) {
      try {
        o.stop();
        o.disconnect();
      } catch {
        /* ignore */
      }
    }
    this._oscs = [];
    for (const g of this._gains) {
      try {
        g.disconnect();
      } catch {
        /* ignore */
      }
    }
    this._gains = [];
    for (const f of this._filters) {
      try {
        f.disconnect();
      } catch {
        /* ignore */
      }
    }
    this._filters = [];
    if (this._ctx) {
      this._ctx.close().catch(() => {});
    }
    this._ctx = null;
    this._master = null;
  }

  /**
   * @param {number[]} w four linear weights
   */
  setWeights(w) {
    for (let i = 0; i < K4; i++) {
      this._weights[i] = Math.max(0, Math.min(1, Number(w[i]) || 0));
    }
  }

  /**
   * @param {number} x 0–1
   */
  setInterference(x) {
    this._interference = Math.max(0, Math.min(1, x));
  }

  /**
   * @param {number} x 0–1
   */
  setEntangle(x) {
    this._entangle = Math.max(0, Math.min(1, x));
  }

  /**
   * Weighted "measurement" — spotlight one vertex briefly, then restore superposition.
   */
  measure() {
    if (!this._ctx) return;
    const p = bornNormalize(this._weights);
    let r = Math.random();
    let idx = K4 - 1;
    for (let i = 0; i < K4; i++) {
      r -= p[i];
      if (r <= 0) {
        idx = i;
        break;
      }
    }
    this._collapseVertex = idx;
    this._collapseUntil = this._ctx.currentTime + 2.2;
  }

  _loop() {
    if (!this._playing || !this._ctx) {
      this._raf = 0;
      return;
    }
    const t = this._ctx.currentTime - this._t0;
    const trimPhase = TAU * TRIM_HZ_MIN * t;
    const born = bornNormalize(this._weights);
    const amps = born.map((p) => Math.sqrt(p));

    const collapse = this._collapseUntil > this._ctx.currentTime;
    const cv = this._collapseVertex;

    for (let i = 0; i < K4; i++) {
      const base = vertexFrequencyHz(i);
      const sign = this._entangle > 0.5 ? (i % 2 === 0 ? 1 : -1) : 1;
      const beat =
        Math.sin(trimPhase + i * (TAU / K4) * this._entangle) *
        (0.012 * this._interference * (0.4 + this._entangle));
      const detuneHz = base * beat * sign;
      const fTarget = base + detuneHz;
      this._oscs[i].frequency.setTargetAtTime(fTarget, this._ctx.currentTime, 0.04);

      let a = amps[i] * 0.09;
      if (collapse && cv === i) a = Math.min(0.14, a * 2.4);
      else if (collapse) a *= 0.12;

      this._gains[i].gain.setTargetAtTime(a, this._ctx.currentTime, 0.06);
    }

    if (this._opts.onFrame) {
      this._opts.onFrame({
        playing: this._playing,
        weights: [...born],
        phase: (trimPhase % TAU) / TAU,
      });
    }

    this._raf = requestAnimationFrame(() => this._loop());
  }
}

