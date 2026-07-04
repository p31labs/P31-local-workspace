/**
 * @file AnalyticsConsent.tsx — WCD-32.3: Opt-in Analytics Consent
 *
 * One-time consent dialog shown on first launch.
 * COPPA-compliant: blocked for kids mode.
 */

import { useState, useEffect } from 'react';
import { isTelemetryEnabled, setTelemetryEnabled } from '../../services/telemetry';
import { isKidsMode } from '../../services/telemetry';

const CONSENT_KEY = 'p31-analytics-consent';
const DISMISSED_KEY = 'p31-analytics-dismissed';

export function AnalyticsConsent() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if already consented or dismissed
    try {
      const consented = localStorage.getItem(CONSENT_KEY);
      const dismissed = localStorage.getItem(DISMISSED_KEY);

      // Don't show if already decided or in kids mode (COPPA)
      if (consented !== null || dismissed === '1' || isKidsMode()) {
        setLoading(false);
        return;
      }

      // Show after short delay
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    } catch {
      setLoading(false);
    }
  }, []);

  const handleAccept = () => {
    setTelemetryEnabled(true);
    try {
      localStorage.setItem(CONSENT_KEY, '1');
    } catch {}
    setShow(false);
  };

  const handleDecline = () => {
    setTelemetryEnabled(false);
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {}
    setShow(false);
  };

  if (loading || !show) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-void/90 backdrop-blur-sm">
      <div className="glass-panel p-6 max-w-md mx-4 rounded-lg border border-quantum-cyan/30">
        <h2 className="text-xl font-bold text-phosphor mb-4">
          Help Improve Spaceship Earth
        </h2>

        <div className="mb-6">
          <p className="text-gray-300 mb-3">
            We'd like to collect anonymous performance data to make the app better.
          </p>
          <ul className="text-gray-400 text-sm space-y-2">
            <li>• FPS and memory usage</li>
            <li>• Which features you use most</li>
            <li>• Device information (anonymous)</li>
          </ul>
          <p className="text-gray-500 text-sm mt-3">
            <strong>No personal data is collected.</strong> You can change this anytime in settings.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDecline}
            className="flex-1 py-2 px-4 border border-gray-600 rounded-lg text-gray-400
                       hover:border-gray-500 hover:text-white transition-colors"
          >
            Maybe Later
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 py-2 px-4 bg-phosphor/20 hover:bg-phosphor/30 
                       border border-phosphor/50 rounded-lg text-phosphor
                       transition-colors font-medium"
          >
            Help Improve
          </button>
        </div>
      </div>
    </div>
  );
}
