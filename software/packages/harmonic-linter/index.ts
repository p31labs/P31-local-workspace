/**
 * @p31/harmonic-linter — Samson's Law V2 PID Controller
 *
 * Analyzes TypeScript/JavaScript source files using Halstead volume,
 * cyclomatic complexity, and LOC to produce a normalized entropy score [0, 1].
 * A module-level PID controller drives the score toward the Mark 1 Attractor:
 *   setpoint = π/9 ≈ 0.349
 *
 * Expected output ranges:
 *   - Simple 10-line function  → entropy ~0.05–0.15, correction > 0  (headroom for features)
 *   - 200-line complex module  → entropy ~0.40–0.60, correction < 0  (refactor signal)
 *   - Attractor: π/9 ≈ 0.349  → correction ≈ 0                      (harmonic equilibrium)
 */

// ---------------------------------------------------------------------------
// STEP 1 — Acorn import
// acorn is not present in the P31 workspace, so we load it from CDN at runtime.
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AcornModule = { parse: (src: string, opts: Record<string, unknown>) => any };

let _acorn: AcornModule | null = null;

async function getAcorn(): Promise<AcornModule> {
  if (_acorn) return _acorn;
  try {
    // Attempt local resolution first (works if acorn is hoisted by the monorepo)
    _acorn = (await import("acorn")) as AcornModule;
  } catch {
    // Fall back to CDN
    _acorn = (await import(
      "https://cdn.jsdelivr.net/npm/acorn@8.14.0/dist/acorn.mjs"
    )) as AcornModule;
  }
  return _acorn;
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type AnalysisResult = {
  halstead: number;
  cyclomatic: number;
  loc: number;
  entropy: number;
  /** PID correction output: >0 = headroom for features, <0 = refactor signal */
  correction: number;
};

// ---------------------------------------------------------------------------
// STEP 2 — AST walker (single recursive pass, no external walk library)
// ---------------------------------------------------------------------------

const OPERATOR_NODES = new Set([
  "BinaryExpression",
  "UnaryExpression",
  "LogicalExpression",
  "AssignmentExpression",
  "UpdateExpression",
]);

const COMPLEXITY_NODES = new Set([
  "IfStatement",
  "ForStatement",
  "WhileStatement",
  "DoWhileStatement",
  "ConditionalExpression",
  "CatchClause",
]);

interface HalsteadCounts {
  n1: Set<string>;  // distinct operators
  n2: Set<string>;  // distinct operands
  N1: number;       // total operator occurrences
  N2: number;       // total operand occurrences
}

interface WalkResult extends HalsteadCounts {
  cyclomatic: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function walkNode(node: any, acc: WalkResult): void {
  if (node === null || typeof node !== "object") return;

  const type: string = node.type;
  if (!type) return;

  // Operator collection
  if (OPERATOR_NODES.has(type) && typeof node.operator === "string") {
    acc.n1.add(node.operator);
    acc.N1 += 1;
  }

  // Operand collection
  if (type === "Identifier" && typeof node.name === "string") {
    acc.n2.add(node.name);
    acc.N2 += 1;
  } else if (type === "Literal") {
    const key = String(node.value);
    acc.n2.add(key);
    acc.N2 += 1;
  }

  // Cyclomatic complexity contributions
  if (COMPLEXITY_NODES.has(type)) {
    acc.cyclomatic += 1;
  }
  // SwitchCase only when it has a test (non-default case)
  if (type === "SwitchCase" && node.test !== null) {
    acc.cyclomatic += 1;
  }
  // LogicalExpression: && or ||
  if (type === "LogicalExpression" &&
      (node.operator === "&&" || node.operator === "||")) {
    acc.cyclomatic += 1;
  }

  // Recurse into all child nodes
  for (const key of Object.keys(node)) {
    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child) {
        walkNode(item, acc);
      }
    } else if (child !== null && typeof child === "object" && child.type) {
      walkNode(child, acc);
    }
  }
}

// ---------------------------------------------------------------------------
// STEP 3 — Raw metrics
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function computeMetrics(ast: any, source: string): { halstead: number; cyclomatic: number; loc: number } {
  const acc: WalkResult = {
    n1: new Set(),
    n2: new Set(),
    N1: 0,
    N2: 0,
    cyclomatic: 1, // baseline
  };

  walkNode(ast, acc);

  const vocabulary = acc.n1.size + acc.n2.size;
  const length = acc.N1 + acc.N2;

  // Halstead Volume: V = (N1 + N2) * log2(max(n1 + n2, 1))
  const halstead = length * Math.log2(Math.max(vocabulary, 1));

  const loc = source.split("\n").length;

  return { halstead, cyclomatic: acc.cyclomatic, loc };
}

// ---------------------------------------------------------------------------
// STEP 4 — Entropy normalization
// ---------------------------------------------------------------------------

function normalizeEntropy(halstead: number, cyclomatic: number, loc: number): number {
  const H =
    (halstead / 2000) * 0.4 +
    ((cyclomatic - 1) / 39) * 0.35 +
    (loc / 500) * 0.25;

  return Math.max(0, Math.min(1, H));
}

// ---------------------------------------------------------------------------
// STEP 5 — PID Controller
// ---------------------------------------------------------------------------

/**
 * Stateful PID controller driving code entropy toward the Mark 1 Attractor (π/9).
 *
 * - Negative output → module is too complex (refactor signal)
 * - Positive output → module has headroom for new features
 */
export class PIDController {
  private readonly kp: number;
  private readonly ki: number;
  private readonly kd: number;
  readonly setpoint: number;

  private integral = 0;
  private prevError = 0;
  private initialized = false;

  constructor(
    kp = 1.0,
    ki = 0.05,
    kd = 0.02,
    setpoint = Math.PI / 9,
  ) {
    this.kp = kp;
    this.ki = ki;
    this.kd = kd;
    this.setpoint = setpoint;
  }

  /**
   * Feed a new measured entropy value and get the correction signal.
   * @param measured  Normalized entropy in [0, 1]
   * @param dt        Time delta (default 1 — treat each call as one tick)
   */
  update(measured: number, dt = 1): number {
    const error = this.setpoint - measured;

    // Integral with clamping [-5, 5]
    this.integral = Math.max(-5, Math.min(5, this.integral + error * dt));

    // Derivative (skip on first call to avoid impulse)
    const derivative = this.initialized ? (error - this.prevError) / dt : 0;
    this.initialized = true;
    this.prevError = error;

    return this.kp * error + this.ki * this.integral + this.kd * derivative;
  }

  /** Reset integral and derivative state (call between unrelated files). */
  reset(): void {
    this.integral = 0;
    this.prevError = 0;
    this.initialized = false;
  }
}

// ---------------------------------------------------------------------------
// Module-level PID instance (shared across analyzeModule calls)
// ---------------------------------------------------------------------------

const _pid = new PIDController();

/** Reset the module-level PID controller state. */
export function resetPID(): void {
  _pid.reset();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse and analyse a JavaScript/TypeScript source string.
 *
 * Uses a module-level {@link PIDController} instance so successive calls
 * accumulate integral state — call {@link resetPID} between independent files.
 *
 * On parse error, returns a safe fallback:
 *   { halstead: 0, cyclomatic: 1, loc, entropy: 0, correction: π/9 }
 */
export async function analyzeModule(source: string): Promise<AnalysisResult> {
  const loc = source.split("\n").length;

  let ast: unknown;
  try {
    const acorn = await getAcorn();
    ast = acorn.parse(source, { ecmaVersion: 2022, sourceType: "module" });
  } catch {
    // Parse error fallback — correction equals setpoint (treat as blank slate)
    return {
      halstead: 0,
      cyclomatic: 1,
      loc,
      entropy: 0,
      correction: Math.PI / 9,
    };
  }

  const { halstead, cyclomatic } = computeMetrics(ast, source);
  const entropy = normalizeEntropy(halstead, cyclomatic, loc);
  const correction = _pid.update(entropy);

  return { halstead, cyclomatic, loc, entropy, correction };
}
