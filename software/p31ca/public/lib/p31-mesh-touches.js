/**
 * P31 mesh touches — pure logic + persistence helpers (browser).
 * Paired with p31-starfield.js; behavioral map: docs/P31-STARFIELD-MESH-TOUCHES.md
 */

export const P31_MESH_TOUCHES_VERSION = "1.0.0";

export const MESH_TOUCH_CHANNEL = "p31-mesh-touch-v1";

/** @typedef {'hub'|'soup'|'poets'|'passport'|'command-center'|'physics-learn'|'bonding'|'dome'} P31Surface */

export const STORAGE = {
  constellation: "p31_sf_constellation_v2",
  activity: "p31_sf_activity_v1",
  lastMedTs: "p31_sf_last_med_ts",
  lastCommitPulse: "p31_sf_last_commit_pulse",
  spoonSunrise: "p31_sf_spoon_sunrise_ts",
};

const MS_DAY = 864e5;
const MS_HOUR = 3600e3;

/** Julian day number helper */
function toUtcDate(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Moon illumination 0–1 for opacity multiplier (~0.94–1.06).
 * @param {Date} [d]
 */
export function moonOpacityMultiplier(d = new Date()) {
  const synodic = 29.53058867;
  const knownNew = Date.UTC(2000, 0, 6, 18, 14, 0);
  const phase = ((toUtcDate(d).getTime() - knownNew) / MS_DAY) % synodic;
  const illum = 0.5 * (1 - Math.cos((2 * Math.PI * phase) / synodic));
  return 0.94 + illum * 0.12;
}

/**
 * FERS bias toward upward drift as deadline approaches (Sept 30 ET).
 * @param {Date} now
 * @param {boolean} filed
 * @returns {{ fx: number; fy: number }}
 */
export function fersDriftBias(now = new Date(), filed = false) {
  if (filed) return { fx: 0, fy: 0.012 };
  const y = now.getUTCFullYear();
  const deadline = Date.UTC(y, 8, 30, 23, 59, 59);
  const t = now.getTime();
  const days = Math.max(0, (deadline - t) / MS_DAY);
  if (days > 155) return { fx: 0, fy: 0 };
  if (days > 90) return { fx: 0, fy: -0.002 * (1 - days / 155) };
  if (days > 60) return { fx: 0, fy: -0.006 - 0.004 * (1 - days / 90) };
  if (days > 30) return { fx: 0, fy: -0.012 - 0.008 * (1 - days / 60) };
  return { fx: (Math.random() - 0.5) * 0.002, fy: -0.028 - 0.015 * (1 - Math.max(0, days) / 30) };
}

/**
 * @param {Date} [d]
 * @returns {null|'bash'|'willow'}
 */
export function birthdayTouchMode(d = new Date()) {
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  if (m === 3 && day === 10) return "bash";
  if (m === 8 && day === 8) return "willow";
  return null;
}

/**
 * Rough calcium absorption window: active ~1–5h after logged dose (Calcitriol stack).
 * Operator can extend via API `calcium_window_active`.
 * @param {number} nowMs
 * @param {number|null} lastDoseMs
 */
export function calciumWindowActive(nowMs, lastDoseMs) {
  if (lastDoseMs == null || !Number.isFinite(lastDoseMs)) return false;
  const dt = nowMs - lastDoseMs;
  return dt >= MS_HOUR && dt <= 5 * MS_HOUR;
}

/**
 * Hearth gold mix 0=coral only, 1=max green-gold when calcium window active.
 */
export function calciumHearthGoldMix(active, vyvanseSafe = true) {
  if (!active) return 0;
  return vyvanseSafe ? 0.78 : 0.35;
}

/**
 * Breath rate factor from resting HR (maps to starfield breathRate scale).
 * @param {number|null} hr
 */
export function breathRateFromHeartRate(hr) {
  if (hr == null || !Number.isFinite(hr) || hr < 40 || hr > 120) return null;
  const cycleSec = Math.max(4.5, Math.min(9.5, hr / 12));
  return (Math.PI * 2) / (cycleSec * 1000);
}

/** Physics Learn room index 0..n-1 → base Hz for scroll drone */
export function physicsLearnRoomHz(roomIndex, totalRooms = 8) {
  const i = Math.max(0, Math.min(totalRooms - 1, roomIndex));
  const base = 110 + (i / Math.max(1, totalRooms - 1)) * 620;
  return Math.round(base * 100) / 100;
}

/** Target Hz when reaching last room (Larmor anchor) */
export const PHYSICS_LEARN_TARGET_HZ = 863;

/**
 * Bonding molecule preset → particle anchor angles (relative center).
 * @param {string} key
 * @returns {{ angles: number[]; r: number } | null}
 */
export function bondingMoleculeGeometry(key) {
  const k = String(key || "").toLowerCase();
  if (k === "h2o" || k === "water") {
    const bend = (104.5 * Math.PI) / 180;
    return { angles: [0, bend * 0.92, -bend * 0.92], r: 52 };
  }
  if (k === "cao" || k === "ca-o") return { angles: [0, Math.PI], r: 36 };
  if (k === "glucose" || k === "c6h12o6") {
    const a = [];
    for (let i = 0; i < 6; i++) a.push((i * Math.PI * 2) / 6);
    return { angles: a, r: 52 };
  }
  if (k === "h2" || k === "hydrogen") return { angles: [0, Math.PI], r: 28 };
  /** Li–O–V letterplay product (game easter egg) — triangular motif, not stoichiometry */
  if (k === "lov") {
    const t = (2 * Math.PI) / 3;
    return { angles: [0, t, 2 * t], r: 44 };
  }
  return null;
}

/**
 * Map C.A.R.S. synthesis product element → starfield bonding overlay key (or null).
 * @param {unknown} el
 * @returns {string|null}
 */
export function starfieldBondingKeyFromProductElement(el) {
  const u = String(el ?? "")
    .trim()
    .toUpperCase();
  if (!u) return null;
  if (u === "H2O" || u === "WATER") return "h2o";
  if (u === "CAO") return "cao";
  if (u === "LOV") return "lov";
  if (u === "H2" || u === "H₂") return "h2";
  if (u.includes("C6H12O6") || u === "GLUCOSE") return "glucose";
  return null;
}

/**
 * @typedef {{ lastPing: number; lastBonding: number; lastCheckin: number; lastMed: number; lastAgent: number; lastGeneric: number }} MeshActivity
 */

/** @returns {MeshActivity} */
export function loadMeshActivity() {
  try {
    const raw = localStorage.getItem(STORAGE.activity);
    if (!raw) throw 0;
    const j = JSON.parse(raw);
    return {
      lastPing: Number(j.lastPing) || 0,
      lastBonding: Number(j.lastBonding) || 0,
      lastCheckin: Number(j.lastCheckin) || 0,
      lastMed: Number(j.lastMed) || 0,
      lastAgent: Number(j.lastAgent) || 0,
      lastGeneric: Number(j.lastGeneric) || 0,
    };
  } catch {
    return {
      lastPing: 0,
      lastBonding: 0,
      lastCheckin: 0,
      lastMed: 0,
      lastAgent: 0,
      lastGeneric: 0,
    };
  }
}

export function saveMeshActivity(a) {
  try {
    localStorage.setItem(STORAGE.activity, JSON.stringify(a));
  } catch {
    /* quota */
  }
}

export function recordMeshActivity(kind, ts = Date.now()) {
  const a = loadMeshActivity();
  if (kind === "ping") a.lastPing = ts;
  else if (kind === "bonding") a.lastBonding = ts;
  else if (kind === "checkin") a.lastCheckin = ts;
  else if (kind === "med") a.lastMed = ts;
  else if (kind === "agent") a.lastAgent = ts;
  else a.lastGeneric = ts;
  saveMeshActivity(a);
}

/** Most recent meaningful mesh signal */
export function lastMeshSignalMs(a = loadMeshActivity()) {
  return Math.max(a.lastPing, a.lastBonding, a.lastCheckin, a.lastMed, a.lastAgent, a.lastGeneric);
}

/**
 * Empty-room condition: no signal for 48h (overridable by API all_edges_cold).
 * @param {number} nowMs
 * @param {MeshActivity} [a]
 */
export function meshEdgesCold48h(nowMs, a = loadMeshActivity()) {
  const last = lastMeshSignalMs(a);
  if (last === 0) return false;
  return nowMs - last >= 48 * MS_HOUR;
}

export function loadConstellation() {
  try {
    const raw = localStorage.getItem(STORAGE.constellation);
    if (!raw) return [];
    const j = JSON.parse(raw);
    return Array.isArray(j) ? j.slice(0, 120) : [];
  } catch {
    return [];
  }
}

export function pushConstellationPoint(x, y) {
  const arr = loadConstellation();
  arr.push({ x, y, a: 0.09 });
  localStorage.setItem(STORAGE.constellation, JSON.stringify(arr.slice(-120)));
}

/**
 * Merge optional API fields into touch envelope.
 * @param {object} st state object from /api/state JSON
 */
function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0.5;
  return Math.max(0, Math.min(1, x));
}

export function mergeApiTouchHints(st) {
  if (!st || typeof st !== "object") return {};
  const o = {};
  if (st.calcium_window_active != null) o.calciumWindowActive = !!st.calcium_window_active;
  if (st.sentinel_scene != null) o.sentinelScene = String(st.sentinel_scene);
  if (st.resting_hr_bpm != null) o.restingHr = Number(st.resting_hr_bpm);
  if (st.fers_filed != null) o.fersFiled = !!st.fers_filed;
  if (st.mesh_all_edges_cold_48h != null) o.meshAllEdgesCold48h = !!st.mesh_all_edges_cold_48h;
  if (st.vyvanse_safe != null) o.vyvanseSafe = !!st.vyvanse_safe;
  if (st.bereavement_active != null) o.bereavementActive = !!st.bereavement_active;
  if (Array.isArray(st.remembrance_fixed_stars) && st.remembrance_fixed_stars.length > 0) {
    o.remembranceFixedStars = st.remembrance_fixed_stars
      .filter((p) => p && typeof p === "object")
      .slice(0, 64)
      .map((p) => ({
        x: clamp01(p.x),
        y: clamp01(p.y),
        a: Math.max(0.04, Math.min(0.2, Number(p.a) || 0.11)),
      }));
  }
  return o;
}

/**
 * Install BroadcastChannel listener for cross-tab touches.
 * @param {(msg: { type: string; payload?: object }) => void} handler
 * @returns {() => void}
 */
export function installMeshTouchChannel(handler) {
  if (typeof BroadcastChannel === "undefined") return () => {};
  const ch = new BroadcastChannel(MESH_TOUCH_CHANNEL);
  const fn = (ev) => {
    try {
      if (ev?.data && typeof ev.data === "object") handler(ev.data);
    } catch {
      /* ignore */
    }
  };
  ch.addEventListener("message", fn);
  return () => {
    try {
      ch.removeEventListener("message", fn);
      ch.close();
    } catch {
      /* ignore */
    }
  };
}

export function broadcastMeshTouch(msg) {
  try {
    const ch = new BroadcastChannel(MESH_TOUCH_CHANNEL);
    ch.postMessage(msg);
    ch.close();
  } catch {
    /* ignore */
  }
}

/** Poets quote category → RGB */
export function poetsParticleColor(category) {
  const c = String(category || "fuller").toLowerCase();
  if (c === "operator" || c === "self") return [205, 168, 82];
  if (c === "children" || c === "kids") return [77, 184, 168];
  return [59, 163, 114];
}

export default {
  P31_MESH_TOUCHES_VERSION,
  MESH_TOUCH_CHANNEL,
  STORAGE,
  moonOpacityMultiplier,
  fersDriftBias,
  birthdayTouchMode,
  calciumWindowActive,
  calciumHearthGoldMix,
  breathRateFromHeartRate,
  physicsLearnRoomHz,
  PHYSICS_LEARN_TARGET_HZ,
  bondingMoleculeGeometry,
  loadMeshActivity,
  saveMeshActivity,
  recordMeshActivity,
  meshEdgesCold48h,
  loadConstellation,
  pushConstellationPoint,
  mergeApiTouchHints,
  installMeshTouchChannel,
  broadcastMeshTouch,
  poetsParticleColor,
};
