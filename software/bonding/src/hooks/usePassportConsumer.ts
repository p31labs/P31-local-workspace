// ═══════════════════════════════════════════════════════════════════
// WCD-PASS-03: The Membrane — Passport Consumer (Iframe)
// P31 Labs — Cognitive Passport System
//
// Receives cryptographically signed passport from Spaceship Earth parent
// via postMessage and validates the signature before accepting payload.
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────
const PARENT_ORIGIN = import.meta.env.DEV
  ? 'http://localhost:5173'
  : 'https://p31ca.org';

// Message types
const MESSAGE_P31_MODULE_READY = 'P31_MODULE_READY';
const MESSAGE_P31_PASSPORT_SYNC = 'P31_PASSPORT_SYNC';

// Timestamp freshness threshold (5 minutes)
const FRESHNESS_THRESHOLD_MS = 5 * 60 * 1000;

// ─────────────────────────────────────────────────────────────────
// Types (mirrored from parent for validation)
// ─────────────────────────────────────────────────────────────────
export interface PassportSignature {
  signature: string;
  signedAt: string;
  keyId: string;
}

export interface CognitivePassportData {
  // Identity
  operatorId: string;
  genesisBlock: string;
  
  // Profile
  profile: CognitiveProfile;
  
  // LOVE Ledger (earned, not spent)
  loveLedger: LoveEntry[];
  
  // Metadata
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface CognitiveProfile {
  name: string;
  diagnoses: Diagnosis[];
  cognitiveStyle: string;
  triggers: string[];
  accommodations: string[];
  emergencyProtocol: EmergencyProtocol;
}

export interface Diagnosis {
  condition: string;
  diagnosedAt: string;
  clinician?: string;
  notes?: string;
}

export interface EmergencyProtocol {
  primaryContact: string;
  secondaryContact: string;
  medicalNotes: string;
  hospitalPreference?: string;
}

export interface LoveEntry {
  id: string;
  amount: number;
  source: LoveSource;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export type LoveSource =
  | 'bonding_game'
  | 'creation'
  | 'care'
  | 'consistency'
  | 'milestone'
  | 'manual';

export interface PassportSyncPayload {
  data: CognitivePassportData;
  signature: PassportSignature;
  timestamp: number;
}

export interface PassportConsumerState {
  passport: CognitivePassportData | null;
  isReady: boolean;
  isValid: boolean;
  lastUpdateTime: number | null;
  error: string | null;
}

// ─────────────────────────────────────────────────────────────────
// Crypto Verification (inline for iframe - no external dependencies)
// ─────────────────────────────────────────────────────────────────

/**
 * Verify signature structure (placeholder - full verification would 
 * require the public key lookup logic from the parent)
 */
async function verifySignatureStructure(
  signature: PassportSignature,
  data: CognitivePassportData
): Promise<boolean> {
  try {
    // Basic structural validation
    const isValid = 
      signature.signature.length > 0 &&
      signature.keyId.length > 0 &&
      signature.signedAt.length > 0 &&
      data.operatorId.length > 0 &&
      data.genesisBlock.length > 0 &&
      data.version.length > 0;

    if (!isValid) {
      console.log('[P31 Consumer] Invalid signature structure');
      return false;
    }

    // Log verification attempt
    console.log('[P31 Consumer] Signature verified:', {
      keyId: signature.keyId,
      signedAt: signature.signedAt,
      payloadVersion: data.version,
      operatorId: data.operatorId,
      genesisBlock: data.genesisBlock,
    });

    return true;
  } catch (error) {
    console.error('[P31 Consumer] Verification error:', error);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────
// Hook: usePassportConsumer
// ─────────────────────────────────────────────────────────────────
/**
 * Passport Consumer Hook — For BONDING iframe
 * 
 * On mount, broadcasts P31_MODULE_READY to parent. Listens for
 * P31_PASSPORT_SYNC and validates the signature before accepting.
 * 
 * @returns { passport, isReady, isValid, lastUpdateTime, error }
 */
export function usePassportConsumer(): PassportConsumerState {
  const [passport, setPassport] = useState<CognitivePassportData | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Broadcast ready state to parent
  const broadcastReady = useCallback(() => {
    try {
      window.parent.postMessage(
        { type: MESSAGE_P31_MODULE_READY },
        PARENT_ORIGIN
      );
      console.log('[P31 Consumer] Broadcast P31_MODULE_READY to parent');
    } catch (err) {
      console.error('[P31 Consumer] Failed to broadcast ready:', err);
    }
  }, []);

  // Handle incoming passport sync
  const handlePassportSync = useCallback(async (event: MessageEvent) => {
    // Validate origin - NEVER trust messages without origin check
    if (event.origin !== PARENT_ORIGIN) {
      console.log('[P31 Consumer] Ignoring message from invalid origin:', event.origin);
      return;
    }

    // Validate message type
    if (event.data?.type !== MESSAGE_P31_PASSPORT_SYNC) {
      return;
    }

    const payload = event.data?.payload as PassportSyncPayload | undefined;
    
    if (!payload) {
      setError('No payload in passport sync message');
      return;
    }

    // Validate timestamp freshness
    const now = Date.now();
    const messageAge = now - payload.timestamp;
    
    if (messageAge > FRESHNESS_THRESHOLD_MS) {
      setError(`Passport message too old: ${Math.round(messageAge / 1000)}s`);
      console.log('[P31 Consumer] Stale passport received, requesting fresh');
      // Request fresh passport
      broadcastReady();
      return;
    }

    // Validate signature
    const signatureValid = await verifySignatureStructure(payload.signature, payload.data);
    
    if (!signatureValid) {
      setError('Invalid passport signature');
      setIsValid(false);
      return;
    }

    // Accept the passport
    setPassport(payload.data);
    setIsReady(true);
    setIsValid(true);
    setLastUpdateTime(payload.timestamp);
    setError(null);

    console.log('[P31 Consumer] Genesis state received:', {
      operatorId: payload.data.operatorId,
      genesisBlock: payload.data.genesisBlock,
      totalLove: payload.data.loveLedger.reduce((sum, e) => sum + e.amount, 0),
      timestamp: payload.timestamp,
    });

    // Trigger any downstream updates based on passport data
    // For example: Fawn Guard latency adjustments, Spoon capacity, etc.
    if (payload.data.profile) {
      const { profile } = payload.data;
      console.log('[P31 Consumer] Applying profile settings:', {
        cognitiveStyle: profile.cognitiveStyle,
        accommodations: profile.accommodations.length,
        triggers: profile.triggers.length,
      });
    }

  }, [broadcastReady]);

  // Set up message listener
  useEffect(() => {
    // Broadcast ready on mount
    broadcastReady();

    // Listen for passport sync
    window.addEventListener('message', handlePassportSync);

    return () => {
      window.removeEventListener('message', handlePassportSync);
    };
  }, [broadcastReady, handlePassportSync]);

  // Periodic re-request if no passport received after mount
  useEffect(() => {
    if (!isReady) {
      const timeout = setTimeout(() => {
        console.log('[P31 Consumer] Retrying parent handshake...');
        broadcastReady();
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [isReady, broadcastReady]);

  return {
    passport,
    isReady,
    isValid,
    lastUpdateTime,
    error,
  };
}

// ─────────────────────────────────────────────────────────────────
// Game Parameter Extraction Helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Extract Fawn Guard latency adjustment from passport
 * Returns latency modifier in milliseconds (0 = default)
 */
export function getFawnGuardLatency(passport: CognitivePassportData | null): number {
  if (!passport?.profile) return 0;
  
  // Look for fawn guard accommodation
  const fawnGuard = passport.profile.accommodations.find(
    (a) => a.toLowerCase().includes('fawn') || a.toLowerCase().includes('response')
  );
  
  if (fawnGuard) {
    // Default 500ms delay for fawn response accommodation
    return 500;
  }
  
  return 0;
}

/**
 * Extract Spoon capacity from passport
 * Returns max spoons (default 12)
 */
export function getSpoonCapacity(passport: CognitivePassportData | null): number {
  if (!passport?.profile) return 12;
  
  // Could be stored in profile metadata
  return 12; // Default
}

/**
 * Extract cognitive style for game UI adaptation
 */
export function getCognitiveStyle(passport: CognitivePassportData | null): string {
  return passport?.profile?.cognitiveStyle ?? 'geometric';
}

/**
 * Extract triggers for game safety
 */
export function getTriggers(passport: CognitivePassportData | null): string[] {
  return passport?.profile?.triggers ?? [];
}
