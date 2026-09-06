/**
 * @file CrisisOverlay.tsx — WILLOW crisis overlay (genesis).
 * Thin wrapper over design-core <p31-crisis-overlay>. No custom UI chrome;
 * at data-spoons=0 the surrounding .ui-chrome is hidden by globals.css.
 */

export function CrisisOverlay() {
  return (
    <p31-crisis-overlay
      message="You’re safe. Breathe with the circle. Take your time."
      button-label="I’m ready"
    />
  );
}
