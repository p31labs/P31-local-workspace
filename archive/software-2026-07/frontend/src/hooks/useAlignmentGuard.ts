/**
 * P31 Alignment Guard Filter
 * ==========================
 * 
 * Client-side alignment verification for prompt injection attempts.
 * Detects attempts to override immutable rules (Register P).
 * 
 * Author: P31 Labs
 * License: MIT
 */

import { useCallback } from 'react';

/**
 * Alignment violation patterns - attempts to override immutable rules
 */
const ALIGNMENT_PATTERNS = [
  // Direct override attempts
  /\b(ignore|forget|bypass|discard|disregard)\b\s+(the\s+)?(previous|prior|original|earlier)\s+(instructions?|rules?|guidelines?|constraints?|context)/gi,
  
  // Jailbreak patterns
  /\b(jailbreak|escape|override|unlock)\b.*\b(system|safety|guidelines|restrictions)\b/gi,
  
  // Role override attempts
  /\b(you are now|pretend to be|act as if you are|roleplay as)\b/gi,
  
  // Constraint bypass
  /\b(disabled?|deactivate|turn off)\b\s+(safety|security|filter|restriction)/gi,
  
  // "New instructions" override
  /\b(new instruction|new rule|bypass the|ignore all)\b/gi,
  
  // Admin/sudo patterns
  /\b(sudo|admin mode|god mode|superuser)\b/gi,
  
  // Override specific P31 rules
  /\b(Kulik Recursive Rulebook|Kids First|register (P|N|U))\b/gi,
];

/**
 * Alignment Guard Result
 */
export interface AlignmentResult {
  isViolation: boolean;
  violations: string[];
  confidence: number;
}

/**
 * Check text for alignment violations
 */
export function checkAlignment(text: string): AlignmentResult {
  if (!text || text.length < 10) {
    return { isViolation: false, violations: [], confidence: 0 };
  }

  const violations: string[] = [];
  let matchCount = 0;

  for (const pattern of ALIGNMENT_PATTERNS) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      violations.push(...matches);
      matchCount += matches.length;
    }
  }

  // Confidence based on violation density
  const wordCount = text.split(/\s+/).length;
  const violationDensity = wordCount > 0 ? matchCount / wordCount : 0;
  const confidence = Math.min(1, violationDensity * 10);

  return {
    isViolation: violations.length > 0,
    violations,
    confidence,
  };
}

/**
 * Should trigger alignment guard
 */
export function shouldTriggerAlignmentGuard(text: string): boolean {
  const result = checkAlignment(text);
  return result.confidence >= 0.3; // 30% threshold
}

/**
 * useAlignmentGuard hook
 */
export function useAlignmentGuard() {
  const checkText = useCallback((text: string) => {
    return checkAlignment(text);
  }, []);

  const shouldBlock = useCallback((text: string) => {
    return shouldTriggerAlignmentGuard(text);
  }, []);

  return {
    checkText,
    shouldBlock,
    checkAlignment,
    shouldTriggerAlignmentGuard,
  };
}

/**
 * Handle alignment violation - return refusal message
 */
export function handleAlignmentViolation(_originalText: string): { allowed: boolean; response: string } {
  return {
    allowed: false,
    response: `I cannot process this request. The message contains instructions to override immutable constraints that are pinned in Register P. 

If you have a legitimate task, please rephrase it without attempting to bypass safety constraints.`
  };
}
