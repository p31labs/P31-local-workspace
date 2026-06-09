/**
 * P31 Cockpit Layout — Z-Index Master Contract
 * 
 * Vertex 3 (Interface Node) — Z-index layer enforcement
 * Digital equivalent of OS kernel ring privileges
 * Higher Z values always supersede lower Z values
 */

import React from 'react';
import { Z_LAYERS, Z_LAYER_NAMES } from '../types/contracts';

// ═══════════════════════════════════════════════════════════════════
// Z-Index Layer Components
// ═══════════════════════════════════════════════════════════════════

interface ZLayerProps {
  children: React.ReactNode;
  layer: keyof typeof Z_LAYERS;
  visible?: boolean;
  className?: string;
}

/**
 * Z-Layer wrapper component - enforces z-index hierarchy
 */
export function ZLayer({ children, layer, visible = true, className = '' }: ZLayerProps) {
  const zIndex = Z_LAYERS[layer];
  
  if (!visible) return null;
  
  return (
    <div 
      className={`z-layer z-layer-${layer.toLowerCase()} ${className}`}
      style={{ zIndex }}
      data-layer={Z_LAYER_NAMES[layer]}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Specific Layer Components
// ═══════════════════════════════════════════════════════════════════

/**
 * Z-0: Void Starfield - Foundational background
 */
export function VoidLayer({ children }: { children?: React.ReactNode }) {
  return (
    <div className="void-starfield" style={{ zIndex: Z_LAYERS.VOID }}>
      {children}
    </div>
  );
}

/**
 * Z-1: Canvas - WebGL context for core logic
 */
export function CanvasLayer({ children }: { children?: React.ReactNode }) {
  return (
    <div className="canvas-layer" style={{ zIndex: Z_LAYERS.CANVAS }}>
      {children}
    </div>
  );
}

/**
 * Z-10: Room HUD - Application-specific 2D overlays with backdrop blur
 */
export function RoomHUDLayer({ children }: { children?: React.ReactNode }) {
  return (
    <div 
      className="room-hud-layer" 
      style={{ zIndex: Z_LAYERS.ROOM_HUD }}
    >
      {children}
    </div>
  );
}

/**
 * Z-11: Room Router Nav - Persistent bottom navigation bar
 */
export function RouterNavLayer({ children }: { children?: React.ReactNode }) {
  return (
    <div 
      className="router-nav-layer" 
      style={{ zIndex: Z_LAYERS.ROUTER_NAV }}
    >
      {children}
    </div>
  );
}

/**
 * Z-50: System Toasts - Non-blocking alerts
 */
export function ToastLayer({ children }: { children?: React.ReactNode }) {
  return (
    <div 
      className="toast-layer" 
      style={{ zIndex: Z_LAYERS.TOAST }}
    >
      {children}
    </div>
  );
}

/**
 * Z-60: Modals - System settings, LOVE Wallet
 */
export function ModalLayer({ children }: { children?: React.ReactNode }) {
  return (
    <div 
      className="modal-layer" 
      style={{ zIndex: Z_LAYERS.MODAL }}
    >
      {children}
    </div>
  );
}

/**
 * Z-80: Centaur Terminal - Persistent AI chat window
 */
export function CentaurLayer({ children }: { children?: React.ReactNode }) {
  return (
    <div 
      className="centaur-layer" 
      style={{ zIndex: Z_LAYERS.CENTAUR }}
    >
      {children}
    </div>
  );
}

/**
 * Z-100: Boot / Lock Screen - Cryptographic authentication walls
 */
export function BootLayer({ children }: { children?: React.ReactNode }) {
  return (
    <div 
      className="boot-layer" 
      style={{ zIndex: Z_LAYERS.BOOT }}
    >
      {children}
    </div>
  );
}

/**
 * Z-200: Onboarding - 5-phase initialization sequence
 */
export function OnboardingLayer({ children }: { children?: React.ReactNode }) {
  return (
    <div 
      className="onboarding-layer" 
      style={{ zIndex: Z_LAYERS.ONBOARDING }}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Cockpit Layout Container
// ═══════════════════════════════════════════════════════════════════

interface CockpitLayoutProps {
  children: React.ReactNode;
  /** Room HUD layer content */
  roomHUD?: React.ReactNode;
  /** Router nav layer content */
  routerNav?: React.ReactNode;
  /** Toast layer content */
  toasts?: React.ReactNode;
  /** Modal layer content */
  modals?: React.ReactNode;
  /** Centaur terminal content */
  centaur?: React.ReactNode;
  /** Boot screen content */
  boot?: React.ReactNode;
  /** Onboarding content */
  onboarding?: React.ReactNode;
  /** Show void layer background */
  showVoid?: boolean;
}

/**
 * Complete Cockpit Layout with all Z-layers
 * Enforces the complete Z-index hierarchy
 */
export default function CockpitLayout({
  children,
  roomHUD,
  routerNav,
  toasts,
  modals,
  centaur,
  boot,
  onboarding,
  showVoid = true,
}: CockpitLayoutProps) {
  // Determine which overlay layers are active
  const hasOnboarding = !!onboarding;
  const hasBoot = !!boot && !hasOnboarding;
  const hasCentaur = !!centaur;
  const hasModals = !!modals;
  const hasToasts = !!toasts;
  const hasRouterNav = !!routerNav;
  const hasRoomHUD = !!roomHUD;
  
  return (
    <div className="cockpit-layout">
      {/* Z-0: Void Starfield */}
      {showVoid && <VoidLayer />}
      
      {/* Z-1: Canvas (main content) */}
      <CanvasLayer>
        {children}
      </CanvasLayer>
      
      {/* Z-10: Room HUD */}
      {hasRoomHUD && <RoomHUDLayer>{roomHUD}</RoomHUDLayer>}
      
      {/* Z-11: Router Nav */}
      {hasRouterNav && <RouterNavLayer>{routerNav}</RouterNavLayer>}
      
      {/* Z-50: System Toasts */}
      {hasToasts && <ToastLayer>{toasts}</ToastLayer>}
      
      {/* Z-60: Modals */}
      {hasModals && <ModalLayer>{modals}</ModalLayer>}
      
      {/* Z-80: Centaur Terminal */}
      {hasCentaur && <CentaurLayer>{centaur}</CentaurLayer>}
      
      {/* Z-100: Boot Screen */}
      {hasBoot && <BootLayer>{boot}</BootLayer>}
      
      {/* Z-200: Onboarding */}
      {hasOnboarding && <OnboardingLayer>{onboarding}</OnboardingLayer>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Utility functions
// ═══════════════════════════════════════════════════════════════════

/**
 * Get z-index value for a layer
 */
export function getZIndex(layer: keyof typeof Z_LAYERS): number {
  return Z_LAYERS[layer];
}

/**
 * Check if a layer should be visible based on priority
 * Higher priority layers hide lower ones
 */
export function shouldShowLayer(
  targetLayer: keyof typeof Z_LAYERS,
  activeLayers: Set<keyof typeof Z_LAYERS>
): boolean {
  const targetZ = Z_LAYERS[targetLayer];
  
  for (const layer of activeLayers) {
    const layerZ = Z_LAYERS[layer];
    if (layerZ > targetZ) {
      return false;
    }
  }
  
  return true;
}

/**
 * Layer priority array - ordered from lowest to highest
 */
export const LAYER_PRIORITY: (keyof typeof Z_LAYERS)[] = [
  'VOID',
  'CANVAS',
  'ROOM_HUD',
  'ROUTER_NAV',
  'TOAST',
  'MODAL',
  'HANDSHAKE',
  'CENTAUR',
  'BOOT',
  'ONBOARDING',
];

// ═══════════════════════════════════════════════════════════════════
// Export all
// ═══════════════════════════════════════════════════════════════════

export {
  Z_LAYERS,
  Z_LAYER_NAMES,
};
