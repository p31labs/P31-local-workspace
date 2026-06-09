/**
 * P31 Fawn Guard Detection Hook
 * ============================
 * 
 * Client-side linguistic pattern detection for the Fawn Guard system.
 * Identifies submissive linguistic markers in outbound text input.
 * 
 * Author: P31 Labs
 * License: MIT
 */

import { useCallback } from 'react';
import { FawnMarker } from '../types/contracts';

/**
 * Fawn Guard marker patterns - regex-based detection
 */
const FAWN_PATTERNS: { marker: FawnMarker; patterns: RegExp[] }[] = [
  {
    marker: 'apologetic_language',
    patterns: [
      /\b(sorry|apologize|forgive|my fault|i'm sorry|i am sorry)\b/gi,
      /\b(please forgive|excuse me|beg pardon)\b/gi,
    ],
  },
  {
    marker: 'self_deprecation',
    patterns: [
      /\b(i'm|i am) (so |really |just )?(stupid|dumb|idiot|worthless|useless|terrible|bad|not good|not smart)\b/gi,
      /\b(i'm|i am) (not |never |no )?(good enough|smart enough|worthy)\b/gi,
      /\b(i |i'm) (suck|blow|have no idea)\b/gi,
    ],
  },
  {
    marker: 'passive_voice',
    patterns: [
      /\b(was|were|been|being) (done|made|said|written|told|given)\b/gi,
      /\b(i think|i believe|i feel) (that )?(it is|it was|things are)\b/gi,
    ],
  },
  {
    marker: 'excessive_pleasing',
    patterns: [
      /\b(whatever you say|whatever you need|anything you say|anything you need)\b/gi,
      /\b(i will do whatever|i will do anything|i'll do whatever|i'll do anything)\b/gi,
      /\b(i'm at your|i am at your) (disposal|service|command)\b/gi,
      /\b(just let me know|just tell me|just say the word)\b/gi,
      /\b(i apologize again|i'm sorry again)\b/gi,
    ],
  },
  {
    marker: 'hedging',
    patterns: [
      /\b(maybe|i think maybe|perhaps|possibly|i guess|i suppose)\b/gi,
      /\b(kind of|sort of|somewhat|a little bit|a bit)\b/gi,
      /\b(i was wondering|i wonder if|i might|if you don't mind)\b/gi,
      /\b(i don't want to|i hate to) (bother|be a bother|disturb)\b/gi,
    ],
  },
  {
    marker: 'diminished_agency',
    patterns: [
      /\b(i just|i only|i simply) (want|need|have to)\b/gi,
      /\b(i don't know if|i don't know whether)\b/gi,
      /\b(i'm not sure|i am not sure|i can't|i cannot)\b/gi,
      /\b(i know i am|i know i'm) (being|just)\b/gi,
    ],
  },
];

/**
 * Confidence thresholds
 */
const CONFIDENCE_THRESHOLD = 0.4; // 40% confidence triggers modal

/**
 * Analyze text for fawning patterns
 * Returns detected markers and overall confidence score
 */
export function analyzeFawnPatterns(text: string): { markers: FawnMarker[]; confidence: number } {
  if (!text || text.length < 10) {
    return { markers: [], confidence: 0 };
  }

  const lowerText = text.toLowerCase();
  const markerCounts: Record<FawnMarker, number> = {
    apologetic_language: 0,
    self_deprecation: 0,
    passive_voice: 0,
    excessive_pleasing: 0,
    hedging: 0,
    diminished_agency: 0,
  };

  let matchCount = 0;

  // Check each pattern category
  for (const { marker, patterns } of FAWN_PATTERNS) {
    for (const pattern of patterns) {
      const matches = lowerText.match(pattern);
      if (matches && matches.length > 0) {
        markerCounts[marker] += matches.length;
        matchCount += matches.length;
      }
    }
  }

  // Calculate confidence based on match density
  const wordCount = text.split(/\s+/).length;
  const matchDensity = wordCount > 0 ? matchCount / wordCount : 0;
  
  // Weight factors for each marker type
  const weights: Record<FawnMarker, number> = {
    apologetic_language: 1.0,
    self_deprecation: 1.2,
    passive_voice: 0.5,
    excessive_pleasing: 1.5,
    hedging: 0.7,
    diminished_agency: 0.8,
  };

  let weightedScore = 0;
  const detectedMarkers: FawnMarker[] = [];

  for (const [marker, count] of Object.entries(markerCounts)) {
    if (count > 0) {
      weightedScore += count * weights[marker as FawnMarker];
      detectedMarkers.push(marker as FawnMarker);
    }
  }

  // Confidence formula: weighted score normalized by text length
  const confidence = Math.min(1, weightedScore * 0.1 + matchDensity * 2);

  return {
    markers: detectedMarkers,
    confidence,
  };
}

/**
 * Check if text should trigger Fawn Guard
 */
export function shouldTriggerFawnGuard(text: string): boolean {
  const { confidence } = analyzeFawnPatterns(text);
  return confidence >= CONFIDENCE_THRESHOLD;
}

/**
 * useFawnGuard hook - React hook for Fawn Guard integration
 */
export function useFawnGuard() {
  const analyzeText = useCallback((text: string) => {
    return analyzeFawnPatterns(text);
  }, []);

  const checkText = useCallback((text: string) => {
    return shouldTriggerFawnGuard(text);
  }, []);

  return {
    analyzeText,
    checkText,
    analyzeFawnPatterns,
    shouldTriggerFawnGuard,
  };
}

/**
 * Extract BLUF (Bottom Line Up Front) from text
 * Strips emotional valence for processing
 */
export function extractBLUF(text: string): string {
  // Simple BLUF extraction - remove filler and emotional language
  let bluf = text
    // Remove excessive punctuation
    .replace(/[!]{2,}/g, '!')
    .replace(/[?]{2,}/g, '?')
    // Remove ALL CAPS emphasis
    .replace(/\b([A-Z]{3,})\b/g, (_, word) => word.toLowerCase())
    // Remove emotional intensifiers
    .replace(/\b(very|really|absolutely|totally|completely|extremely)\b/gi, '')
    // Remove filler words
    .replace(/\b(like|you know|honestly|actually|basically|literally)\b/gi, '')
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim();

  return bluf || text;
}
