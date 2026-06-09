// ═══════════════════════════════════════════════════════
// @p31/shared — ZUI Camera Store
//
// Zustand store for managing ZUI camera state and transitions.
// Uses subscribeWithSelector middleware for non-reactive access
// in useFrame to avoid React reconciliation performance issues.
//
// Based on WCD-SE-SDS specification for Spaceship Earth.
// ═══════════════════════════════════════════════════════

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { ZoomLevel, CameraState, ZoomTarget } from './types';

export interface CameraActions {
  zoomToNode: (nodeId: string, level: ZoomLevel) => void;
  zoomOut: () => void;
  setPerformanceFactor: (factor: number) => void;
  setTransitioning: (isTransitioning: boolean) => void;
  updateCameraPosition: (position: [number, number, number]) => void;
  updateCameraLookAt: (lookAt: [number, number, number]) => void;
}

export const useZUICameraStore = create<CameraState & CameraActions>()(
  subscribeWithSelector((set, get) => ({
    currentLevel: ZoomLevel.MACRO,
    previousLevel: ZoomLevel.MACRO,
    isTransitioning: false,
    target: { 
      level: ZoomLevel.MACRO, 
      nodeId: null,
      position: [0, 0, 100], 
      lookAt: [0, 0, 0] 
    },
    cameraPosition: [0, 0, 100],
    cameraLookAt: [0, 0, 0],
    performanceFactor: 0.5,

    zoomToNode: (nodeId: string, level: ZoomLevel) => {
      const prev = get().currentLevel;
      set({ 
        previousLevel: prev, 
        currentLevel: level,
        isTransitioning: true,
        target: { 
          level, 
          nodeId, 
          position: [0, 0, 0],
          lookAt: [0, 0, 0] 
        } 
      });
    },

    zoomOut: () => {
      const prev = get().currentLevel;
      const next = Math.max(0, prev - 1) as ZoomLevel;
      set({ 
        previousLevel: prev, 
        currentLevel: next,
        isTransitioning: true 
      });
    },

    setPerformanceFactor: (factor: number) => set({ performanceFactor: factor }),
    setTransitioning: (isTransitioning: boolean) => set({ isTransitioning }),
    
    updateCameraPosition: (position: [number, number, number]) => 
      set({ cameraPosition: position }),
    
    updateCameraLookAt: (lookAt: [number, number, number]) => 
      set({ cameraLookAt: lookAt }),
  }))
);

/**
 * Get current camera state without React re-rendering.
 * Use this in useFrame for performance.
 */
export const getCameraState = () => useZUICameraStore.getState();

/**
 * Subscribe to camera state changes without React re-rendering.
 */
export const subscribeToCameraState = (callback: (state: CameraState) => void) => {
  return useZUICameraStore.subscribe(callback);
};