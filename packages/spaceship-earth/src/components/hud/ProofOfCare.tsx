/**
 * @file ProofOfCare.tsx — PoC Dashboard HUD Component
 * 
 * Visualizes Proof of Care (PoC) metrics:
 * - Care Score calculation
 * - Green Coherence multiplier
 * - Growth Ring phase
 * - Proximity + Task breakdown
 * 
 * CWP-JITTERBUG-12: Proof of Care (PoC) UI Engine
 */
import { useState, useEffect, useMemo } from 'react';
import { useSovereignStore } from '../../sovereign/useSovereignStore';
import { haptic } from '../../services/haptic';
import {
  calculateCareScore,
  createEmptyPoCState,
  calculateGrowthRing,
  getGrowthRingWeight,
  type PoCState,
} from '../../engine/proofOfCare';

interface ProofOfCareProps {
  userAge?: number; // Optional: for Growth Ring calculation
}

export function ProofOfCare({ userAge = 25 }: ProofOfCareProps) {
  const [pocState, setPocState] = useState<PoCState>(createEmptyPoCState);
  const [isExpanded, setIsExpanded] = useState(false);

  // Subscribe to somatic tether data from sovereign store
  const somaticHrv = useSovereignStore((s) => s.somaticHrv);
  const somaticHr = useSovereignStore((s) => s.somaticHr);

  // Simulate respiration rate (would come from hardware)
  const [simulatedRespiration] = useState(5.8 + Math.random() * 0.4);

  // Update PoC state when biometric data changes
  useEffect(() => {
    const updatedState: PoCState = {
      ...pocState,
      currentHRV: somaticHrv || 35,
      currentHR: somaticHr || 68,
      respirationRate: simulatedRespiration,
    };
    
    const calculated = calculateCareScore(updatedState);
    setPocState(calculated);
    
    // Trigger haptic on green coherence (0.1 Hz)
    const wasCoherent = Math.abs(pocState.respirationRate - 6) <= 0.5;
    const isCoherent = Math.abs(calculated.respirationRate - 6) <= 0.5;
    if (isCoherent && !wasCoherent) {
      haptic.coherence();
    }
  }, [somaticHrv, somaticHr, simulatedRespiration]);

  // Growth Ring calculation
  const growthRing = useMemo(() => calculateGrowthRing(userAge), [userAge]);
  const governanceWeight = useMemo(() => getGrowthRingWeight(growthRing), [growthRing]);

  // Color by ring phase
  const ringColors = {
    trust: '#888888',
    apprenticeship: '#cda852',
    sovereignty: '#4db8a8',
  };
  const ringColor = ringColors[growthRing];

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 100,
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#4db8a8',
        background: 'rgba(5, 5, 11, 0.85)',
        border: `1px solid ${ringColor}40`,
        borderRadius: '8px',
        padding: '12px 16px',
        backdropFilter: 'blur(8px)',
        minWidth: '200px',
        cursor: 'pointer',
        userSelect: 'none',
      }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: ringColor,
            boxShadow: `0 0 8px ${ringColor}`,
          }}
        />
        <span style={{ fontWeight: 600, letterSpacing: '0.5px' }}>
          PROOF OF CARE
        </span>
      </div>

      {/* Primary Score */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
          {pocState.careScore.toFixed(2)}
        </div>
        <div style={{ fontSize: '10px', color: '#666' }}>
          Care Score = (T<sub>prox</sub> × Q<sub>res</sub> × Green) + Tasks
        </div>
      </div>

      {/* Growth Ring Badge */}
      <div
        style={{
          display: 'inline-block',
          padding: '4px 8px',
          borderRadius: '4px',
          background: `${ringColor}20`,
          border: `1px solid ${ringColor}40`,
          marginBottom: '8px',
        }}
      >
        <span style={{ color: ringColor, fontWeight: 600, fontSize: '11px' }}>
          {growthRing.toUpperCase()} RING
        </span>
        <span style={{ color: '#666', marginLeft: '8px', fontSize: '10px' }}>
          Weight: {governanceWeight}%
        </span>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(77, 184, 168, 0.15)' }}>
          
          {/* Proximity Score */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span style={{ color: '#888', fontSize: '10px' }}>T<sub>prox</sub> (Proximity)</span>
              <span style={{ color: '#4db8a8', fontSize: '10px' }}>{pocState.proximityScore.toFixed(2)}</span>
            </div>
            <div style={{ height: '4px', background: '#222', borderRadius: '2px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${pocState.proximityScore * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #4db8a8, #cda852)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          {/* Green Coherence Multiplier */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span style={{ color: '#888', fontSize: '10px' }}>Green Coherence</span>
              <span style={{ color: pocState.greenCoherenceMultiplier > 1.4 ? '#cda852' : '#666', fontSize: '10px' }}>
                ×{pocState.greenCoherenceMultiplier.toFixed(2)}
              </span>
            </div>
            <div style={{ height: '4px', background: '#222', borderRadius: '2px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${((pocState.greenCoherenceMultiplier - 1) / 1.5) * 100}%`,
                  height: '100%',
                  background: pocState.greenCoherenceMultiplier > 1.4 ? '#cda852' : '#4db8a8',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          {/* Task Score */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span style={{ color: '#888', fontSize: '10px' }}>Tasks Verified</span>
              <span style={{ color: '#4db8a8', fontSize: '10px' }}>{pocState.taskScore}</span>
            </div>
          </div>

          {/* Biometric Inputs */}
          <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid rgba(77, 184, 168, 0.1)' }}>
            <div style={{ fontSize: '9px', color: '#555', marginBottom: '4px' }}>BIOMETRICS:</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', fontSize: '10px' }}>
              <div>
                <span style={{ color: '#666' }}>HRV: </span>
                <span style={{ color: '#4db8a8' }}>{pocState.currentHRV}ms</span>
              </div>
              <div>
                <span style={{ color: '#666' }}>HR: </span>
                <span style={{ color: '#4db8a8' }}>{pocState.currentHR}bpm</span>
              </div>
              <div>
                <span style={{ color: '#666' }}>Resp: </span>
                <span style={{ color: '#4db8a8' }}>{pocState.respirationRate.toFixed(1)}/min</span>
              </div>
            </div>
          </div>

          {/* 0.1 Hz Indicator */}
          <div style={{ marginTop: '8px', textAlign: 'center' }}>
            <span
              style={{
                fontSize: '9px',
                color: Math.abs(pocState.respirationRate - 6) <= 0.5 ? '#cda852' : '#555',
                background: Math.abs(pocState.respirationRate - 6) <= 0.5 ? 'rgba(205, 168, 82, 0.1)' : 'transparent',
                padding: '2px 6px',
                borderRadius: '3px',
              }}
            >
              {Math.abs(pocState.respirationRate - 6) <= 0.5 ? '● COHERENT (0.1 Hz)' : '○ Not Coherent'}
            </span>
          </div>

        </div>
      )}
    </div>
  );
}