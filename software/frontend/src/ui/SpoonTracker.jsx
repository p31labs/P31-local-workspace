/**
 * SpoonTracker — HUD overlay for cognitive capacity and voltage telemetry.
 *
 * Spatial: flows inside the HUD grid "main" area (bottom-left).
 *          No fixed positioning — no z-index collisions.
 *
 * Progressive Disclosure (Spoon Economy):
 *   Nominal   (9-12): Phosphorus Green  — COMMAND
 *   Moderate  (6-8):  Teal              — BUILD
 *   Depleted  (3-5):  Gold/Amber        — FOCUS
 *   Critical  (<4):   Coral/Red + pulse — BREATHE  (Thermal Shutdown warning)
 *
 * Props:
 *   spoons       — current spoon count (from useSync)
 *   activity     — activity feed array (from useWebSocket)
 *   voltageMap   — ref.current object: nodeId -> { urgency, emotional, cognitive, composite, spoon_cost, level }
 */

import React, { useMemo } from 'react';
import { COLORS, SPOON_BASELINE } from '../constants';

// ── Progressive disclosure thresholds ──
const LAYER_LABELS = [
  { threshold: 0,  label: 'BREATHE', color: COLORS.coral },
  { threshold: 3,  label: 'FOCUS',   color: COLORS.gold },
  { threshold: 6,  label: 'BUILD',   color: COLORS.teal },
  { threshold: 9,  label: 'COMMAND', color: COLORS.phosphorus },
];

function getLayer(spoons) {
  for (let i = LAYER_LABELS.length - 1; i >= 0; i--) {
    if (spoons >= LAYER_LABELS[i].threshold) return LAYER_LABELS[i];
  }
  return LAYER_LABELS[0];
}

/**
 * Capacity bar color — stepped progressive disclosure:
 *   >= 9  → Phosphorus green (nominal)
 *   >= 6  → Teal (moderate)
 *   >= 4  → Gold/amber (depleted, warning)
 *   <  4  → Coral/red (critical — thermal shutdown imminent)
 */
function getBarColor(spoons) {
  if (spoons >= 9) return COLORS.phosphorus;
  if (spoons >= 6) return COLORS.teal;
  if (spoons >= 4) return COLORS.gold;
  return COLORS.coral;
}

const BAR_COLORS = {
  urgency:   COLORS.coral,
  emotional: COLORS.gold,
  cognitive: COLORS.purple,
};

export default function SpoonTracker({ spoons, activity, voltageMap }) {
  const layer = getLayer(spoons);
  const pct = Math.max(0, Math.min(100, (spoons / SPOON_BASELINE) * 100));
  const barColor = getBarColor(spoons);
  const isCritical = spoons < 4;

  // Most recently ingested node with voltage data
  const lastVoltage = useMemo(() => {
    if (!activity || !voltageMap) return null;
    for (const entry of activity) {
      const v = voltageMap[entry.id];
      if (v) return { ...v, content: entry.content, axis: entry.axis };
    }
    return null;
  }, [activity, voltageMap]);

  return (
    <div style={styles.container}>
      {/* ── Spoon Counter ── */}
      <div style={{
        ...styles.section,
        borderColor: isCritical ? 'rgba(255, 107, 107, 0.3)' : 'rgba(45, 255, 160, 0.12)',
        boxShadow: isCritical
          ? '0 0 12px rgba(255, 107, 107, 0.15), inset 0 0 20px rgba(255, 107, 107, 0.05)'
          : 'none',
      }}>
        <div style={styles.sectionTitle}>
          {isCritical ? 'THERMAL WARNING' : 'COGNITIVE CAPACITY'}
        </div>
        <div style={styles.spoonRow}>
          <span style={{
            ...styles.spoonNumber,
            color: barColor,
            animation: isCritical ? 'spoonTrackerPulse 1.5s ease-in-out infinite' : 'none',
          }}>
            {spoons.toFixed(1)}
          </span>
          <span style={styles.spoonSlash}>/</span>
          <span style={styles.spoonBaseline}>{SPOON_BASELINE}</span>
        </div>

        {/* Capacity bar — color shifts with spoon economy state */}
        <div style={styles.barOuter}>
          <div style={{
            ...styles.barInner,
            width: `${pct}%`,
            background: isCritical
              ? `linear-gradient(90deg, ${COLORS.coral}, ${COLORS.gold})`
              : barColor,
            boxShadow: isCritical ? `0 0 6px ${COLORS.coral}` : 'none',
          }} />
        </div>

        <div style={{
          ...styles.layerBadge,
          color: layer.color,
          borderColor: layer.color + '40',
          background: isCritical ? 'rgba(255, 107, 107, 0.08)' : 'transparent',
        }}>
          {layer.label}
        </div>
      </div>

      {/* ── Voltage Inspector ── */}
      {lastVoltage && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>VOLTAGE INSPECTOR</div>
          <div style={styles.voltageLabel}>
            {(lastVoltage.content || '').slice(0, 40)}
          </div>
          {['urgency', 'emotional', 'cognitive'].map((key) => (
            <div key={key} style={styles.voltageRow}>
              <span style={styles.voltageKey}>{key}</span>
              <div style={styles.voltageBarOuter}>
                <div
                  style={{
                    ...styles.voltageBarInner,
                    width: `${(lastVoltage[key] || 0) * 10}%`,
                    background: BAR_COLORS[key],
                  }}
                />
              </div>
              <span style={styles.voltageVal}>{(lastVoltage[key] || 0).toFixed(1)}</span>
            </div>
          ))}
          <div style={styles.compositeRow}>
            <span style={styles.voltageKey}>composite</span>
            <span style={{ ...styles.voltageVal, color: COLORS.phosphorus }}>
              {(lastVoltage.composite || 0).toFixed(1)}
            </span>
            {lastVoltage.spoon_cost != null && (
              <span style={styles.costBadge}>
                -{lastVoltage.spoon_cost}sp
              </span>
            )}
          </div>
        </div>
      )}

      {/* Keyframe injection for critical pulse animation */}
      <style>{`
        @keyframes spoonTrackerPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

// ── Inline styles (Phosphorus aesthetic — Spaceship Earth design language) ──

const styles = {
  container: {
    width: 240,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: 11,
    color: COLORS.text,
    pointerEvents: 'none',
    marginBottom: 4,
  },
  section: {
    background: 'rgba(10, 15, 26, 0.85)',
    border: '1px solid rgba(45, 255, 160, 0.12)',
    borderRadius: 6,
    padding: '10px 12px',
    marginBottom: 8,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
  },
  sectionTitle: {
    fontSize: 9,
    letterSpacing: 2,
    color: COLORS.phosphorus,
    opacity: 0.6,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  spoonRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 2,
    marginBottom: 6,
  },
  spoonNumber: {
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1,
    transition: 'color 0.4s ease',
  },
  spoonSlash: {
    fontSize: 16,
    opacity: 0.3,
  },
  spoonBaseline: {
    fontSize: 14,
    opacity: 0.4,
  },
  barOuter: {
    height: 4,
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  barInner: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.4s ease, background 0.4s ease, box-shadow 0.4s ease',
  },
  layerBadge: {
    display: 'inline-block',
    fontSize: 9,
    letterSpacing: 2,
    border: '1px solid',
    borderRadius: 3,
    padding: '2px 6px',
    transition: 'color 0.4s ease, border-color 0.4s ease, background 0.4s ease',
  },
  voltageLabel: {
    fontSize: 10,
    color: COLORS.text,
    opacity: 0.5,
    marginBottom: 6,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  voltageRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  voltageKey: {
    width: 62,
    textTransform: 'uppercase',
    fontSize: 9,
    letterSpacing: 1,
    opacity: 0.6,
  },
  voltageBarOuter: {
    flex: 1,
    height: 3,
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  voltageBarInner: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.3s ease',
  },
  voltageVal: {
    width: 28,
    textAlign: 'right',
    fontSize: 10,
  },
  compositeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingTop: 6,
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  costBadge: {
    fontSize: 9,
    color: COLORS.coral,
    opacity: 0.8,
    marginLeft: 'auto',
  },
};
