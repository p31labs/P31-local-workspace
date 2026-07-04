/**
 * starfield-singleton.js — WebGL2 starfield for about pages
 * Simplified JS version for direct browser import
 */

const CANVAS_ID = typeof crypto !== 'undefined' && 'randomUUID' in crypto
  ? crypto.randomUUID()
  : `starfield-${Math.random().toString(36).slice(2, 10)}`;

const MAX_PARTICLES = 800;

// Default route config (used when route not found)
const DEFAULT_CAM = { z: 0.0, hue: 0.444, count: 600, speed: 0.12 };

// Route configurations
const ROUTE_CAM = {
  bonding:       { z: 0.0, hue: 0.444, count: 600, speed: 0.12 },
  attractor:     { z: -0.3, hue: 0.250, count: 500, speed: 0.10 },
  axiom:         { z: -0.4, hue: 0.718, count: 530, speed: 0.11 },
  god:           { z: 0.2, hue: 0.600, count: 180, speed: 0.03 },
  geodesic:      { z: -0.3, hue: 0.444, count: 300, speed: 0.06 },
  dome:          { z: -1.2, hue: 0.552, count: 400, speed: 0.08 },
  'passport-generator': { z: -0.2, hue: 0.710, count: 500, speed: 0.10 },
  'planetary-onboard':  { z: 0.0, hue: 0.971, count: 800, speed: 0.15 },
  connect:       { z: -0.6, hue: 0.718, count: 700, speed: 0.13 },
  delta:         { z: -0.4, hue: 0.444, count: 550, speed: 0.11 },
  fleet:         { z: -0.2, hue: 0.552, count: 620, speed: 0.12 },
  glass:         { z: 0.1, hue: 0.000, count: 200, speed: 0.05 },
  grants:        { z: -0.2, hue: 0.333, count: 480, speed: 0.10 },
  k4market:      { z: -0.5, hue: 0.552, count: 620, speed: 0.12 },
  mesh:          { z: -0.6, hue: 0.718, count: 700, speed: 0.13 },
  oqe:           { z: -0.8, hue: 0.250, count: 500, speed: 0.10 },
  qfactor:       { z: -0.3, hue: 0.444, count: 420, speed: 0.09 },
  supercentaur:  { z: -0.4, hue: 0.105, count: 350, speed: 0.08 },
  tomography:    { z: -0.6, hue: 0.620, count: 600, speed: 0.12 },
  'mesh-start':  { z: -0.5, hue: 0.718, count: 650, speed: 0.14 },
  orbit:         { z: -0.3, hue: 0.552, count: 580, speed: 0.11 },
  sovereign:     { z: 0.0, hue: 0.718, count: 500, speed: 0.10 },
};

// Shaders
const VS = `
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

// State
let state = null;

function getOrInit(canvas) {
  if (state && state.canvas === canvas) return state;

  const ctxAttribs = {
    powerPreference: 'high-performance',
    failIfMajorPerformanceCaveat: false,
    preserveDrawingBuffer: false,
  };

  const gl = canvas.getContext('webgl2', ctxAttribs) || canvas.getContext('webgl', ctxAttribs);
  if (!gl) {
    console.warn('starfield: no WebGL context');
    return null;
  }

  resizeCanvas(canvas);

  const program = compileProgram(gl, VS, FS);
  if (!program) {
    console.warn('starfield: shader compilation failed');
    return null;
  }

  // Create particle positions
  const positions = new Float32Array(MAX_PARTICLES * 3);
  for (let i = 0; i < MAX_PARTICLES; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 2;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
  }

  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  let vao = null;
  if ('createVertexArray' in gl) {
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const aPos = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
  }

  const uTime = gl.getUniformLocation(program, 'uTime');
  const uCamZ = gl.getUniformLocation(program, 'uCamZ');
  const uAspect = gl.getUniformLocation(program, 'uAspect');
  const uHue = gl.getUniformLocation(program, 'uHue');
  const uSpeed = gl.getUniformLocation(program, 'uSpeed');

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const homeConfig = DEFAULT_CAM;
  const next = {
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
    ctxHealthy: true,
  };

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    next.ctxHealthy = false;
    cancelAnimationFrame(next.rafId);
  }, { once: false });

  canvas.addEventListener('webglcontextrestored', () => {
    next.ctxHealthy = true;
    loop();
  }, { once: false });

  state = next;
  loop();
  return next;
}

function compileProgram(gl, vsSrc, fsSrc) {
  const vs = gl.createShader(gl.VERTEX_SHADER);
  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  if (!vs || !fs) return null;

  gl.shaderSource(vs, vsSrc);
  gl.compileShader(vs);
  if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
    console.warn('starfield vs error:', gl.getShaderInfoLog(vs));
    return null;
  }

  gl.shaderSource(fs, fsSrc);
  gl.compileShader(fs);
  if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
    console.warn('starfield fs error:', gl.getShaderInfoLog(fs));
    return null;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('starfield link error:', gl.getProgramInfoLog(prog));
    return null;
  }
  return prog;
}

function resizeCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.floor(canvas.clientWidth * dpr);
  const h = Math.floor(canvas.clientHeight * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w || canvas.clientWidth || 800;
    canvas.height = h || canvas.clientHeight || 600;
  }
}

function loop() {
  if (!state || state.stopped || !state.ctxHealthy) return;

  const { canvas, gl, program, vao, uTime, uCamZ, uAspect, uHue, uSpeed } = state;
  if (!canvas || !gl || !program) return;
  if (gl.isContextLost && gl.isContextLost()) {
    state.ctxHealthy = false;
    return;
  }

  resizeCanvas(canvas);
  gl.viewport(0, 0, canvas.width, canvas.height);

  const now = performance.now();
  const dt = Math.min(now - state.lastFrameAt, 100);
  state.lastFrameAt = now;
  state.frameAccum.push(dt);
  if (state.frameAccum.length > 60) state.frameAccum.shift();

  // Lerp targets
  const k = 1 - Math.pow(0.5, dt / 600);
  state.camCurrent += (state.camTarget - state.camCurrent) * k;
  state.hueCurrent += (state.hueTarget - state.hueCurrent) * k;
  state.countCurrent += (state.countTarget - state.countCurrent) * k;
  state.speedCurrent += (state.speedTarget - state.speedCurrent) * k;

  gl.clearColor(0.020, 0.020, 0.020, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);

  if (vao && 'bindVertexArray' in gl) {
    gl.bindVertexArray(vao);
  } else {
    gl.bindBuffer(gl.ARRAY_BUFFER, state.vbo);
    const aPos = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
  }

  if (uTime) gl.uniform1f(uTime, (now - state.startedAt) / 1000);
  if (uCamZ) gl.uniform1f(uCamZ, state.camCurrent);
  if (uAspect) gl.uniform1f(uAspect, canvas.width / canvas.height);
  if (uHue) gl.uniform1f(uHue, state.hueCurrent);
  if (uSpeed) gl.uniform1f(uSpeed, state.speedCurrent);

  gl.drawArrays(gl.POINTS, 0, Math.round(state.countCurrent));

  state.rafId = requestAnimationFrame(loop);
}

// Public API
export function startStarfield(canvas) {
  if (!canvas.dataset.p31AppshellId) {
    canvas.dataset.p31AppshellId = CANVAS_ID;
  }
  const s = getOrInit(canvas);
  if (!s) {
    // WebGL failed - show fallback gradient
    canvas.style.background = 'radial-gradient(ellipse at center, #1a1a2e 0%, #0f1115 100%)';
  }
}

export function setStarfieldRoute(route) {
  if (!state) return;
  state.route = route;
  const cfg = ROUTE_CAM[route] || DEFAULT_CAM;
  state.camTarget = cfg.z;
  state.hueTarget = cfg.hue;
  state.countTarget = cfg.count;
  state.speedTarget = cfg.speed;
}

export function suspendStarfield() {
  if (!state || state.stopped) return;
  state.stopped = true;
  cancelAnimationFrame(state.rafId);
}

export function resumeStarfield() {
  if (!state || !state.stopped) return;
  state.stopped = false;
  loop();
}

export function disposeStarfield() {
  if (!state) return;
  state.stopped = true;
  cancelAnimationFrame(state.rafId);
  const { gl, program, vbo, vao } = state;
  if (gl) {
    if (program) gl.deleteProgram(program);
    if (vbo) gl.deleteBuffer(vbo);
    if (vao && 'deleteVertexArray' in gl) gl.deleteVertexArray(vao);
  }
  state = null;
}
