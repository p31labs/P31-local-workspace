# Spaceship Earth End-User Manual

**Version:** 1.2.0 | **Last Updated:** 2026-08-11

## Welcome to Spaceship Earth

Spaceship Earth is a 3D cockpit application that renders a geodesic "docking
dome" of **320 interactive faces**. It is designed to help neurodivergent
individuals and families visualize care data, social connections, and
wellbeing metrics in a calm, sovereign, local-first environment. Everything
runs in your browser — no account, no cloud dependency for core features.

## Getting Started

1. **Visit** https://spaceship-earth.pages.dev
2. **Install as PWA:** use the browser's *Install* / *Add to Home Screen*
   option for offline support.
3. **Explore the dome:** drag to orbit, scroll to zoom, and click any of the
   320 triangular faces.

## The 3D Dome

The central geodesic dome has 480 glowing edges lit with NeoPixel-style
segments. Every one of its **320 triangular faces** is interactive:

- **Hover** a face to see it highlight.
- **Click** a face to select it — the DataCard shows its details, and the
  selection mirrors across views (3D dome and Dymaxion net).
- **Deselect** by clicking the close control on the DataCard.

## Dymaxion Net (Bucky Mode)

Press the **Bucky** button in the DataControls panel to unfold the dome onto a
flat map — a **Dymaxion (Buckminster Fuller) icosahedron net**.

- The dome's 320 faces are laid out inside 20 triangular cells forming the
  classic Wikipedia icosahedron net (a 3-row band).
- One circle per face, colored from the active dataset (or default cyan).
- **Click a circle** to select that face — the same port selection as the 3D
  dome.
- **Hover** a circle for a glow; selected faces are larger.
- Press **Escape** or the **close button** to return to the 3D dome.

## Datasets

Load your own data and map it onto the dome:

1. Open the **DatasetPanel** (DataControls panel) and choose *Load dataset*.
2. Supported formats: JSON, HAPI, SDG (see `docs/DOME_DATA_FORMAT.md`).
3. Face colors update to the dataset's values; the **Legend** explains the
   color ramp.
4. For time-series datasets, the **TimeControls** scrubber animates the
   timeline across the faces.
5. **Export/Share** bundles the current dataset for sharing.

The dome maps up to 320 nodes — one per face.

## HUD Panels

| Panel | Purpose |
|---|---|
| DUNA board (left rail) | Docking status, member count |
| System board (right rail) | Coherence, health, mesh status |
| LED controller (bottom) | NeoPixel animation mode, speed, color, brightness |
| SpoonPulse (bottom-left orb) | Cognitive-energy level (color-coded) |
| DataCard | Details for the selected face/port |

### Keyboard Shortcuts

- **K** — toggle the K₄ wireframe overlay
- **Escape** — close the Dymaxion net / overlays
- **Space** — reset camera position

## Accessibility

- **Reduced motion:** enabled automatically from OS settings or via the
  sovereign state (`data-spoons` ≤ 1 disables animation).
- **Spoon-aware:** the UI scales motion and chrome with your cognitive-energy
  level (0–5).
- **Focus + keyboard:** all interactive controls are keyboard-accessible;
  overlays trap focus and close on Escape.
- **Color contrast:** face/legend colors use perceptually uniform tokens.

## Privacy

- All data is stored locally (IndexedDB / localStorage).
- Telemetry is **opt-in only** and blocked entirely in Kids mode.
- No account or external identity required for core features.

## Troubleshooting

| Issue | Solution |
|---|---|
| Dome doesn't render | Enable WebGL in browser settings; update browser |
| Offline reload fails | Ensure the PWA was installed (service worker) |
| Dataset doesn't appear | Confirm ≤ 320 nodes; check the Legend for the ramp |
| Bucky overlay won't open | Toggle via DataControls; verify `buckyMode` state |

## Conclusion

Spaceship Earth turns your family's care and wellbeing data into a calm,
sovereign 3D space you can explore — in the dome, or unfolded as a flat
Dymaxion map. Take your time. It's your spaceship.
