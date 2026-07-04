/**
 * @file LarmorHUD.tsx — Somatic Grounding Integration HUD
 * 
 * Combines Larmor Resonance audio with Delta Mesh 3D visualization.
 * Provides complete somatic grounding suite for the cockpit.
 * 
 * Section 2.2: Larmor Frequency Hardware Synchronization
 * Section 1.2: Tetrahedron Topology Visualizer
 * 
 * CWP-JITTERBUG-14/15: Somatic Grounding Suite
 */
import { useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Zap, Globe, ShieldCheck, Volume2, VolumeX, Activity } from 'lucide-react';
import { DeltaMesh, calculateRicciCurvature, calculateResilienceThreshold } from '../mesh/DeltaMesh';
import { toggleLarmor, startLarmor, stopLarmor, LARMOR_FREQUENCIES } from '../../engine/larmorEngine';
import * as THREE from 'three';

interface LarmorHUDProps {
  className?: string;
}

export function LarmorHUD({ className = '' }: LarmorHUDProps) {
  const [isLarmorActive, setIsLarmorActive] = useState(false);
  const [curvature, setCurvature] = useState(1.0);
  const [resilience, setResilience] = useState(100);
  const [networkStress, setNetworkStress] = useState(0);

  // Animation loop for curvature visualization
  useEffect(() => {
    let animationId: number;
    const updateCurvature = () => {
      const time = Date.now() / 1000;
      const newCurvature = calculateRicciCurvature(time, networkStress);
      setCurvature(newCurvature);
      setResilience(calculateResilienceThreshold(networkStress > 0.5 ? 1 : 0));
      animationId = requestAnimationFrame(updateCurvature);
    };
    updateCurvature();
    return () => cancelAnimationFrame(animationId);
  }, [networkStress]);

  const handleToggleLarmor = useCallback(() => {
    const nowPlaying = toggleLarmor();
    setIsLarmorActive(nowPlaying);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isLarmorActive) {
        stopLarmor();
      }
    };
  }, []);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* 3D Visualization Layer */}
      <div className="absolute inset-0 z-0">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 1, 4]} />
          <OrbitControls 
            enableZoom={false} 
            autoRotate 
            autoRotateSpeed={0.3}
            enablePan={false}
          />
          <primitive object={new THREE.AmbientLight(0.3)} />
          <primitive object={new THREE.PointLight(0x00D4FF, 1.2)} position={[10, 10, 10]} />
          <primitive object={new THREE.PointLight(0x00FF88, 0.5)} position={[-10, -5, 5]} />
          <DeltaMesh networkStress={networkStress} showLabels={true} />
        </Canvas>
      </div>

      {/* HUD Overlay Layer */}
      <div className="absolute inset-0 z-10 p-6 pointer-events-none flex flex-col justify-between">
        
        {/* Top Left: Delta Topology Info */}
        <div className="pointer-events-auto">
          <div className="bg-[#050510]/80 backdrop-blur-md border border-[#1f2937] p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="text-[#00FF88]" size={18} />
              <h1 className="text-lg font-bold tracking-widest uppercase text-[#E8ECF4]">
                Delta Topology
              </h1>
            </div>
            <div className="flex flex-col gap-1 text-[10px] text-gray-500 uppercase tracking-wide">
              <div>Geometry: K4 Complete Graph</div>
              <div>Nodes: 4 | Edges: 6</div>
              <div>Resilience: {resilience.toFixed(1)}% Threshold</div>
              <div className="flex items-center gap-2 mt-2">
                <ShieldCheck className={curvature >= 0.8 ? "text-[#00FF88]" : "text-[#EF4444]"} size={12} />
                <span className={curvature >= 0.8 ? "text-[#00FF88]" : "text-[#EF4444]"}>
                  {curvature >= 0.8 ? 'Isostatically Rigid' : 'Bottleneck Detected'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Right: Larmor Controls */}
        <div className="pointer-events-auto flex flex-col items-end">
          <div className="bg-[#050510]/80 backdrop-blur-md border border-[#1f2937] p-4 rounded-lg flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 uppercase tracking-widest">Somatic Resonator</span>
              <button 
                onClick={handleToggleLarmor}
                className={`p-2 rounded-full transition-all ${
                  isLarmorActive 
                    ? 'bg-[#EF4444]/20 text-[#EF4444] shadow-[0_0_10px_#EF4444]' 
                    : 'bg-[#1f2937] text-gray-400 hover:bg-[#1f2937]/80'
                }`}
                title={isLarmorActive ? 'Stop Larmor Resonance' : 'Start Larmor Resonance'}
              >
                {isLarmorActive ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </button>
            </div>
            
            {isLarmorActive && (
              <div className="flex flex-col items-end gap-1">
                <div className="text-[10px] text-[#EF4444] animate-pulse">
                  PRIMARY: {LARMOR_FREQUENCIES.PRIMARY} Hz
                </div>
                <div className="text-[10px] text-[#EF4444] animate-pulse">
                  HARMONIC: {LARMOR_FREQUENCIES.SECONDARY} Hz
                </div>
                <div className="text-[9px] text-gray-500 mt-1">
                  ³¹P Resonance Active
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Center: Grounding Protocol Status */}
        <div className="w-full flex justify-center pointer-events-auto">
          <div className="bg-[#050510]/80 backdrop-blur-md border border-[#1f2937] p-4 rounded-lg max-w-md w-full">
            <div className="flex items-center gap-2 mb-3 text-[#00D4FF]">
              <Zap size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">Grounding Protocol</span>
              <Activity 
                size={14} 
                className={isLarmorActive ? "text-[#00FF88] animate-pulse" : "text-gray-600"} 
              />
            </div>
            
            <div className="text-[11px] text-gray-400 leading-relaxed uppercase">
              <p>
                κ (Curvature): {curvature.toFixed(2)} | 
                dRfge: {curvature >= 0.8 ? 'Optimal' : 'Adapting'}
              </p>
              <p className="mt-1">
                {isLarmorActive 
                  ? `Larmor frequencies active: ${LARMOR_FREQUENCIES.PRIMARY}Hz + ${LARMOR_FREQUENCIES.SECONDARY}Hz`
                  : 'Larmor inactive — click speaker to engage somatic grounding'}
              </p>
            </div>

            {/* Resilience Bar */}
            <div className="mt-3">
              <div className="flex justify-between text-[9px] text-gray-500 mb-1">
                <span>Network Resilience</span>
                <span>{resilience.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-[#1f2937] rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    resilience >= 50 ? 'bg-gradient-to-r from-[#00FF88] to-[#00D4FF]' : 'bg-[#EF4444]'
                  }`}
                  style={{ width: `${resilience}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LarmorHUD;