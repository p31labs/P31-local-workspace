import { useState, useEffect, useCallback } from 'react';
import { useShipStore } from '../store/shipStore';
import { useSessionMetrics } from '../hooks/useSessionMetrics';

const SESSION_MIN_MINUTES = 2;
const STORAGE_KEY = 'p31-session-surveys';

interface SurveyResponse {
  timestamp: number;
  spoons: number;
  rating: number;
}

export default function SessionSurvey() {
  const [visible, setVisible] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { getMetrics } = useSessionMetrics();

  const checkEligibility = useCallback(() => {
    if (dismissed || submitted) return;
    const spoons = useShipStore.getState().spoons;
    if (spoons < 3) return;
    const metrics = getMetrics();
    const minutes = (Date.now() - metrics.sessionStart) / 60000;
    if (minutes >= SESSION_MIN_MINUTES) {
      setVisible(true);
    }
  }, [dismissed, submitted, getMetrics]);

  useEffect(() => {
    checkEligibility();
    const unsub = useShipStore.subscribe(() => checkEligibility());
    return unsub;
  }, [checkEligibility]);

  const handleSubmit = () => {
    if (rating === null) return;
    const spoons = useShipStore.getState().spoons;
    const response: SurveyResponse = {
      timestamp: Date.now(),
      spoons,
      rating,
    };
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      existing.push(response);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(-50)));
    } catch {
      // storage unavailable
    }
    setSubmitted(true);
    setVisible(false);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="survey-overlay" onClick={handleDismiss}>
      <div className="survey-panel" onClick={(e) => e.stopPropagation()}>
        <div className="survey-header">
          <h3 className="survey-title">How did that feel?</h3>
          <button className="survey-close" onClick={handleDismiss} aria-label="Dismiss survey">✕</button>
        </div>
        <p className="survey-prompt">Rate your experience (1 = overwhelming, 5 = just right)</p>
        <div className="survey-ratings">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              className={`survey-btn${rating === n ? ' selected' : ''}`}
              onClick={() => setRating(n)}
              aria-label={`Rate ${n}`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="survey-actions">
          <button className="survey-submit" disabled={rating === null} onClick={handleSubmit}>
            Submit
          </button>
        </div>
        {submitted && <p className="survey-thanks">Thanks for the feedback.</p>}
      </div>
    </div>
  );
}
