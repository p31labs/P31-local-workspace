import React, { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const { Vector3 } = THREE;

/**
 * Tri-State Camera System for Delta Cockpit
 * 
 * Implements three distinct contextual modes for spatial navigation:
 * - Free Orbit: For omnidirectional exploration
 * - Dome Mode: Locked to bounded orbit around central 80-face icosphere
 * - Screen Mode: Locked parallel to 2D virtual terminal faces with infinite horizontal scroll
 */

export type CameraMode = 'free' | 'dome' | 'screen';

interface TriStateCameraProps {
  mode: CameraMode;
  target?: THREE.Vector3;
  radius?: number;
  height?: number;
  onModeChange?: (mode: CameraMode) => void;
}

export const TriStateCamera: React.FC<TriStateCameraProps> = ({
  mode = 'free',
  target = new Vector3(0, 0, 0),
  radius = 20,
  height = 10,
  onModeChange
}) => {
  const { camera, gl } = useThree();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Camera state management
  const [cameraState, setCameraState] = useState({
    mode: mode,
    target: target,
    radius: radius,
    height: height,
    phi: Math.PI / 3, // Vertical angle
    theta: 0,         // Horizontal angle
  });

  // Update camera state when props change
  useEffect(() => {
    setCameraState(prev => ({
      ...prev,
      mode,
      target,
      radius,
      height
    }));
  }, [mode, target, radius, height]);

  // Handle mode transitions
  useEffect(() => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      
      switch (mode) {
        case 'free':
          // Standard orbit controls
          controls.enablePan = true;
          controls.enableRotate = true;
          controls.enableZoom = true;
          controls.minDistance = 5;
          controls.maxDistance = 100;
          controls.maxPolarAngle = Math.PI - 0.1;
          controls.minPolarAngle = 0.1;
          break;

        case 'dome':
          // Locked to bounded orbit around central icosphere
          controls.enablePan = false;
          controls.enableRotate = true;
          controls.enableZoom = true;
          controls.minDistance = 15;
          controls.maxDistance = 35;
          controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent going below horizon
          controls.minPolarAngle = 0.1;
          controls.maxAzimuthAngle = Infinity;
          controls.minAzimuthAngle = -Infinity;
          break;

        case 'screen':
          // Locked parallel to 2D virtual terminal faces
          controls.enablePan = true;
          controls.enableRotate = false; // Disable rotation in screen mode
          controls.enableZoom = true;
          controls.minDistance = 10;
          controls.maxDistance = 50;
          // Lock camera to face virtual terminal planes
          camera.rotation.x = 0;
          camera.rotation.z = 0;
          break;
      }
    }
  }, [mode, camera]);

  // Smooth camera transitions
  useFrame((state, delta) => {
    if (!controlsRef.current) return;

    const controls = controlsRef.current;
    
    switch (cameraState.mode) {
      case 'dome':
        // Enforce dome constraints
        const distance = camera.position.distanceTo(cameraState.target);
        if (distance < cameraState.radius * 0.75) {
          // Push camera out if too close
          const direction = new Vector3().subVectors(camera.position, cameraState.target).normalize();
          camera.position.copy(cameraState.target).add(direction.multiplyScalar(cameraState.radius * 0.75));
        }
        break;

      case 'screen':
        // Maintain screen-parallel orientation
        camera.lookAt(cameraState.target);
        // Allow horizontal panning but maintain vertical alignment
        const currentPos = camera.position;
        const targetPos = new Vector3(
          currentPos.x,
          cameraState.target.y + cameraState.height,
          currentPos.z
        );
        camera.position.lerp(targetPos, 5 * delta);
        break;
    }
  });

  // Handle camera interactions
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (mode === 'screen' && event.ctrlKey) {
        // In screen mode with Ctrl, allow zoom
        return;
      } else if (mode === 'screen') {
        // In screen mode without Ctrl, prevent zoom
        event.preventDefault();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Return to free orbit mode
        onModeChange?.('free');
      }
    };

    gl.domElement.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      gl.domElement.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mode, gl.domElement, onModeChange]);

  return (
    <OrbitControls
      ref={controlsRef}
      target={cameraState.target.toArray()}
      enableDamping={true}
      dampingFactor={0.05}
      rotateSpeed={0.5}
      zoomSpeed={0.8}
      panSpeed={0.5}
    />
  );
};

/**
 * Camera Mode Switcher Component
 */
export const CameraModeSwitcher: React.FC<{
  currentMode: CameraMode;
  onModeChange: (mode: CameraMode) => void;
}> = ({ currentMode, onModeChange }) => {
  const modeLabels = {
    free: 'Free Orbit',
    dome: 'Dome Mode', 
    screen: 'Screen Mode'
  };

  const modeDescriptions = {
    free: 'Omnidirectional exploration',
    dome: 'Bounded orbit around central structure',
    screen: '2D terminal interface navigation'
  };

  return (
    <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-4 rounded-lg">
      <h3 className="text-lg font-bold mb-2">Camera Mode</h3>
      <div className="space-y-2">
        {(['free', 'dome', 'screen'] as CameraMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            className={`w-full text-left p-2 rounded ${
              currentMode === mode ? 'bg-blue-600' : 'hover:bg-gray-700'
            }`}
          >
            <div className="font-semibold">{modeLabels[mode]}</div>
            <div className="text-sm opacity-75">{modeDescriptions[mode]}</div>
          </button>
        ))}
      </div>
      <div className="mt-4 text-xs opacity-50">
        Tip: Press Escape to return to Free Orbit mode
      </div>
    </div>
  );
};

/**
 * Enhanced Camera with Haptic Feedback Integration
 */
export const HapticTriStateCamera: React.FC<TriStateCameraProps> = (props) => {
  const [hapticFeedback, setHapticFeedback] = useState(false);

  // Trigger haptic feedback on mode changes
  useEffect(() => {
    if (props.mode) {
      setHapticFeedback(true);
      const timer = setTimeout(() => setHapticFeedback(false), 100);
      return () => clearTimeout(timer);
    }
  }, [props.mode]);

  return (
    <TriStateCamera {...props} />
  );
};
