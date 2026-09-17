import * as THREE from 'three'
import { jitterbugVertices, K4_VERTICES, K4_EDGES } from './jitterbug'
import type { MeshState } from '../types'

export interface K4EyeOptions {
  reducedMotion?: boolean
}

export interface K4EyeHandle {
  update(mesh: MeshState): void
  setPhase(phase: number): void
  dispose(): void
}

const JB_SCALE = 1.4
const PARTICLE_COUNT = 140

const CUBOCTAHEDRON_EDGES: [number, number][] = [
  [0, 4], [0, 5], [0, 8], [0, 9],
  [1, 4], [1, 5], [1, 10], [1, 11],
  [2, 6], [2, 7], [2, 8], [2, 9],
  [3, 6], [3, 7], [3, 10], [3, 11],
  [4, 8], [4, 10], [5, 9], [5, 11],
  [6, 8], [6, 10], [7, 9], [7, 11],
]

const OCTAHEDRON_EDGES: [number, number][] = [
  [0, 2], [0, 3], [0, 4], [0, 5],
  [1, 2], [1, 3], [1, 4], [1, 5],
]

function jitterbugEdges(phase: number): [number, number][] {
  if (phase <= 0.33) return CUBOCTAHEDRON_EDGES
  if (phase <= 0.66) return CUBOCTAHEDRON_EDGES.slice(0, 12)
  return OCTAHEDRON_EDGES
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(v) ? v : 1))
}

/** OKLCH is the design-core token space; THREE.Color r177 cannot parse it. */
function oklchToHex(s: string): string | null {
  const match = /^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*[\d.]+%?)?\s*\)$/i.exec(s.trim())
  if (!match) return null
  const L = parseFloat(match[1]) / (match[1].endsWith('%') ? 100 : 1)
  const C = parseFloat(match[2])
  const H = (parseFloat(match[3]) * Math.PI) / 180
  const a = C * Math.cos(H)
  const b = C * Math.sin(H)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b
  const lc = l_ * l_ * l_
  const mc = m_ * m_ * m_
  const sc = s_ * s_ * s_
  const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055)
  const toHex = (c: number) => Math.round(Math.max(0, Math.min(1, c)) * 255).toString(16).padStart(2, '0')
  const r = toGamma(4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc)
  const g = toGamma(-1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc)
  const bl = toGamma(-0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc)
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`
}

function cssColor(container: HTMLElement, name: string, fallback: string): string {
  try {
    const v = getComputedStyle(container).getPropertyValue(name).trim()
    if (!v) return fallback
    if (v.toLowerCase().startsWith('oklch(')) return oklchToHex(v) ?? fallback
    return v
  } catch {
    return fallback
  }
}

function resolveColor(container: HTMLElement, name: string, fallback: string): THREE.Color {
  const s = cssColor(container, name, fallback)
  try {
    const c = new THREE.Color(s)
    if (Number.isNaN(c.r) || Number.isNaN(c.g) || Number.isNaN(c.b)) return new THREE.Color(fallback)
    return c
  } catch {
    return new THREE.Color(fallback)
  }
}

function makeSpriteTexture(): THREE.Texture | null {
  try {
    const c = document.createElement('canvas')
    c.width = 64
    c.height = 64
    const ctx = c.getContext('2d')
    if (!ctx) return null
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.35, 'rgba(255,255,255,0.55)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 64, 64)
    return new THREE.CanvasTexture(c)
  } catch {
    return null
  }
}

export function mountK4Eye(container: HTMLElement, opts?: K4EyeOptions): K4EyeHandle {
  const noop: K4EyeHandle = { update() {}, setPhase() {}, dispose() {} }
  if (typeof window === 'undefined' || !container) return noop

  let canvas: HTMLCanvasElement | null = null
  try {
    const reducedMotion = !!(
      opts?.reducedMotion ??
      (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    )

    const accent = resolveColor(container, '--p31-accent', '#4cc9b0')
    const violet = resolveColor(container, '--p31-accent-violet', '#8b7cf6')
    const gold = resolveColor(container, '--p31-accent-gold', '#f5be0b')
    const green = resolveColor(container, '--p31-accent-green', '#4ade80')
    const red = resolveColor(container, '--p31-accent-red', '#f87171')

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
    camera.position.set(0, 0, 6.5)

    canvas = document.createElement('canvas')
    canvas.style.pointerEvents = 'none'
    container.appendChild(canvas)
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setClearColor(0x000000, 0)

    const cw0 = Math.max(1, container.clientWidth || 1)
    const ch0 = Math.max(1, container.clientHeight || 1)
    renderer.setSize(cw0, ch0, false)
    camera.aspect = cw0 / ch0
    camera.updateProjectionMatrix()

    const coreGeo = new THREE.SphereGeometry(1, 12, 8)
    const haloGeo = new THREE.SphereGeometry(1, 16, 12)
    const edgeGeo = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true)

    // K4 tetrahedron — 4 glowing vertices, 6 weighted edges.
    const k4Group = new THREE.Group()
    scene.add(k4Group)

    const vertexGroups: THREE.Group[] = []
    const vertexMats: THREE.MeshBasicMaterial[] = []
    for (let i = 0; i < 4; i++) {
      const g = new THREE.Group()
      const coreMat = new THREE.MeshBasicMaterial({
        color: accent, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false,
      })
      const haloMat = new THREE.MeshBasicMaterial({
        color: accent, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false,
      })
      const core = new THREE.Mesh(coreGeo, coreMat)
      const halo = new THREE.Mesh(haloGeo, haloMat)
      halo.scale.setScalar(2.6)
      g.add(core)
      g.add(halo)
      g.position.set(K4_VERTICES[i].x, K4_VERTICES[i].y, K4_VERTICES[i].z)
      vertexMats.push(coreMat, haloMat)
      vertexGroups.push(g)
      k4Group.add(g)
    }

    const edgeMeshes: THREE.Mesh[] = []
    const edgeMats: THREE.MeshBasicMaterial[] = []
    for (let i = 0; i < 6; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: green, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false,
      })
      const mesh = new THREE.Mesh(edgeGeo, mat)
      edgeMeshes.push(mesh)
      edgeMats.push(mat)
      k4Group.add(mesh)
    }

    const up = new THREE.Vector3(0, 1, 0)
    const tmpA = new THREE.Vector3()
    const tmpB = new THREE.Vector3()
    function placeEdge(mesh: THREE.Mesh, ax: number, ay: number, az: number, bx: number, by: number, bz: number, radius: number, opacity: number) {
      tmpA.set(ax, ay, az)
      tmpB.set(bx, by, bz)
      const dir = tmpB.sub(tmpA)
      const len = dir.length()
      mesh.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2)
      if (len > 1e-6) mesh.quaternion.setFromUnitVectors(up, dir.normalize())
      mesh.scale.set(radius, len, radius)
      ;(mesh.material as THREE.MeshBasicMaterial).opacity = opacity
    }

    // Jitterbug shell — morphing cuboctahedron -> icosahedron -> octahedron.
    const jbGroup = new THREE.Group()
    scene.add(jbGroup)

    const JB_MAX_V = 12
    const JB_MAX_E = 24
    const jbPointsGeo = new THREE.BufferGeometry()
    jbPointsGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(JB_MAX_V * 3), 3))
    jbPointsGeo.setDrawRange(0, JB_MAX_V)
    const jbPointsMat = new THREE.PointsMaterial({
      color: violet, size: 0.1, sizeAttenuation: true, transparent: true, opacity: 0.75,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
    jbGroup.add(new THREE.Points(jbPointsGeo, jbPointsMat))

    const jbLinesGeo = new THREE.BufferGeometry()
    jbLinesGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(JB_MAX_E * 6), 3))
    jbLinesGeo.setDrawRange(0, JB_MAX_E * 2)
    const jbLinesMat = new THREE.LineBasicMaterial({
      color: violet, transparent: true, opacity: 0.24, blending: THREE.AdditiveBlending, depthWrite: false,
    })
    jbGroup.add(new THREE.LineSegments(jbLinesGeo, jbLinesMat))

    // Orbiting particle field (starfield philosophy, lifted into 3D).
    const spriteTex = makeSpriteTexture()
    const particleGeo = new THREE.BufferGeometry()
    const pPos = new Float32Array(PARTICLE_COUNT * 3)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const r = 2.0 + Math.random() * 1.8
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      pPos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pPos[i * 3 + 2] = r * Math.cos(phi)
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
    const particleMat = new THREE.PointsMaterial({
      color: gold, size: 0.07, sizeAttenuation: true, map: spriteTex ?? undefined,
      transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false,
    })
    const particleField = new THREE.Points(particleGeo, particleMat)
    scene.add(particleField)

    let phase = 0
    let targetPhase = 0
    let baseK4Scale = 1
    let raf = 0
    let running = true
    let last = performance.now()

    function applyMesh(mesh: MeshState) {
      const vl = mesh.verticesList && mesh.verticesList.length > 0 ? mesh.verticesList : null
      const el = mesh.edgesList && mesh.edgesList.length > 0 ? mesh.edgesList : null
      const rigidity = Number.isFinite(mesh.rigidity) ? clamp01(mesh.rigidity) : 0.5

      for (let i = 0; i < 4; i++) {
        const love = vl && i < vl.length ? clamp01(vl[i].love) : 1
        const s = 0.14 + love * 0.3
        const g = vertexGroups[i]
        g.scale.setScalar(s)
        const core = g.children[0] as THREE.Mesh
        const halo = g.children[1] as THREE.Mesh
        core.scale.setScalar(1)
        halo.scale.setScalar(2.6)
        vertexMats[i * 2].opacity = 0.65 + love * 0.35
        vertexMats[i * 2 + 1].opacity = 0.1 + love * 0.22
      }

      for (let i = 0; i < 6; i++) {
        const w = el && i < el.length ? clamp01(el[i].weight) : 1
        const e = K4_EDGES[i]
        const va = K4_VERTICES[e[0]]
        const vb = K4_VERTICES[e[1]]
        const opacity = (0.28 + w * 0.45) * (0.65 + rigidity * 0.35)
        edgeMats[i].color.copy(green).lerp(red, w)
        placeEdge(edgeMeshes[i], va.x, va.y, va.z, vb.x, vb.y, vb.z, 0.014 + w * 0.032, opacity)
      }

      baseK4Scale = 0.9 + (Number.isFinite(mesh.love) ? clamp01(mesh.love) : 0.5) * 0.2
      k4Group.scale.setScalar(baseK4Scale)
    }

    function updateJitterbug(p: number) {
      const verts = jitterbugVertices(p)

      const posAttr = jbPointsGeo.attributes.position as THREE.BufferAttribute
      const arr = posAttr.array as Float32Array
      for (let i = 0; i < verts.length; i++) {
        arr[i * 3] = verts[i].x * JB_SCALE
        arr[i * 3 + 1] = verts[i].y * JB_SCALE
        arr[i * 3 + 2] = verts[i].z * JB_SCALE
      }
      posAttr.needsUpdate = true
      jbPointsGeo.setDrawRange(0, verts.length)

      const edges = jitterbugEdges(p)
      const eAttr = jbLinesGeo.attributes.position as THREE.BufferAttribute
      const eArr = eAttr.array as Float32Array
      for (let i = 0; i < edges.length; i++) {
        const va = verts[edges[i][0]]
        const vb = verts[edges[i][1]]
        eArr[i * 6] = va.x * JB_SCALE
        eArr[i * 6 + 1] = va.y * JB_SCALE
        eArr[i * 6 + 2] = va.z * JB_SCALE
        eArr[i * 6 + 3] = vb.x * JB_SCALE
        eArr[i * 6 + 4] = vb.y * JB_SCALE
        eArr[i * 6 + 5] = vb.z * JB_SCALE
      }
      eAttr.needsUpdate = true
      jbLinesGeo.setDrawRange(0, edges.length * 2)
    }

    function renderOnce() {
      phase = targetPhase
      updateJitterbug(phase)
      renderer.render(scene, camera)
    }

    function tick(dt: number) {
      const diff = targetPhase - phase
      if (Math.abs(diff) > 0.001) {
        phase += Math.sign(diff) * Math.min(Math.abs(diff), 0.05 * dt)
      }
      updateJitterbug(phase)

      const t = performance.now()
      k4Group.rotation.y += 0.0032 * dt
      k4Group.rotation.x = Math.sin(t * 0.0004) * 0.08
      jbGroup.rotation.y -= 0.0016 * dt
      particleField.rotation.y += 0.0008 * dt
      const breath = 1 + Math.sin(t * 0.0012) * 0.025
      k4Group.scale.setScalar(baseK4Scale * breath)
    }

    function frame(now: number) {
      if (!running) return
      const dt = Math.min(3, (now - last) / 16.67)
      last = now
      tick(dt)
      renderer.render(scene, camera)
      if (!reducedMotion) raf = requestAnimationFrame(frame)
    }

    const ro = new ResizeObserver(() => {
      const cw = Math.max(1, container.clientWidth || 1)
      const ch = Math.max(1, container.clientHeight || 1)
      renderer.setSize(cw, ch, false)
      camera.aspect = cw / ch
      camera.updateProjectionMatrix()
      if (reducedMotion) renderOnce()
    })
    ro.observe(container)

    updateJitterbug(0)
    if (reducedMotion) {
      renderOnce()
    } else {
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }

    return {
      update(mesh: MeshState) {
        applyMesh(mesh)
        if (reducedMotion) renderOnce()
      },
      setPhase(p: number) {
        targetPhase = Math.max(0, Math.min(1, Number.isFinite(p) ? p : 0))
        if (reducedMotion) renderOnce()
      },
      dispose() {
        running = false
        if (raf) cancelAnimationFrame(raf)
        ro.disconnect()
        coreGeo.dispose()
        haloGeo.dispose()
        edgeGeo.dispose()
        jbPointsGeo.dispose()
        jbLinesGeo.dispose()
        particleGeo.dispose()
        vertexMats.forEach((m) => m.dispose())
        edgeMats.forEach((m) => m.dispose())
        jbPointsMat.dispose()
        jbLinesMat.dispose()
        particleMat.dispose()
        if (spriteTex) spriteTex.dispose()
        renderer.dispose()
        if (canvas && canvas.parentNode === container) container.removeChild(canvas)
      },
    }
  } catch {
    if (canvas && canvas.parentNode === container) container.removeChild(canvas)
    return noop
  }
}
