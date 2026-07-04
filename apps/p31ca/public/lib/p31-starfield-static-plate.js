/**
 * Static star plate — fixed luminance dots (breaker panel / precision surfaces).
 * Same night sky as animated starfield; no drift. Pair with docs/P31-UNIVERSAL-UI-VISION.md §5.
 */
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function readCssVar(name, fallback) {
  if (typeof document === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

const PRESET_PREFIX = {
  soup: "soup",
  hub: "hub",
  commandCenter: "command-center",
  operatorDesk: "operator-desk",
};

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ preset?: string; seed?: number; dotCount?: number; alpha?: number }} [opts]
 */
export function initStaticStarPlate(canvas, opts = {}) {
  const preset = opts.preset || "commandCenter";
  const slug = PRESET_PREFIX[preset] || preset.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  const cssDotCount = readCssVar(`--p31-sf-preset-${slug}-dot-count`, NaN);
  const cssAlpha = readCssVar(`--p31-sf-preset-${slug}-base-alpha-cap`, NaN);

  let dotCount =
    opts.dotCount != null ? opts.dotCount : Number.isFinite(cssDotCount) ? cssDotCount : preset === "operatorDesk" ? 120 : 140;
  let alpha =
    opts.alpha != null ? opts.alpha : Number.isFinite(cssAlpha) ? cssAlpha : preset === "operatorDesk" ? 0.09 : 0.11;

  const reduced =
    typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || (typeof localStorage !== "undefined" && localStorage.getItem("p31.starfield.off") === "1")) {
    canvas.style.opacity = "0";
    return { destroy() {} };
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return { destroy() {} };

  const seed = opts.seed ?? 0x5031;
  let dots = [];
  let w = 1;
  let h = 1;

  function layout() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    w = Math.max(1, Math.floor(rect.width * dpr));
    h = Math.max(1, Math.floor(rect.height * dpr));
    canvas.width = w;
    canvas.height = h;
    const rng = mulberry32(seed);
    dots = [];
    for (let i = 0; i < dotCount; i++) {
      dots.push({
        x: rng() * w,
        y: rng() * h,
        r: (rng() * 0.65 + 0.25) * dpr,
      });
    }
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = `rgba(180, 210, 205, ${alpha})`;
    for (const d of dots) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const ro = new ResizeObserver(() => layout());
  ro.observe(canvas);
  layout();

  return {
    destroy() {
      try {
        ro.disconnect();
      } catch {
        /* ignore */
      }
    },
  };
}
