// src/scripts/mesh-living-background.ts
import * as THREE3 from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

// src/lib/dome/icosphere-to-three.ts
import * as THREE from "three";

// src/lib/dome/icosphere-geometry.ts
var PHI = (1 + Math.sqrt(5)) / 2;
var RAW_ICOSA_VERTS = [
  [-1, PHI, 0],
  [1, PHI, 0],
  [-1, -PHI, 0],
  [1, -PHI, 0],
  [0, -1, PHI],
  [0, 1, PHI],
  [0, -1, -PHI],
  [0, 1, -PHI],
  [PHI, 0, -1],
  [PHI, 0, 1],
  [-PHI, 0, -1],
  [-PHI, 0, 1]
];
var ICOSA_FACES = [
  [0, 11, 5],
  [0, 5, 1],
  [0, 1, 7],
  [0, 7, 10],
  [0, 10, 11],
  [1, 5, 9],
  [5, 11, 4],
  [11, 10, 2],
  [10, 7, 6],
  [7, 1, 8],
  [3, 9, 4],
  [3, 4, 2],
  [3, 2, 6],
  [3, 6, 8],
  [3, 8, 9],
  [4, 9, 5],
  [2, 4, 11],
  [6, 2, 10],
  [8, 6, 7],
  [9, 8, 1]
];
function buildIcosaSphereDome(rad, subs) {
  let vertices = RAW_ICOSA_VERTS.map(([x, y, z]) => {
    const l = Math.hypot(x, y, z);
    return [x / l * rad, y / l * rad, z / l * rad];
  });
  let faces = ICOSA_FACES.map((f) => [...f]);
  for (let s = 0; s < subs; s++) {
    const cache = {};
    const getMid = (i, j) => {
      const k = `${Math.min(i, j)}_${Math.max(i, j)}`;
      if (cache[k] !== void 0) return cache[k];
      const a = vertices[i];
      const b = vertices[j];
      const nx = a[0] + b[0];
      const ny = a[1] + b[1];
      const nz = a[2] + b[2];
      const len = Math.hypot(nx, ny, nz) || 1;
      const idx = vertices.length;
      vertices.push([nx / len * rad, ny / len * rad, nz / len * rad]);
      cache[k] = idx;
      return idx;
    };
    const nf = [];
    for (const [a, b, c] of faces) {
      const ab = getMid(a, b);
      const bc = getMid(b, c);
      const ca = getMid(c, a);
      nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }
    faces = nf;
  }
  const es = /* @__PURE__ */ new Set();
  for (const [a, b, c] of faces) {
    es.add(`${Math.min(a, b)}_${Math.max(a, b)}`);
    es.add(`${Math.min(b, c)}_${Math.max(b, c)}`);
    es.add(`${Math.min(a, c)}_${Math.max(a, c)}`);
  }
  const edges = Array.from(es).map((e) => {
    const [x, y] = e.split("_").map(Number);
    return [x, y];
  });
  return { vertices, faces, edges };
}

// src/lib/dome/icosphere-to-three.ts
function buildGeoThree(rad, subs) {
  const built = buildIcosaSphereDome(rad, subs);
  const verts = built.vertices.map(
    ([x, y, z]) => new THREE.Vector3(x, y, z)
  );
  const faces = built.faces.map((f) => {
    const [a, b, c] = f;
    return {
      indices: f,
      centroid: new THREE.Vector3().add(verts[a]).add(verts[b]).add(verts[c]).divideScalar(3)
    };
  });
  return { verts, edges: built.edges, faces };
}

// src/lib/dome/cockpit-shared.ts
function readDomePerfLite() {
  if (typeof window === "undefined") return false;
  const q = new URLSearchParams(location.search);
  if (q.get("perf") === "lite") return true;
  try {
    return localStorage.getItem("p31:dome:perf") === "lite";
  } catch {
    return false;
  }
}

// src/lib/dome/three-dome-materials.ts
import * as THREE2 from "three";
function makeHubFaceMaterial(assignment, lite) {
  if (assignment) {
    const hot = assignment.glow >= 1;
    if (lite) {
      return new THREE2.MeshStandardMaterial({
        color: assignment.color,
        emissive: assignment.color.clone().multiplyScalar(hot ? 0.6 : 0.3),
        emissiveIntensity: hot ? 2.2 : 1,
        roughness: 0.22,
        metalness: 0.35,
        transparent: true,
        opacity: 0.88,
        side: THREE2.FrontSide,
        polygonOffset: true,
        polygonOffsetFactor: 1
      });
    }
    return new THREE2.MeshPhysicalMaterial({
      color: assignment.color,
      emissive: assignment.color.clone().multiplyScalar(hot ? 0.6 : 0.3),
      emissiveIntensity: hot ? 3 : 1.2,
      roughness: 0.08,
      metalness: 0.3,
      transmission: 0.6,
      thickness: 0.8,
      transparent: true,
      opacity: 0.85,
      side: THREE2.FrontSide,
      polygonOffset: true,
      polygonOffsetFactor: 1
    });
  }
  if (lite) {
    return new THREE2.MeshStandardMaterial({
      color: 328968,
      emissive: 0,
      roughness: 0.55,
      metalness: 0.12,
      transparent: true,
      opacity: 0.32,
      side: THREE2.FrontSide,
      polygonOffset: true,
      polygonOffsetFactor: 1
    });
  }
  return new THREE2.MeshPhysicalMaterial({
    color: 328968,
    emissive: 0,
    roughness: 0.1,
    metalness: 0.1,
    transmission: 0.7,
    thickness: 0.5,
    transparent: true,
    opacity: 0.3,
    side: THREE2.FrontSide,
    polygonOffset: true,
    polygonOffsetFactor: 1
  });
}
function makeHubInnerShellMaterial(lite) {
  if (lite) {
    return new THREE2.MeshStandardMaterial({
      color: 526352,
      roughness: 0.55,
      metalness: 0.08,
      transparent: true,
      opacity: 0.22,
      side: THREE2.DoubleSide
    });
  }
  return new THREE2.MeshPhysicalMaterial({
    color: 526352,
    roughness: 0.1,
    metalness: 0,
    transmission: 0.9,
    thickness: 0.3,
    transparent: true,
    opacity: 0.3,
    side: THREE2.DoubleSide
  });
}

// src/scripts/mesh-living-background.ts
var AXIS_COLORS = { a: 16750916, b: 4500223, c: 4521898, d: 16729190 };
var STATE_CSS = {
  active: "#3ba372",
  deployed: "#25897d",
  countdown: "#cda852",
  complete: "#25897d",
  missing: "#cc6247",
  ongoing: "#25897d",
  prototype: "#25897d"
};
var STATE_GLOW = {
  countdown: 2,
  critical: 2.5,
  complete: 0.4,
  active: 1,
  ongoing: 0.6,
  deployed: 0.7,
  prototype: 0.5,
  missing: 1.2
};
var VERTICES = {
  "med-calcitriol": ["Calcitriol", 4, 0, 0, 0, "ongoing", "vital", "12hr dose cycle"],
  "spoon-budget": ["Spoon Budget", 4, 0, 0, 0, "active", "vital", "12/20"],
  "exec-dys": ["Exec Dysfunction", 3, 0, 1, 0, "active", "vital"],
  "bonding-game": ["BONDING", 0, 3, 1, 0, "deployed", "ac", "WebRTC Mesh"],
  "p31-labs": ["P31 Labs", 1, 1, 2, 0, "active", "ac", "501(c)(3)"],
  spaceship: ["Spaceship Earth", 0, 1, 3, 0, "deployed", "ac", "Observatory Dome"],
  buffer: ["The Buffer", 2, 1, 1, 0, "active", "dc", "Voltage Filter"],
  "node-one": ["Node One", 1, 0, 3, 0, "prototype", "dc", "ESP32-S3"],
  centaur: ["The Centaur", 1, 1, 2, 0, "active", "ac"],
  "love-econ": ["L.O.V.E.", 1, 1, 2, 0, "deployed", "ac", "Ledger"],
  phosphorus31: ["phosphorus31.org", 0, 0, 3, 1, "deployed", "ac"],
  posner: ["Posner Molecule", 2, 0, 2, 0, "active", "dc", "Ca9(PO4)6"],
  larmor: ["863 Hz", 1, 0, 1, 2, "active", "dc", "Larmor canonical"],
  ivm: ["IVM Geometry", 0, 0, 4, 0, "active", "dc"],
  soulsafe: ["SOULSAFE", 0, 0, 2, 2, "active", "ac"],
  "opm-deadline": ["OPM Sep 26", 0, 0, 0, 4, "countdown", "vital"],
  "court-void": ["Void Ab Initio", 0, 0, 0, 4, "active", "ac"]
};
var EDGES = [
  ["exec-dys", "spoon-budget", "drains"],
  ["bonding-game", "love-econ", "earns"],
  ["p31-labs", "spaceship", "builds"],
  ["p31-labs", "buffer", "builds"],
  ["spaceship", "love-econ", "displays"],
  ["phosphorus31", "spaceship", "hosted"],
  ["posner", "larmor", "resonates"],
  ["posner", "ivm", "geometry"],
  ["court-void", "soulsafe", "protects"]
];
function getDominantAxis(a, b, c, d) {
  const v = { a, b, c, d };
  let m = -1;
  let ax = "a";
  for (const k of ["a", "b", "c", "d"]) {
    if (v[k] > m) {
      m = v[k];
      ax = k;
    }
  }
  return ax;
}
function getNodeColor(a, b, c, d) {
  const s = a + b + c + d || 1;
  const col = new THREE3.Color(0);
  const ac = {
    a: new THREE3.Color(AXIS_COLORS.a),
    b: new THREE3.Color(AXIS_COLORS.b),
    c: new THREE3.Color(AXIS_COLORS.c),
    d: new THREE3.Color(AXIS_COLORS.d)
  };
  for (const k of ["a", "b", "c", "d"]) {
    const w = { a, b, c, d }[k] / s;
    col.r += ac[k].r * w;
    col.g += ac[k].g * w;
    col.b += ac[k].b * w;
  }
  return col;
}
var TETRA = [
  new THREE3.Vector3(0, 1, 0),
  new THREE3.Vector3(0, -1 / 3, Math.sqrt(8 / 9)),
  new THREE3.Vector3(-Math.sqrt(2 / 3), -1 / 3, -Math.sqrt(2 / 9)),
  new THREE3.Vector3(Math.sqrt(2 / 3), -1 / 3, -Math.sqrt(2 / 9))
];
function nodeDir(a, b, c, d) {
  const s = a + b + c + d || 1;
  const dir = new THREE3.Vector3(0, 0, 0);
  dir.addScaledVector(TETRA[0], a / s);
  dir.addScaledVector(TETRA[1], b / s);
  dir.addScaledVector(TETRA[2], c / s);
  dir.addScaledVector(TETRA[3], d / s);
  return dir.normalize();
}
function $(id) {
  return document.getElementById(id);
}
function mountMeshLivingBackground(container, options = {}) {
  const domePerfLite = options.lite ?? readDomePerfLite();
  const interactive = options.interactive ?? false;
  const reduceMotion = !interactive && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    container.classList.add("p31-mesh-living-bg--reduced");
    return;
  }
  const scene = new THREE3.Scene();
  scene.background = new THREE3.Color(328968);
  const camera = new THREE3.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    200
  );
  camera.position.set(0, 1.5, 13);
  const renderer = new THREE3.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
    alpha: false
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(domePerfLite ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(328968, 1);
  renderer.toneMapping = THREE3.ACESFilmicToneMapping;
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  if (!interactive) {
    renderer.domElement.style.pointerEvents = "none";
  }
  container.appendChild(renderer.domElement);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  let bloomPass = null;
  if (!domePerfLite) {
    bloomPass = new UnrealBloomPass(
      new THREE3.Vector2(window.innerWidth, window.innerHeight),
      0.6,
      0.4,
      0.6
    );
    composer.addPass(bloomPass);
  }
  composer.addPass(new OutputPass());
  scene.add(new THREE3.AmbientLight(657930, 0.05));
  const domeLight = new THREE3.PointLight(1714746, 0.8, 12);
  domeLight.position.set(0, 0, 0);
  scene.add(domeLight);
  const RADIUS = 3.5;
  const geo = buildGeoThree(RADIUS, 2);
  const geoOuter = buildGeoThree(RADIUS * 1.08, 1);
  const geoInner = buildGeoThree(RADIUS * 0.92, 2);
  const faceMeshes = [];
  const oPos = [];
  for (let i = 0; i < geoOuter.edges.length; i++) {
    const [a, b] = geoOuter.edges[i];
    oPos.push(
      geoOuter.verts[a].x,
      geoOuter.verts[a].y,
      geoOuter.verts[a].z,
      geoOuter.verts[b].x,
      geoOuter.verts[b].y,
      geoOuter.verts[b].z
    );
  }
  const oGeo = new THREE3.BufferGeometry();
  oGeo.setAttribute("position", new THREE3.Float32BufferAttribute(oPos, 3));
  const oMat = new THREE3.LineBasicMaterial({
    color: 1716288,
    transparent: true,
    opacity: 0.3
  });
  const outerShell = new THREE3.LineSegments(oGeo, oMat);
  const iMatBase = makeHubInnerShellMaterial(domePerfLite);
  const innerShell = new THREE3.Group();
  for (let i = 0; i < geoInner.faces.length; i++) {
    const f = geoInner.faces[i];
    const [a, b, c] = f.indices;
    const va = geoInner.verts[a], vb = geoInner.verts[b], vc = geoInner.verts[c];
    const tGeo = new THREE3.BufferGeometry();
    tGeo.setAttribute(
      "position",
      new THREE3.Float32BufferAttribute(
        [va.x, va.y, va.z, vb.x, vb.y, vb.z, vc.x, vc.y, vc.z],
        3
      )
    );
    tGeo.computeVertexNormals();
    innerShell.add(new THREE3.Mesh(tGeo, iMatBase.clone()));
  }
  const sorted = Object.entries(VERTICES).map(([id, d]) => ({
    id,
    label: d[0],
    a: d[1],
    b: d[2],
    c: d[3],
    d: d[4],
    state: d[5],
    bus: d[6],
    notes: d[7],
    dir: nodeDir(d[1], d[2], d[3], d[4]),
    p: d[5] === "countdown" ? 0 : 1
  })).sort((x, y) => x.p - y.p);
  const used = /* @__PURE__ */ new Set();
  const assignments = [];
  for (const n of sorted) {
    let best = -1, bd = -2;
    for (let i = 0; i < geo.faces.length; i++) {
      if (used.has(i)) continue;
      const dot = geo.faces[i].centroid.clone().normalize().dot(n.dir);
      if (dot > bd) {
        bd = dot;
        best = i;
      }
    }
    if (best >= 0) {
      used.add(best);
      const a = {
        faceIdx: best,
        node: n,
        color: getNodeColor(n.a, n.b, n.c, n.d),
        glow: STATE_GLOW[n.state] || 0.5
      };
      assignments.push(a);
      geo.faces[best].assignment = a;
    }
  }
  const wPos = [], eProg = [];
  for (let i = 0; i < geo.edges.length; i++) {
    const [a, b] = geo.edges[i];
    wPos.push(
      geo.verts[a].x,
      geo.verts[a].y,
      geo.verts[a].z,
      geo.verts[b].x,
      geo.verts[b].y,
      geo.verts[b].z
    );
    eProg.push(i / geo.edges.length, i / geo.edges.length);
  }
  const wGeo = new THREE3.BufferGeometry();
  wGeo.setAttribute("position", new THREE3.Float32BufferAttribute(wPos, 3));
  wGeo.setAttribute("edgeProgress", new THREE3.Float32BufferAttribute(eProg, 1));
  const wMat = new THREE3.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `attribute float edgeProgress; varying float vP; void main(){vP=edgeProgress; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `
    uniform float uTime;
    varying float vP;
    void main(){
      float p=smoothstep(0.,0.05,fract(vP-uTime*0.12))*(1.-smoothstep(0.05,0.15,fract(vP-uTime*0.12)));
      float shimmer = 0.3 + 0.7 * sin(uTime * 3.0 + vP * 10.0) * 0.5;
      gl_FragColor=vec4(0.15,0.35,0.45,0.3 + p * 0.7) * shimmer;
    }
  `,
    transparent: true,
    depthWrite: false
  });
  scene.add(new THREE3.LineSegments(wGeo, wMat));
  const domeGroup = new THREE3.Group();
  for (let i = 0; i < geo.faces.length; i++) {
    const f = geo.faces[i], a = f.assignment, [ai, bi, ci] = f.indices;
    const va = geo.verts[ai].clone();
    const vb = geo.verts[bi].clone();
    const vc = geo.verts[ci].clone();
    const cent = new THREE3.Vector3().add(va).add(vb).add(vc).divideScalar(3);
    const gap = 0.08;
    va.lerp(cent, gap);
    vb.lerp(cent, gap);
    vc.lerp(cent, gap);
    const vd = cent.clone().multiplyScalar(0.85);
    const tGeo = new THREE3.BufferGeometry();
    const vertices = new Float32Array([
      va.x,
      va.y,
      va.z,
      vb.x,
      vb.y,
      vb.z,
      vc.x,
      vc.y,
      vc.z,
      va.x,
      va.y,
      va.z,
      vc.x,
      vc.y,
      vc.z,
      vd.x,
      vd.y,
      vd.z,
      vc.x,
      vc.y,
      vc.z,
      vb.x,
      vb.y,
      vb.z,
      vd.x,
      vd.y,
      vd.z,
      vb.x,
      vb.y,
      vb.z,
      va.x,
      va.y,
      va.z,
      vd.x,
      vd.y,
      vd.z
    ]);
    tGeo.setAttribute("position", new THREE3.BufferAttribute(vertices, 3));
    tGeo.computeVertexNormals();
    const mat = makeHubFaceMaterial(
      a ? { glow: a.glow, color: a.color } : null,
      domePerfLite
    );
    const mesh = new THREE3.Mesh(tGeo, mat);
    mesh.userData = {
      a,
      centroidDir: cent.clone().normalize(),
      randomPhase: Math.random() * Math.PI * 2
    };
    const edgeGeo = new THREE3.EdgesGeometry(tGeo);
    const edgeMat = new THREE3.LineBasicMaterial({
      color: a ? a.color : 2241348,
      transparent: true,
      opacity: a ? 0.4 : 0.15
    });
    const edges = new THREE3.LineSegments(edgeGeo, edgeMat);
    domeGroup.add(mesh);
    domeGroup.add(edges);
    faceMeshes.push(mesh);
  }
  domeGroup.add(outerShell);
  domeGroup.add(innerShell);
  scene.add(domeGroup);
  const baseGeo = new THREE3.BufferGeometry();
  const basePoints = [];
  for (let i = 0; i < geo.verts.length; i++) {
    if (geo.verts[i].y < 0.1) {
      basePoints.push(geo.verts[i].x, -0.3, geo.verts[i].z, 0, -0.3, 0);
    }
  }
  baseGeo.setAttribute("position", new THREE3.Float32BufferAttribute(basePoints, 3));
  const baseMat = new THREE3.LineBasicMaterial({
    color: 2250086,
    opacity: 0.7,
    transparent: true
  });
  const baseFrame = new THREE3.LineSegments(baseGeo, baseMat);
  scene.add(baseFrame);
  const pCount = domePerfLite ? 4e3 : 12e3;
  const pGeo = new THREE3.BufferGeometry();
  const pPos = new Float32Array(pCount * 3), pSiz = new Float32Array(pCount), pCol = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    const r = 4 + Math.random() * 30, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    pPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    pPos[i * 3 + 2] = r * Math.cos(ph);
    pSiz[i] = 0.01 + Math.random() * 0.04;
    const cBase = r > 15 ? 1381658 : 1712159;
    pCol[i * 3] = (cBase >> 16) / 255;
    pCol[i * 3 + 1] = (cBase >> 8 & 255) / 255;
    pCol[i * 3 + 2] = (cBase & 255) / 255;
  }
  pGeo.setAttribute("position", new THREE3.BufferAttribute(pPos, 3));
  pGeo.setAttribute("size", new THREE3.BufferAttribute(pSiz, 1));
  pGeo.setAttribute("color", new THREE3.BufferAttribute(pCol, 3));
  const pMat = new THREE3.PointsMaterial({
    color: 16777215,
    vertexColors: true,
    size: 0.03,
    transparent: true,
    opacity: 0.5,
    sizeAttenuation: true,
    depthWrite: false
  });
  const molField = new THREE3.Points(pGeo, pMat);
  scene.add(molField);
  const pointer = new THREE3.Vector2();
  const raycaster = new THREE3.Raycaster();
  let hoveredFace = null;
  const panel = interactive ? $("node-detail-panel") : null;
  if (interactive) {
    container.addEventListener("mousemove", (e) => {
      const rect = container.getBoundingClientRect();
      pointer.x = (e.clientX - rect.left) / rect.width * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(faceMeshes);
      hoveredFace = hits[0]?.object ?? null;
      if (e.target === renderer.domElement) {
        document.body.style.cursor = hits.length && hits[0].object.userData.a ? "pointer" : "grab";
      }
    });
    container.addEventListener("click", () => {
      if (!hoveredFace?.userData.a) return;
      const assignment = hoveredFace.userData.a;
      const n = assignment.node;
      const ndTitle = $("nd-title");
      const ndAxis = $("nd-axis");
      const ndState = $("nd-state");
      const ndBus = $("nd-bus");
      const ndNotes = $("nd-notes");
      const ndConns = $("nd-conns");
      if (ndTitle) ndTitle.innerText = n.label;
      if (ndAxis) ndAxis.innerText = getDominantAxis(n.a, n.b, n.c, n.d).toUpperCase();
      if (ndState) {
        ndState.innerText = n.state.toUpperCase();
        ndState.style.color = STATE_CSS[n.state] || "#888";
      }
      if (ndBus) ndBus.innerText = n.bus?.toUpperCase() || "MAIN";
      if (ndNotes) ndNotes.innerText = n.notes || "No description";
      const edgesF = EDGES.filter((ed) => ed[0] === n.id || ed[1] === n.id);
      if (ndConns) {
        ndConns.innerHTML = edgesF.length ? edgesF.map((ed) => {
          const otherId = ed[0] === n.id ? ed[1] : ed[0];
          const label = VERTICES[otherId]?.[0] || otherId;
          return `<span class="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px]">${label}</span>`;
        }).join("") : '<span class="text-xs text-white/40 italic">Isolated</span>';
      }
      if (panel) {
        panel.classList.remove("opacity-0", "translate-y-4", "pointer-events-none");
      }
    });
    $("node-detail-close")?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (panel) {
        panel.classList.add("opacity-0", "translate-y-4", "pointer-events-none");
      }
    });
  }
  let time = 0;
  let isVisible = true;
  let lastFrame = 0;
  const minFrameTime = domePerfLite ? 1e3 / 60 : 1e3 / 30;
  document.addEventListener("visibilitychange", () => {
    isVisible = !document.hidden;
  });
  function animate(timestamp) {
    requestAnimationFrame(animate);
    if (!isVisible) return;
    if (timestamp - lastFrame < minFrameTime) return;
    lastFrame = timestamp;
    const dt = 0.016;
    time += 2e-3;
    domeGroup.rotation.y += 8e-4;
    domeGroup.rotation.x = Math.sin(time) * 0.05;
    molField.rotation.y += 3e-4;
    molField.rotation.x += Math.sin(time * 0.3) * 1e-4;
    wMat.uniforms.uTime.value += dt;
    const breath = 1 + 5e-3 * Math.sin(time * 1.5);
    for (const m of faceMeshes) {
      if (!m.userData.insertProgress) m.userData.insertProgress = Math.random() * 0.3;
      if (!m.userData.insertTarget) m.userData.insertTarget = 1;
      m.userData.insertProgress += (m.userData.insertTarget - m.userData.insertProgress) * 0.08;
      const insertOffset = (1 - m.userData.insertProgress) * 1.5;
      const rp = m.userData.randomPhase ?? 0;
      const floatOffset = Math.sin(time * 2.5 + rp) * 0.04;
      m.position.copy(m.userData.centroidDir).multiplyScalar(floatOffset + insertOffset);
      m.scale.setScalar(breath);
      const faceMat = m.material;
      faceMat.opacity = 0.3 + m.userData.insertProgress * 0.6;
    }
    composer.render();
  }
  requestAnimationFrame(animate);
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    if (bloomPass) {
      bloomPass.resolution.set(window.innerWidth, window.innerHeight);
    }
  });
}

// src/scripts/mesh-about-bootstrap.ts
function run() {
  const el = document.getElementById("p31-mesh-living-bg");
  if (el) mountMeshLivingBackground(el, { interactive: false });
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", run);
} else {
  run();
}
