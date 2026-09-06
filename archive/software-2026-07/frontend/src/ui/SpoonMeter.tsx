/**
 * Spoon Meter HUD — Metabolic Economics Display
 * 
 * Vertex 3 (Interface Node) — Spoon economy visualizer
 * Displays current spoons with visual state management
 */

import { useCockpitStore } from '../hooks/useCockpitStore';
import { COCKPIT_COLORS, SPOON_CONFIG, getSpoonPercentage } from '../types/contracts';

// ═══════════════════════════════════════════════════════════════════
// Spoon Meter Component
// ═══════════════════════════════════════════════════════════════════

interface SpoonMeterProps {
  /** Compact mode for header bar */
  compact?: boolean;
  /** Show the deduct/restore buttons */
  showControls?: boolean;
  /** Size multiplier */
  size?: 'sm' | 'md' | 'lg';
  /** Hide the label */
  hideLabel?: boolean;
}

/**
 * Spoon Meter HUD element - shows current metabolic capacity
 */
export default function SpoonMeter({ 
  compact = false, 
  showControls = false,
  size = 'md',
  hideLabel = false 
}: SpoonMeterProps) {
  const metabolicState = useCockpitStore(s => s.metabolicState);
  const updateMetabolicState = useCockpitStore(s => s.updateMetabolicState);
  const spoons = metabolicState.current_spoons;
  const maxSpoons = metabolicState.max_spoons;
  const percentage = getSpoonPercentage(spoons, maxSpoons);

  const deductSpoon = (amount: number) => {
    updateMetabolicState({
      ...metabolicState,
      current_spoons: Math.max(0, spoons - amount),
    });
  };
  const restoreSpoon = (amount: number) => {
    updateMetabolicState({
      ...metabolicState,
      current_spoons: Math.min(maxSpoons, spoons + amount),
    });
  };
  
  // Determine state based on percentage
  const getState = () => {
    if (percentage < 25) return 'critical';
    if (percentage < 50) return 'low';
    if (percentage < 75) return 'moderate';
    return 'optimal';
  };
  
  const state = getState();
  
  // Color mapping based on state
  const getColor = () => {
    switch (state) {
      case 'critical': return COCKPIT_COLORS.danger_red;
      case 'low': return COCKPIT_COLORS.phosphorus_orange;
      case 'moderate': return COCKPIT_COLORS.calcium_amber;
      case 'optimal': return COCKPIT_COLORS.phosphorus;
    }
  };
  
  const color = getColor();
  
  // Size classes
  const sizeClasses = {
    sm: 'spoon-meter-sm',
    md: 'spoon-meter-md', 
    lg: 'spoon-meter-lg',
  };
  
  // Label based on state
  const getLabel = () => {
    if (percentage < 25) return 'BREATHE';
    if (percentage < 50) return 'FOCUS';
    if (percentage < 75) return 'BUILD';
    return 'COMMAND';
  };
  
  return (
    <div className={`spoon-meter ${sizeClasses[size]} spoon-meter-${state}`}>
      {!hideLabel && (
        <span className="spoon-meter-label" style={{ color }}>
          {getLabel()}
        </span>
      )}
      
      <div 
        className="spoon-meter-bar"
        role="progressbar"
        aria-valuenow={spoons}
        aria-valuemin={0}
        aria-valuemax={maxSpoons}
        aria-label={`Energy: ${spoons.toFixed(1)} of ${maxSpoons} spoons`}
      >
        <div 
          className="spoon-meter-fill"
          style={{ 
            width: `${percentage}%`,
            background: color,
          }}
        />
        <div 
          className="spoon-meter-threshold"
          style={{ left: `${SPOON_CONFIG.LOW_THRESHOLD * 100}%` }}
          title="Heartbeat Lockout Threshold"
        />
      </div>
      
      {showControls && (
        <div className="spoon-meter-controls">
          <button
            className="spoon-btn spoon-btn-deduct"
            onClick={() => deductSpoon(1)}
            disabled={spoons <= 0}
            aria-label="Deduct 1 spoon"
          >
            −
          </button>
          <button
            className="spoon-btn spoon-btn-restore"
            onClick={() => restoreSpoon(SPOON_CONFIG.CLICK_RESTORE)}
            disabled={spoons >= maxSpoons}
            aria-label="Restore spoon"
          >
            +
          </button>
        </div>
      )}
      
      <span className="spoon-meter-value" style={{ color }}>
        {spoons.toFixed(1)}
      </span>
      
      {!compact && (
        <span className="spoon-meter-max">
          / {maxSpoons}
        </span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Compact Header Version
// ═══════════════════════════════════════════════════════════════════

/**
 * Compact spoon meter for header bar
 */
export function CompactSpoonMeter() {
  return <SpoonMeter compact hideLabel />;
}

// ═══════════════════════════════════════════════════════════════════
// Full Display Version with Controls
// ═══════════════════════════════════════════════════════════════════

/**
 * Full spoon meter with controls
 */
export function FullSpoonMeter() {
  return (
    <SpoonMeter 
      showControls 
      size="lg" 
    />
  );
}
