/**
 * @file QualitySettings.tsx — Auto-detect quality dialog for WCD-28.5
 *
 * Appears when FPS drops below critical threshold.
 * Offers to enable low-quality mode automatically.
 *
 * Privacy: No PII collected. COPPA-compliant (kids mode blocks).
 */

import { useEffect, useState, useCallback } from 'react';
import { performanceMonitor } from '../../services/performanceMonitor';

const QUALITY_PREFERENCE_KEY = 'p31-quality-preference';
const QUALITY_PROMPT_COUNT_KEY = 'p31-quality-prompt-count';

type QualityLevel = 'high' | 'medium' | 'low' | 'auto';

interface QualitySettingsProps {
  onClose: () => void;
  onQualityChange: (level: QualityLevel) => void;
}

export function QualitySettings({ onClose, onQualityChange }: QualitySettingsProps) {
  const [fps, setFps] = useState(0);
  const [promptCount, setPromptCount] = useState(0);

  useEffect(() => {
    // Load prompt count
    try {
      const count = parseInt(localStorage.getItem(QUALITY_PROMPT_COUNT_KEY) || '0', 10);
      setPromptCount(count);
    } catch {
      // localStorage not available
    }

    // Get current FPS
    const metrics = performanceMonitor.getMetrics();
    if (metrics) {
      setFps(metrics.fps);
    }

    // Listen for critical performance events
    const handleCritical = () => {
      setFps(performanceMonitor.getMetrics()?.fps || 0);
    };
    window.addEventListener('p31:perf:critical', handleCritical);

    return () => {
      window.removeEventListener('p31:perf:critical', handleCritical);
    };
  }, []);

  const handleEnableLowQuality = useCallback(() => {
    try {
      localStorage.setItem(QUALITY_PREFERENCE_KEY, 'low');
      localStorage.setItem(QUALITY_PROMPT_COUNT_KEY, String(promptCount + 1));
    } catch {
      // localStorage not available
    }
    onQualityChange('low');
    onClose();
  }, [onClose, onQualityChange, promptCount]);

  const handleDismiss = useCallback(() => {
    try {
      localStorage.setItem(QUALITY_PROMPT_COUNT_KEY, String(promptCount + 1));
    } catch {
      // localStorage not available
    }
    onClose();
  }, [onClose, promptCount]);

  const handleAutoMode = useCallback(() => {
    try {
      localStorage.setItem(QUALITY_PREFERENCE_KEY, 'auto');
    } catch {
      // localStorage not available
    }
    onQualityChange('auto');
    onClose();
  }, [onClose, onQualityChange]);

  // Don't show if we've prompted too many times
  if (promptCount >= 3) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-void/80 backdrop-blur-sm">
      <div className="glass-panel p-6 max-w-md mx-4 rounded-lg border border-quantum-cyan/30">
        <h2 className="text-xl font-bold text-phosphor mb-4">
          Performance Notice
        </h2>

        <div className="mb-6">
          <p className="text-gray-300 mb-2">
            Your device is running at <span className="text-quantum-cyan font-bold">{fps} FPS</span>,
            which is below the optimal range.
          </p>
          <p className="text-gray-400 text-sm">
            Enabling low-quality mode will reduce visual effects to maintain smooth performance.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleEnableLowQuality}
            className="w-full py-3 px-4 bg-quantum-cyan/20 hover:bg-quantum-cyan/30 
                       border border-quantum-cyan/50 rounded-lg text-quantum-cyan
                       transition-colors font-medium"
          >
            Enable Low Quality Mode
          </button>

          <button
            onClick={handleAutoMode}
            className="w-full py-3 px-4 bg-phosphor/10 hover:bg-phosphor/20 
                       border border-phosphor/30 rounded-lg text-phosphor
                       transition-colors font-medium"
          >
            Use Auto Quality (Recommended)
          </button>

          <button
            onClick={handleDismiss}
            className="w-full py-2 px-4 text-gray-500 hover:text-gray-400
                       transition-colors text-sm"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to auto-show quality settings dialog when FPS drops critically.
 * Must be used within React context.
 */
export function useQualitySettings() {
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    // Check if user has already chosen a quality level
    try {
      const preference = localStorage.getItem(QUALITY_PREFERENCE_KEY);
      if (preference === 'low' || preference === 'medium') {
        return; // User already set preference
      }
    } catch {
      // localStorage not available
    }

    const handleCritical = () => {
      setShowDialog(true);
    };

    window.addEventListener('p31:perf:critical', handleCritical);

    return () => {
      window.removeEventListener('p31:perf:critical', handleCritical);
    };
  }, []);

  const handleQualityChange = useCallback((level: QualityLevel) => {
    // Emit event for other components to adjust
    window.dispatchEvent(new CustomEvent('p31:quality:change', { detail: { level } }));
  }, []);

  return {
    showDialog,
    QualityDialog: showDialog ? (
      <QualitySettings
        onClose={() => setShowDialog(false)}
        onQualityChange={handleQualityChange}
      />
    ) : null,
  };
}
