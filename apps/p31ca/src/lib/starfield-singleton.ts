/**
 * starfield-singleton.ts — WebGL2 starfield for the AppShell production layout.
 *
 * Owns one canvas, one GL context, one rAF loop.
 * Per-route: camera Z, hue, particle count, speed — all smooth-lerp on route change.
 *
 * Diagnostics on `window.__p31AppShell`:
 *   { canvasId, navCount, canvasAttachCount, ctxLost, ctxRestored, ctxHealthy,
 *     fps, route, bytes, countCurrent, speedCurrent }
 */

const CANVAS_ID = (() => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as Crypto).randomUUID();
  }
  return `appshell-${Math.random().toString(36).slice(2, 10)}`;
})();

// ── Route config ──────────────────────────────────────────────────────────────

export type RouteId =
  | 'home'
  | 'dome'
  | 'research'
  | 'connect'
  | 'ops'
  | 'garden'
  | 'passport'
  | 'qfactor'
  | 'node-zero'
  | 'messaging-hub'
  | 'demo-labs'
  | 'p31-canon-demo'
  | '404'
  | 'geodesic-math'
  | 'god'
  | 'grants'
  | 'integrations'
  | 'mesh-observatory'
  | 'orchestrator'
  | 'atmosphere'
  | 'quantum-lattice'
  | 'abyssal-node'
  | 'cybernetic-bonsai';

interface RouteCam {
  z: number;      // camera dolly Z
  hue: number;    // HSV hue [0-1] for particle color
  count: number;  // target particle count (≤ MAX_PARTICLES)
  speed: number;  // animation speed multiplier fed to uSpeed uniform
}

const MAX_PARTICLES = 800;

const ROUTE_CAM: Record<RouteId, RouteCam> = {
   home:     { z:  0.0,  hue: 0.971, count: 800, speed: 0.15 }, // #f43f5e rose
   dome:     { z: -1.2,  hue: 0.552, count: 400, speed: 0.08 }, // #0ea5e9 sky
   research: { z: -0.4,  hue: 0.444, count: 600, speed: 0.12 }, // var(--p31-teal) emerald
   connect:  { z: -0.6,  hue: 0.718, count: 700, speed: 0.13 }, // #8b5cf6 violet
   ops:      { z:  0.4,  hue: 0.600, count: 150, speed: 0.01 }, // #64748b slate
   garden:   { z:  0.8,  hue: 0.105, count:  25, speed: 0.05 }, // var(--p31-amber) amber
   passport:   { z: -0.2,  hue: 0.710, count: 500, speed: 0.10 }, // #a78bfa violet-400
   qfactor:    { z: -0.3,  hue: 0.444, count: 420, speed: 0.09 }, // var(--p31-teal) emerald (vitality)
   'node-zero':{ z:  0.1,  hue: 0.552, count: 580, speed: 0.11 }, // #0ea5e9 sky (hardware mesh)
   'messaging-hub':  { z:  0.2,  hue: 0.444, count: 450, speed: 0.06 }, // Emerald (E2E Secure)
   'demo-labs':      { z: -0.1,  hue: 0.105, count: 600, speed: 0.12 }, // Amber (Experimental)
   'p31-canon-demo': { z:  0.0,  hue: 0.718, count: 350, speed: 0.08 }, // Violet (Design Canon)
   '404':            { z:  0.6,  hue: 0.000, count:  80, speed: 0.02 }, // sparse/lost — coral
   'geodesic-math':  { z: -0.3,  hue: 0.444, count: 300, speed: 0.06 }, // Emerald (geometry)
   'god':            { z:  0.2,  hue: 0.600, count: 180, speed: 0.03 }, // Slate (operator shell)
   'grants':         { z: -0.2,  hue: 0.333, count: 480, speed: 0.10 }, // Green (growth/funding)
   'integrations':   { z: -0.4,  hue: 0.718, count: 530, speed: 0.11 }, // Violet (mesh/connect)
   'mesh-observatory':{ z: -0.5, hue: 0.552, count: 620, speed: 0.12 }, // Sky (live data)
   'orchestrator':   { z:  0.3,  hue: 0.000, count: 160, speed: 0.03 }, // Coral (cockpit/alert)
   'atmosphere':     { z:  0.0,  hue: 0.444, count:   0, speed: 0.00 }, // Suspended — owns its own canvas
   'quantum-lattice':{ z: -0.8,  hue: 0.250, count: 500, speed: 0.10 }, // Deep cyan for quantum lattice
   'abyssal-node':   { z: -0.6,  hue: 0.620, count: 600, speed: 0.12 }, // Violet-purple for abyss
   'cybernetic-bonsai':{ z: -0.4, hue: 0.105, count: 200, speed: 0.08 }, // Amber for PID/bonsai glow
};

// ── GLSL shaders ──────────────────────────────────────────────────────────────
// Defined once at module level so getOrInit and rebuildGpuResources share them.

const VS = `
  #version 100
  attribute vec3 aPos;
  uniform float uTime;
  uniform float uCamZ;
  uniform float uAspect;
  uniform float uSpeed;
  varying float vDepth;
  void main() {
    float t = uTime * uSpeed;
    float x = aPos.x + sin(aPos.z * 4.0 + t) * 0.08;
    float y = aPos.y + cos(aPos.z * 3.0 + t * 1.2) * 0.08;
    float z = aPos.z + uCamZ;
    vDepth = clamp(0.5 - z * 0.5, 0.05, 1.0);
    float scale = 1.0 / max(0.2, 1.0 + z);
    gl_Position = vec4(x * scale / uAspect, y * scale, z * 0.4, 1.0);
    gl_PointSize = mix(1.2, 3.0, vDepth);
  }
`;

const FS = `
  #version 100
  precision mediump float;
  uniform float uHue;
  varying float vDepth;
  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float r = length(uv);
    if (r > 0.5) discard;
    float a = (1.0 - r * 2.0) * vDepth;
    vec3 rgb = hsv2rgb(vec3(uHue, 0.45, 0.95));
    gl_FragColor = vec4(rgb, a);
  }
`;

// ── State types ───────────────────────────────────────────────────────────────

interface ShellStats {
  canvasId: string;
  navCount: number;
  canvasAttachCount: number;
  ctxLost: number;
  ctxRestored: number;
  ctxHealthy: boolean;
  fps: number;
  route: RouteId | null;
  bytes: number;
  countCurrent: number;
  speedCurrent: number;
}

interface ShellState {
  canvas: HTMLCanvasElement | null;
  gl: WebGLRenderingContext | WebGL2RenderingContext | null;
  program: WebGLProgram | null;
  vbo: WebGLBuffer | null;
  vao: WebGLVertexArrayObject | null;
  uTime: WebGLUniformLocation | null;
  uCamZ: WebGLUniformLocation | null;
  uAspect: WebGLUniformLocation | null;
  uHue: WebGLUniformLocation | null;
  uSpeed: WebGLUniformLocation | null;
  rafId: number;
  startedAt: number;
  lastFrameAt: number;
  frameAccum: number[];
  navCount: number;
  canvasAttachCount: number;
  ctxLost: number;
  ctxRestored: number;
  ctxHealthy: boolean;
  route: RouteId | null;
  camTarget: number;
  camCurrent: number;
  hueTarget: number;
  hueCurrent: number;
  countTarget: number;
  countCurrent: number;
  speedTarget: number;
  speedCurrent: number;
  bytes: number;
  stopped: boolean;
}

// ── Module singleton ──────────────────────────────────────────────────────────

let state: ShellState | null = null;

// Alert overlay — saves route targets so clearStarfieldAlert() can restore them.
type RouteCamSnapshot = Pick<ShellState, 'camTarget' | 'hueTarget' | 'countTarget' | 'speedTarget'>;
let alertSaved: RouteCamSnapshot | null = null;
/* WeakSet: if transition:persist works, every nav yields the SAME canvas instance.
 * canvasAttachCount stays at 1. If Astro creates a fresh canvas on each nav, it grows. */
const seenCanvases = new WeakSet<HTMLCanvasElement>();
let canvasAttachCount = 0;

function getOrInit(canvas: HTMLCanvasElement): ShellState {
  if (state && state.canvas === canvas) return state;

  if (!seenCanvases.has(canvas)) {
    seenCanvases.add(canvas);
    canvasAttachCount += 1;
  }

  if (state && state.canvas !== canvas) {
    /* Canvas re-created across navigation — tear down old GL context. */
    cancelAnimationFrame(state.rafId);
    const old = state;
    if (old.gl) {
      try {
        if (old.program) old.gl.deleteProgram(old.program);
        if (old.vbo) old.gl.deleteBuffer(old.vbo);
        if (old.vao && 'deleteVertexArray' in old.gl) {
          (old.gl as WebGL2RenderingContext).deleteVertexArray(old.vao);
        }
      } catch { /* GL context may already be lost */ }
    }
  }

  const ctxAttribs: WebGLContextAttributes = {
    powerPreference: 'high-performance',
    failIfMajorPerformanceCaveat: false,
    preserveDrawingBuffer: false,
  };
  const gl =
    (canvas.getContext('webgl2', ctxAttribs) as WebGL2RenderingContext | null) ||
    (canvas.getContext('webgl', ctxAttribs) as WebGLRenderingContext | null);
  if (!gl) throw new Error('starfield-singleton: no WebGL context');

  resizeCanvasToDisplay(canvas);

  const program = compileProgram(gl, VS, FS);
  if (!program) throw new Error('starfield-singleton: program failed to link');

  const positions = new Float32Array(MAX_PARTICLES * 3);
  for (let i = 0; i < MAX_PARTICLES; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 2;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
  }
  const vbo = gl.createBuffer();
  if (!vbo) throw new Error('starfield-singleton: failed to create vbo');
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  let vao: WebGLVertexArrayObject | null = null;
  if ('createVertexArray' in gl) {
    vao = (gl as WebGL2RenderingContext).createVertexArray();
    (gl as WebGL2RenderingContext).bindVertexArray(vao);
    const aPos = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
  }

  const uTime   = gl.getUniformLocation(program, 'uTime');
  const uCamZ   = gl.getUniformLocation(program, 'uCamZ');
  const uAspect = gl.getUniformLocation(program, 'uAspect');
  const uHue    = gl.getUniformLocation(program, 'uHue');
  const uSpeed  = gl.getUniformLocation(program, 'uSpeed');

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const homeConfig = ROUTE_CAM.home;
  const next: ShellState = {
    canvas,
    gl,
    program,
    vbo,
    vao,
    uTime,
    uCamZ,
    uAspect,
    uHue,
    uSpeed,
    rafId: 0,
    startedAt: performance.now(),
    lastFrameAt: performance.now(),
    frameAccum: [],
    navCount: state?.navCount ?? 0,
    canvasAttachCount,
    ctxLost: state?.ctxLost ?? 0,
    ctxRestored: state?.ctxRestored ?? 0,
    ctxHealthy: true,
    route: null,
    camTarget: homeConfig.z,
    camCurrent: homeConfig.z,
    hueTarget: homeConfig.hue,
    hueCurrent: homeConfig.hue,
    countTarget: homeConfig.count,
    countCurrent: homeConfig.count,
    speedTarget: homeConfig.speed,
    speedCurrent: homeConfig.speed,
    bytes: positions.byteLength,
    stopped: false,
  };

  canvas.addEventListener(
    'webglcontextlost',
    (e) => {
      e.preventDefault();
      next.ctxLost += 1;
      next.ctxHealthy = false;
      cancelAnimationFrame(next.rafId);
    },
    { once: false }
  );

  canvas.addEventListener(
    'webglcontextrestored',
    () => {
      next.ctxRestored += 1;
      rebuildGpuResources(next);
      next.ctxHealthy = true;
      if (!next.stopped) loop();
    },
    { once: false }
  );

  state = next;
  loop();
  exposeWindow();
  return next;
}

function compileProgram(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  vsSrc: string,
  fsSrc: string
): WebGLProgram | null {
  const vs = gl.createShader(gl.VERTEX_SHADER);
  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  if (!vs || !fs) return null;
  gl.shaderSource(vs, vsSrc);
  gl.compileShader(vs);
  if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
    console.warn('starfield-singleton: vs error', gl.getShaderInfoLog(vs));
    return null;
  }
  gl.shaderSource(fs, fsSrc);
  gl.compileShader(fs);
  if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
    console.warn('starfield-singleton: fs error', gl.getShaderInfoLog(fs));
    return null;
  }
  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('starfield-singleton: link error', gl.getProgramInfoLog(prog));
    return null;
  }
  return prog;
}

function resizeCanvasToDisplay(canvas: HTMLCanvasElement): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.floor(canvas.clientWidth * dpr);
  const h = Math.floor(canvas.clientHeight * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w || canvas.clientWidth || 800;
    canvas.height = h || canvas.clientHeight || 600;
  }
}

function rebuildGpuResources(s: ShellState): void {
  if (!s.canvas) return;
  const ctxAttribs: WebGLContextAttributes = {
    powerPreference: 'high-performance',
    failIfMajorPerformanceCaveat: false,
    preserveDrawingBuffer: false,
  };
  const gl =
    (s.canvas.getContext('webgl2', ctxAttribs) as WebGL2RenderingContext | null) ||
    (s.canvas.getContext('webgl', ctxAttribs) as WebGLRenderingContext | null);
  if (!gl) return;
  s.gl = gl;

  const program = compileProgram(gl, VS, FS);
  if (!program) return;
  s.program = program;

  const positions = new Float32Array(MAX_PARTICLES * 3);
  for (let i = 0; i < MAX_PARTICLES; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 2;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
  }
  const vbo = gl.createBuffer();
  if (!vbo) return;
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  s.vbo = vbo;

  let vao: WebGLVertexArrayObject | null = null;
  if ('createVertexArray' in gl) {
    vao = (gl as WebGL2RenderingContext).createVertexArray();
    (gl as WebGL2RenderingContext).bindVertexArray(vao);
    const aPos = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
  }
  s.vao   = vao;
  s.uTime   = gl.getUniformLocation(program, 'uTime');
  s.uCamZ   = gl.getUniformLocation(program, 'uCamZ');
  s.uAspect = gl.getUniformLocation(program, 'uAspect');
  s.uHue    = gl.getUniformLocation(program, 'uHue');
  s.uSpeed  = gl.getUniformLocation(program, 'uSpeed');

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}

function loop(): void {
  if (!state || state.stopped) return;
  if (!state.ctxHealthy) return;
  const { canvas, gl, program, vao, uTime, uCamZ, uAspect, uHue, uSpeed } = state;
  if (!canvas || !gl || !program) return;
  if (gl.isContextLost && gl.isContextLost()) {
    state.ctxHealthy = false;
    return;
  }

  resizeCanvasToDisplay(canvas);
  gl.viewport(0, 0, canvas.width, canvas.height);

  const now = performance.now();
  const dt = Math.min(now - state.lastFrameAt, 100);
  state.lastFrameAt = now;
  state.frameAccum.push(dt);
  if (state.frameAccum.length > 60) state.frameAccum.shift();

  /* ~600ms half-life lerp for all four dimensions. */
  const k = 1 - Math.pow(0.5, dt / 600);
  state.camCurrent   += (state.camTarget   - state.camCurrent)   * k;
  state.hueCurrent   += (state.hueTarget   - state.hueCurrent)   * k;
  state.countCurrent += (state.countTarget - state.countCurrent) * k;
  state.speedCurrent += (state.speedTarget - state.speedCurrent) * k;

  gl.clearColor(0.020, 0.020, 0.020, 1.0); // #050505 void
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);

  if (vao && 'bindVertexArray' in gl) {
    (gl as WebGL2RenderingContext).bindVertexArray(vao);
  } else {
    gl.bindBuffer(gl.ARRAY_BUFFER, state.vbo);
    const aPos = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
  }

  if (uTime)   gl.uniform1f(uTime,   (now - state.startedAt) / 1000);
  if (uCamZ)   gl.uniform1f(uCamZ,   state.camCurrent);
  if (uAspect) gl.uniform1f(uAspect, canvas.width / canvas.height);
  if (uHue)    gl.uniform1f(uHue,    state.hueCurrent);
  if (uSpeed)  gl.uniform1f(uSpeed,  state.speedCurrent);

  /* Count is lerped, not discrete — drawArrays(0, N) naturally fades count in/out. */
  gl.drawArrays(gl.POINTS, 0, Math.round(state.countCurrent));

  state.rafId = requestAnimationFrame(loop);
}

function exposeWindow(): void {
  if (typeof window === 'undefined' || !state) return;
  Object.defineProperty(window, '__p31AppShell', {
    configurable: true,
    enumerable: false,
    get(): ShellStats {
      return snapshotStarfieldStats() || ({} as ShellStats);
    },
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

export function startStarfield(canvas: HTMLCanvasElement): void {
  if (!canvas.dataset.p31AppshellId) {
    canvas.dataset.p31AppshellId = CANVAS_ID;
  }
  getOrInit(canvas);
  // Install Page Visibility handler once to suspend/resume on tab change
  installVisibilityHandler();
}

export function setStarfieldRoute(route: RouteId): void {
  if (!state) return;
  // Navigation supersedes any active alert state — clear before applying route.
  alertSaved = null;
  state.navCount += 1;
  state.route = route;
  const cfg = ROUTE_CAM[route];
  state.camTarget   = cfg.z;
  state.hueTarget   = cfg.hue;
  state.countTarget = cfg.count;
  state.speedTarget = cfg.speed;
}

/**
 * Temporarily overrides starfield targets for telemetry alert feedback.
 * Saves current targets so clearStarfieldAlert() can restore them.
 * 'warning' → amber, faster.  'critical' → coral, max particles, violent speed.
 */
export function alertStarfield(level: 'warning' | 'critical'): void {
  if (!state) return;
  if (!alertSaved) {
    alertSaved = {
      camTarget:   state.camTarget,
      hueTarget:   state.hueTarget,
      countTarget: state.countTarget,
      speedTarget: state.speedTarget,
    };
  }
  if (level === 'critical') {
    state.camTarget   = 0.0;
    state.hueTarget   = 0.971; // #f43f5e coral/rose — alarm hue
    state.countTarget = MAX_PARTICLES;
    state.speedTarget = 0.55;
  } else {
    // warning: restore camZ, push amber hue + modest speed boost
    state.camTarget   = alertSaved.camTarget;
    state.hueTarget   = 0.105;  // var(--p31-amber) amber
    state.countTarget = Math.min(alertSaved.countTarget * 1.5, MAX_PARTICLES);
    state.speedTarget = Math.min(alertSaved.speedTarget * 2.5, 0.40);
  }
}

/**
 * Restores starfield to the targets that were active before the last alertStarfield() call.
 * No-op if no alert is active.
 */
export function clearStarfieldAlert(): void {
  if (!state || !alertSaved) return;
  state.camTarget   = alertSaved.camTarget;
  state.hueTarget   = alertSaved.hueTarget;
  state.countTarget = alertSaved.countTarget;
  state.speedTarget = alertSaved.speedTarget;
  alertSaved = null;
}

export function snapshotStarfieldStats(): ShellStats | null {
  if (!state) return null;
  const avg = state.frameAccum.length > 0
    ? state.frameAccum.reduce((a, b) => a + b, 0) / state.frameAccum.length
    : 0;
  return {
    canvasId: state.canvas?.dataset.p31AppshellId ?? '',
    navCount: state.navCount,
    canvasAttachCount,
    ctxLost: state.ctxLost,
    ctxRestored: state.ctxRestored,
    ctxHealthy: state.ctxHealthy,
    fps: avg > 0 ? Math.round(1000 / avg) : 0,
    route: state.route,
    bytes: state.bytes,
    countCurrent: Math.round(state.countCurrent),
    speedCurrent: state.speedCurrent,
  };
}

export function suspendStarfield(): void {
  if (!state || state.stopped) return;
  state.stopped = true;
  cancelAnimationFrame(state.rafId);
}

export function resumeStarfield(): void {
  if (!state || !state.stopped) return;
  state.stopped = false;
  loop();
}

export function disposeStarfield(): void {
  if (!state) return;
  state.stopped = true;
  cancelAnimationFrame(state.rafId);
  const { gl, program, vbo, vao } = state;
  if (gl) {
    if (program) gl.deleteProgram(program);
    if (vbo) gl.deleteBuffer(vbo);
    if (vao && 'deleteVertexArray' in gl) (gl as WebGL2RenderingContext).deleteVertexArray(vao);
  }
  state = null;
}

// ── Page Visibility API integration ───────────────────────────────────────────
// Suspend starfield when tab is hidden to free GPU and stop RAF battery drain.

let visibilityHandlerInstalled = false;

function installVisibilityHandler(): void {
  if (visibilityHandlerInstalled || typeof document === 'undefined') return;
  visibilityHandlerInstalled = true;

  document.addEventListener('visibilitychange', () => {
    if (!state) return;
    if (document.hidden) {
      // Tab hidden: suspend immediately to save battery/GPU
      suspendStarfield();
      // Optional: release GL context entirely on mobile
      if (state.gl && 'getExtension' in state.gl) {
        const loseExt = state.gl.getExtension('WEBGL_lose_context');
        if (loseExt) {
          // Defer context loss to allow any pending draws to complete
          setTimeout(() => loseExt.loseContext(), 50);
        }
      }
    } else {
      // Tab visible: restore context and resume
      if (state.gl) {
        const canvas = state.canvas;
        if (canvas) {
          const loseExt = state.gl.getExtension('WEBGL_lose_context');
          if (loseExt) {
            loseExt.restoreContext();
          }
        }
      }
      resumeStarfield();
    }
  });
}


// ── Battery-Aware Quality Adjustment ──────────────────────────────────────────
// Reduce starfield quality when battery is low or thermal throttling detected.

if (typeof window !== "undefined") {
  window.addEventListener("p31:power-mode", (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (!detail || !state) return;

    // Get current route config
    const currentRoute = state.route || "home";
    const baseConfig = ROUTE_CAM[currentRoute];

    switch (detail.mode) {
      case "critical":
        // Disable starfield completely
        suspendStarfield();
        break;
      case "low":
        // Reduce to 1/4 of normal particle count, half speed
        state.countTarget = Math.round(baseConfig.count * 0.25);
        state.speedTarget = baseConfig.speed * 0.5;
        break;
      case "balanced":
        // Normal operation
        state.countTarget = baseConfig.count;
        state.speedTarget = baseConfig.speed;
        break;
      case "high":
        // Full quality (but capped at config max)
        state.countTarget = baseConfig.count;
        state.speedTarget = baseConfig.speed;
        break;
    }
  });

  // Also listen for motion preference
  window.addEventListener("p31:motion-preference", (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail?.reduced && state) {
      suspendStarfield();
    }
  });
}
