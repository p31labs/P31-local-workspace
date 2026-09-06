# @p31/design-core — Changelog

## 2.1.0 — 2026-07-19

### Added
- `./css/link-glow.css` — new named export for the canonical `link-glow` hover
  utility. Import directly: `@import '@p31/design-core/css/link-glow.css';`
  Also included in `all.css` (no breaking change).

### Changed
- `all.css` now includes `link-glow.css` in its barrel import list.

---

## 2.0.0

Initial stable release of the canonical P31 design token system
(CSS custom properties, glass, motion, typography, size-class, ambient,
container, starfield, crisis-overlay, device-class hooks).
