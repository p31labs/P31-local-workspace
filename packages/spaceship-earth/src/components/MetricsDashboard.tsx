import { useState, useEffect, useCallback } from 'react';
import { useShipStore } from '../store/shipStore';
import { useSessionMetrics } from '../hooks/useSessionMetrics';

const DB_NAME = 'p31-session-metrics';
const STORE_NAME = 'sessions';
const SURVEY_KEY = 'p31-session-surveys';
const MAX_HISTORY = 10;

interface SessionMetrics {
  ttfi: number | null;
  spoonTransitions: { from: number; to: number; timestamp: number }[];
  undoCount: number;
  sessionStart: number;
  sessionEnd: number | null;
  restEntries: { timestamp: number; duration: number | null }[];
}

interface SurveyResponse {
  timestamp: number;
  spoons: number;
  rating: number;
}

export default function MetricsDashboard() {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<SessionMetrics[]>([]);
  const [surveys, setSurveys] = useState<SurveyResponse[]>([]);
  const { getMetrics } = useSessionMetrics();
  const spoons = useShipStore((s) => s.spoons);

  const loadData = useCallback(async () => {
    let sessions: SessionMetrics[] = [];
    try {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result);
      });
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const all = await new Promise<any[]>((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      sessions = all.sort((a, b) => b.sessionStart - a.sessionStart).slice(0, MAX_HISTORY);
      db.close();
    } catch {
      // IndexedDB unavailable
    }

    let surveyData: SurveyResponse[] = [];
    try {
      const raw = localStorage.getItem(SURVEY_KEY);
      if (raw) surveyData = JSON.parse(raw);
    } catch {
      // localStorage unavailable
    }

    setHistory(sessions);
    setSurveys(surveyData);
  }, []);

  useEffect(() => {
    if (open) loadData();
  }, [open, loadData]);

  const current = getMetrics();
  const sessionMinutes = current.sessionEnd
    ? (current.sessionEnd - current.sessionStart) / 60000
    : (Date.now() - current.sessionStart) / 60000;

  const avgRating = surveys.length > 0
    ? (surveys.reduce((s, r) => s + r.rating, 0) / surveys.length).toFixed(1)
    : '—';

  const ratingDist = [1, 2, 3, 4, 5].map(n => ({
    n,
    count: surveys.filter(s => s.rating === n).length,
  }));

  if (!open) return null;

  const barMax = Math.max(...ratingDist.map(r => r.count), 1);

  return (
    <div className="metrics-overlay" onClick={() => setOpen(false)}>
      <div className="metrics-panel" onClick={(e) => e.stopPropagation()}>
        <div className="metrics-header">
          <h3 className="metrics-title">Session Metrics</h3>
          <button className="metrics-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
        </div>

        <div className="metrics-body">
          <div className="metrics-section">
            <div className="metrics-section-title">Current Session</div>
            <div className="metrics-row">
              <span className="metrics-label">Duration</span>
              <span className="metrics-value">{sessionMinutes.toFixed(1)} min</span>
            </div>
            <div className="metrics-row">
              <span className="metrics-label">TTFI</span>
              <span className="metrics-value">{current.ttfi !== null ? `${(current.ttfi / 1000).toFixed(1)}s` : '—'}</span>
            </div>
            <div className="metrics-row">
              <span className="metrics-label">Spoon transitions</span>
              <span className="metrics-value">{current.spoonTransitions.length}</span>
            </div>
            <div className="metrics-row">
              <span className="metrics-label">Undo count</span>
              <span className="metrics-value">{current.undoCount}</span>
            </div>
            <div className="metrics-row">
              <span className="metrics-label">Rest entries</span>
              <span className="metrics-value">{current.restEntries.length}</span>
            </div>
          </div>

          <div className="metrics-section">
            <div className="metrics-section-title">Recent Sessions</div>
            {history.length === 0 && <div className="metrics-empty">No historical data yet.</div>}
            {history.map((s, i) => {
              const dur = s.sessionEnd
                ? ((s.sessionEnd - s.sessionStart) / 60000).toFixed(1)
                : '—';
              return (
                <div key={i} className="metrics-row">
                  <span className="metrics-label">{new Date(s.sessionStart).toLocaleDateString()}</span>
                  <span className="metrics-value">{dur} min · {s.undoCount} undos · {s.spoonTransitions.length} transitions</span>
                </div>
              );
            })}
          </div>

          <div className="metrics-section">
            <div className="metrics-section-title">Survey Feedback</div>
            <div className="metrics-row">
              <span className="metrics-label">Average rating</span>
              <span className="metrics-value">{avgRating} / 5</span>
            </div>
            <div className="metrics-chart">
              {ratingDist.map(r => (
                <div key={r.n} className="metrics-bar">
                  <div className="metrics-bar-label">{r.n}</div>
                  <div className="metrics-bar-track">
                    <div className="metrics-bar-fill" style={{ width: `${(r.count / barMax) * 100}%` }} />
                  </div>
                  <div className="metrics-bar-count">{r.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
