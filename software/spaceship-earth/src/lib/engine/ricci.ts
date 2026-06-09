/**
 * @file ricci.ts — P31 Labs Discrete Ricci Flow Math (dRfge)
 * 
 * Ollivier-Ricci Curvature (κ) calculation for mesh topology.
 * Section 1.2 of Master Doctrine.
 * 
 * Hardened with:
 * - Input validation & clamping
 * - Non‑linear curvature response
 * - Numerical stability for extreme values
 * - Debug logging (optional)
 */

export interface RicciInput {
  latency: number;    // ms (0 … 10000+)
  noise: number;     // 0 … 1 (higher = more unstable)
  activeNodes: number;
}

export interface RicciOutput {
  curvature: number;    // κ value 0.5 … 1.5
  resilience: string;  // "100% - ISOSTATIC" | "57.7% - STABLE" | "DEGRADED"
  scale: number;       // dRfge visual scale factor
}

// Debug logging – disabled by default, enable via localStorage
const DEBUG_KEY = "P31_RICCI_DEBUG";
const debugEnabled = () => typeof localStorage !== 'undefined' && localStorage.getItem(DEBUG_KEY) === 'true';

/**
 * Clamp a value between min and max, with NaN protection.
 */
function clamp(value: number, min: number, max: number): number {
  if (isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/**
 * P31 Labs: Discrete Ricci Flow Math (dRfge)
 * 
 * Calculates proxy for Ollivier-Ricci Curvature (κ) used to detect
 * bottlenecks in the peer-to-peer mesh network.
 */
export class RicciMath {
  /**
   * Calculate a proxy for Ollivier-Ricci Curvature (κ)
   * 
   * Uses a sigmoid‑inspired response: latency up to 500ms has minor impact,
   * beyond 2000ms rapidly degrades curvature. Noise scales non‑linearly.
   * 
   * @param latency - Network latency in ms (clamped 0 … 10000)
   * @param noise - Network noise factor 0 … 1 (clamped)
   * @returns κ value between 0.5 … 1.5
   */
  static calculateCurvature(latency: number, noise: number): number {
    // Validate & clamp inputs
    let l = clamp(latency, 0, 10000);
    let n = clamp(noise, 0, 1);

    // Latency penalty: smooth transition, max penalty at 5000ms = 0.5
    const latencyPenalty = 1 - (1 / (1 + Math.pow(l / 800, 2)));
    
    // Noise penalty: noise^1.5 (more punishing at high noise)
    const noisePenalty = Math.pow(n, 1.5);
    
    // Combined friction: weighted sum (latency dominates)
    const friction = (latencyPenalty * 0.7) + (noisePenalty * 0.3);
    
    // Base curvature = 1.0, subtract friction, then clamp to [0.5, 1.5]
    let curvature = 1.0 - friction;
    curvature = clamp(curvature, 0.5, 1.5);
    
    if (debugEnabled()) {
      console.debug(`[Ricci] curvature: l=${l}ms n=${n.toFixed(2)} → κ=${curvature.toFixed(3)}`);
    }
    
    return curvature;
  }

  /**
   * Calculate mesh resilience based on active node count.
   * 
   * @param activeNodes - Number of active nodes in K4 mesh (must be integer >=0)
   * @returns Resilience description
   */
  static getResilience(activeNodes: number): string {
    let nodes = Math.floor(Math.max(0, activeNodes));
    
    if (nodes >= 4) return "100% - ISOSTATIC";
    if (nodes === 3) return "57.7% - STABLE";
    return "DEGRADED";
  }

  /**
   * Calculate dRfge visual scale factor for 3D rendering.
   * Scale oscillates based on curvature deviation from 1.0.
   * 
   * @param curvature - Current κ value (expected 0.5 … 1.5)
   * @returns Scale factor for mesh visualization (0.6 … 1.4)
   */
  static getScaleFactor(curvature: number): number {
    let k = clamp(curvature, 0.5, 1.5);
    let scale = 0.8 + (k - 1.0) * 0.6;
    return clamp(scale, 0.6, 1.4);
  }

  /**
   * Complete Ricci calculation for a given input state.
   * Handles all edge cases and returns safe values.
   * 
   * @param input - RicciInput with latency, noise, node count
   * @returns RicciOutput with curvature, resilience, scale
   */
  static calculate(input: RicciInput): RicciOutput {
    const safeInput = {
      latency: typeof input?.latency === 'number' ? input.latency : 100,
      noise: typeof input?.noise === 'number' ? input.noise : 0.5,
      activeNodes: typeof input?.activeNodes === 'number' ? Math.floor(input.activeNodes) : 0
    };
    
    const curvature = this.calculateCurvature(safeInput.latency, safeInput.noise);
    const resilience = this.getResilience(safeInput.activeNodes);
    const scale = this.getScaleFactor(curvature);
    
    return { curvature, resilience, scale };
  }
}

let timeOffset = 0;

export function getAnimatedCurvature(baseCurvature: number, time: number): number {
  let k = clamp(baseCurvature, 0.5, 1.5);
  let t = (typeof time === 'number' && !isNaN(time)) ? time : 0;
  
  const oscillation = Math.sin(t * 0.5) * 0.08;
  let result = k + oscillation;
  
  return clamp(result, 0.5, 1.5);
}

if (typeof window !== 'undefined') {
  (window as any).__P31_RICCI_DEBUG = {
    enable: () => localStorage.setItem(DEBUG_KEY, 'true'),
    disable: () => localStorage.removeItem(DEBUG_KEY),
    status: () => debugEnabled()
  };
}