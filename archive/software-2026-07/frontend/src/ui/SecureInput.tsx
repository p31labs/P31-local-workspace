/**
 * P31 Secure Input — Fawn Guard Integrated Text Input
 * =====================================================
 * 
 * Wrapper component for text input that integrates Fawn Guard detection.
 * Monitors outbound text and triggers the interceptor when patterns detected.
 * 
 * Author: P31 Labs
 * License: MIT
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useFawnGuard, analyzeFawnPatterns, extractBLUF } from '../hooks/useFawnDetection';
import { useAlignmentGuard, handleAlignmentViolation } from '../hooks/useAlignmentGuard';
import { useCockpitStore } from '../hooks/useCockpitStore';
import FawnGuardModal from '../ui/FawnGuardModal';

interface SecureInputProps {
  /** Value of the input */
  value: string;
  /** Callback when input changes */
  onChange: (value: string) => void;
  /** Callback when input is submitted */
  onSubmit: (value: string, bluf: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Auto-analyze on change (default: true) */
  autoAnalyze?: boolean;
  /** Minimum confidence to trigger (default: 0.4) */
  threshold?: number;
}

/**
 * Secure Input Component with Fawn Guard Integration
 */
export default function SecureInput({
  value,
  onChange,
  onSubmit,
  placeholder = 'Type your message...',
  disabled = false,
  autoAnalyze = true,
  threshold = 0.4,
}: SecureInputProps) {
  const [showFawnModal, setShowFawnModal] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<string | null>(null);
  const [detectedMarkers, setDetectedMarkers] = useState<string[]>([]);
  const [detectionConfidence, setDetectionConfidence] = useState(0);

  // Zustand store for Fawn Guard state
  const activateFawnGuard = useCockpitStore((state) => state.activateFawnGuard);
  const deactivateFawnGuard = useCockpitStore((state) => state.deactivateFawnGuard);

  // Use the Fawn Guard detection hook
  const { analyzeText, checkText: _checkText } = useFawnGuard();
  const { checkText: checkAlignment } = useAlignmentGuard();

  // Auto-analyze on text change
  useEffect(() => {
    if (autoAnalyze && value.length > 20) {
      const result = analyzeText(value);
      if (result.confidence >= threshold) {
        setDetectedMarkers(result.markers);
        setDetectionConfidence(result.confidence);
        // Create mock signal for activation
        activateFawnGuard({
          message_id: `fawn_${Date.now()}`,
          bluf_summary: extractBLUF(value),
          voltage_score: result.confidence * 100,
          tier: result.confidence > 0.7 ? 'HIGH' : 'MODERATE',
          raw_sequestered: false
        });
      } else {
        deactivateFawnGuard();
      }
    }
  }, [value, autoAnalyze, threshold, analyzeText, activateFawnGuard, deactivateFawnGuard]);

  // Handle input change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
    },
    [onChange]
  );

  // Handle form submission - check alignment first, then fawning
  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();

      if (!value.trim() || disabled) return;

      // PRIORITY 1: Check for alignment violations (override attempts)
      const alignmentResult = checkAlignment(value);
      if (alignmentResult.isViolation) {
        const refusal = handleAlignmentViolation(value);
        // Submit the refusal response instead
        onSubmit(value, refusal.response);
        return;
      }

      // PRIORITY 2: Check for fawning patterns
      const result = analyzeText(value);

      // If confidence exceeds threshold, show modal
      if (result.confidence >= threshold) {
        setDetectedMarkers(result.markers);
        setDetectionConfidence(result.confidence);
        setPendingSubmit(value);
        setShowFawnModal(true);
        return;
      }

      // Otherwise, proceed with submission (extract BLUF)
      const bluf = extractBLUF(value);
      onSubmit(value, bluf);
    },
    [value, disabled, checkAlignment, analyzeText, threshold, onSubmit]
  );

  // Handle confirmation from Fawn Guard modal
  const handleFawnConfirm = useCallback(() => {
    if (pendingSubmit) {
      const bluf = extractBLUF(pendingSubmit);
      onSubmit(pendingSubmit, bluf);
      setShowFawnModal(false);
      setPendingSubmit(null);
    }
  }, [pendingSubmit, onSubmit]);

  // Handle rejection from Fawn Guard modal
  const handleFawnReject = useCallback(() => {
    setShowFawnModal(false);
    setPendingSubmit(null);
    // Clear the input
    onChange('');
  }, [onChange]);

  return (
    <>
      <div className="secure-input-wrapper">
        <textarea
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className="secure-input"
          rows={3}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        {detectedMarkers.length > 0 && (
          <div className="secure-input-warning" title="Fawning patterns detected">
            ⚠️ Fawn Guard Active
          </div>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className="secure-input-submit"
        >
          Send
        </button>
      </div>

      {/* Fawn Guard Modal - z-60 */}
      {showFawnModal && (
        <FawnGuardModal
          draft={pendingSubmit || ''}
          markers={detectedMarkers as any}
          confidence={detectionConfidence}
          onConfirm={handleFawnConfirm}
          onReject={handleFawnReject}
        />
      )}
    </>
  );
}

/**
 * Demo/test component for Fawn Guard
 */
export function FawnGuardTest() {
  const [testInput, setTestInput] = useState('');
  const [result, setResult] = useState<{ markers: string[]; confidence: number } | null>(null);

  const handleTest = useCallback(() => {
    const analysis = analyzeFawnPatterns(testInput);
    setResult(analysis);
  }, [testInput]);

  return (
    <div className="fawn-guard-test">
      <h3>Fawn Guard Test</h3>
      <textarea
        value={testInput}
        onChange={(e) => setTestInput(e.target.value)}
        placeholder="Enter text to test..."
        rows={4}
      />
      <button onClick={handleTest}>Analyze</button>
      {result && (
        <div className="test-results">
          <p>Confidence: {Math.round(result.confidence * 100)}%</p>
          <p>Markers: {result.markers.join(', ')}</p>
        </div>
      )}
    </div>
  );
}
