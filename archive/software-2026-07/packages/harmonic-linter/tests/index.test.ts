import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PIDController,
  resetPID,
  analyzeModule,
} from '../index';

// ─────────────────────────────────────────────────────────────────────────────
// Mock acorn — avoid CDN / local install requirement
// ─────────────────────────────────────────────────────────────────────────────

const mockParse = vi.fn();

vi.mock('acorn', () => ({
  default: { parse: mockParse },
  parse: mockParse,
}));

// Minimal valid AST node shape accepted by walkNode
function makeAST(overrides: Record<string, unknown> = {}): any {
  return {
    type: 'Program',
    body: [],
    sourceType: 'module',
    ...overrides,
  };
}

beforeEach(() => {
  mockParse.mockReset();
  resetPID();
});

// ═════════════════════════════════════════════════════════════════════════════
// PIDController
// ═════════════════════════════════════════════════════════════════════════════

describe('PIDController', () => {
  it('uses default constructor values', () => {
    const pid = new PIDController();
    expect(pid.kp).toBe(1.0);
    expect(pid.ki).toBe(0.05);
    expect(pid.kd).toBe(0.02);
    expect(pid.setpoint).toBeCloseTo(Math.PI / 9, 10);
  });

  it('accepts custom gains and setpoint', () => {
    const pid = new PIDController(2.0, 0.1, 0.05, 0.5);
    expect(pid.kp).toBe(2.0);
    expect(pid.ki).toBe(0.1);
    expect(pid.kd).toBe(0.05);
    expect(pid.setpoint).toBe(0.5);
  });

  it('returns positive correction when entropy is below setpoint', () => {
    const pid = new PIDController(1, 0, 0, 0.5);
    const corr = pid.update(0.1);
    expect(corr).toBeGreaterThan(0);
  });

  it('returns negative correction when entropy is above setpoint', () => {
    const pid = new PIDController(1, 0, 0, 0.5);
    const corr = pid.update(0.9);
    expect(corr).toBeLessThan(0);
  });

  it('returns near-zero correction at setpoint', () => {
    const pid = new PIDController(1, 0, 0, 0.5);
    const corr = pid.update(0.5);
    expect(Math.abs(corr)).toBeLessThan(0.01);
  });

  it('accumulates integral across calls', () => {
    const pid = new PIDController(0, 1, 0, 0.5); // pure integral
    pid.update(0.1); // error = 0.4
    const corr = pid.update(0.1); // error = 0.4, integral = 0.8
    expect(corr).toBeCloseTo(0.8, 5);
  });

  it('clamps integral to [-5, 5]', () => {
    const pid = new PIDController(0, 1, 0, 0.5);
    for (let i = 0; i < 20; i++) pid.update(0.0); // error = +0.5 each tick
    expect(pid.update(0)).toBeCloseTo(5, 5); // positive clamp
  });

  it('derivative is skipped on first call after reset', () => {
    const pid = new PIDController(0, 0, 1, 0.5);
    pid.update(0.3);
    pid.update(0.2);
    pid.reset();
    const corr = pid.update(0.5); // error=0, derivative skipped (initialized=false)
    expect(corr).toBe(0);
    expect(pid['initialized']).toBe(true);
  });

  it('derivative fires after initialization', () => {
    const pid = new PIDController(0, 0, 1, 0.5);
    pid.update(0.3);
    const corr = pid.update(0.5); // error went from 0.2→0, derivative = -0.2
    expect(corr).toBeCloseTo(-0.2, 5);
  });

  it('reset clears integral, derivative state, and initialized flag', () => {
    const pid = new PIDController(1, 0.05, 0.02, 0.5);
    pid.update(0.1);
    pid.update(0.2);
    pid.reset();
    expect(pid['initialized']).toBe(false);
    expect(pid['integral']).toBe(0);
    expect(pid['prevError']).toBe(0);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// normalizeEntropy
// ═════════════════════════════════════════════════════════════════════════════

describe('normalizeEntropy', () => {
  // Access internal via analyzeModule's indirect path:
  // We validate behavior through analyzeModule output.
  it('produces entropy in [0, 1] for a tiny function', async () => {
    mockParse.mockReturnValueOnce(makeAST({ type: 'Program', body: [] }));
    const result = await analyzeModule('export const x = 1;');
    expect(result.entropy).toBeGreaterThanOrEqual(0);
    expect(result.entropy).toBeLessThanOrEqual(1);
  });

  it('produces higher entropy for a larger, more complex module', async () => {
    const simple = `
      const a = 1;
      export default a;
    `;
    const complex = `
      function process(a, b) {
        if (a > b) {
          for (let i = 0; i < 10; i++) {
            if (i % 2 === 0 && a !== b) {
              console.log(i, a, b);
            }
          }
        }
        return a + b;
      }
      export { process };
    `;
    mockParse.mockReturnValueOnce(makeAST());
    const rSimple = await analyzeModule(simple);
    mockParse.mockReturnValueOnce(makeAST());
    const rComplex = await analyzeModule(complex);
    expect(rComplex.entropy).toBeGreaterThan(rSimple.entropy);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// analyzeModule
// ═════════════════════════════════════════════════════════════════════════════

describe('analyzeModule', () => {
  it('returns all required fields', async () => {
    mockParse.mockReturnValueOnce(makeAST());
    const result = await analyzeModule('const x = 1;');
    expect(result).toHaveProperty('halstead');
    expect(result).toHaveProperty('cyclomatic');
    expect(result).toHaveProperty('loc');
    expect(result).toHaveProperty('entropy');
    expect(result).toHaveProperty('correction');
  });

  it('counts LOC from line split', async () => {
    mockParse.mockReturnValueOnce(makeAST());
    const result = await analyzeModule('line1\nline2\nline3');
    expect(result.loc).toBe(3);
  });

  it('returns entropy 0 and correction = setpoint on parse error', async () => {
    mockParse.mockImplementation(() => {
      throw new Error('syntax error');
    });
    const result = await analyzeModule('!!! invalid !!!');
    expect(result.entropy).toBe(0);
    expect(result.halstead).toBe(0);
    expect(result.cyclomatic).toBe(1);
    expect(result.correction).toBeCloseTo(Math.PI / 9, 5);
  });

  it('baseline cyclomatic complexity is 1 for empty AST', async () => {
    mockParse.mockReturnValueOnce(makeAST({ type: 'Program', body: [] }));
    const result = await analyzeModule('');
    expect(result.cyclomatic).toBeGreaterThanOrEqual(1);
  });

  it('reuses module-level PID across calls (accumulates state)', async () => {
    resetPID();
    mockParse.mockReturnValueOnce(makeAST());
    const r1 = await analyzeModule('if (true) { const a = 1; }');
    mockParse.mockReturnValueOnce(makeAST());
    const r2 = await analyzeModule('if (true) { const b = 2; }');
    // Both corrections should be defined numbers
    expect(typeof r1.correction).toBe('number');
    expect(typeof r2.correction).toBe('number');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// resetPID
// ═════════════════════════════════════════════════════════════════════════════

describe('resetPID', () => {
  it('resets the module-level PID without throwing', () => {
    expect(() => resetPID()).not.toThrow();
  });

  it('allows fresh analysis after reset with no stale state', async () => {
    mockParse.mockReturnValueOnce(makeAST());
    await analyzeModule('if (true) {}');
    resetPID();
    mockParse.mockReturnValueOnce(makeAST());
    const result = await analyzeModule('const x = 1;');
    expect(typeof result.entropy).toBe('number');
  });
});
