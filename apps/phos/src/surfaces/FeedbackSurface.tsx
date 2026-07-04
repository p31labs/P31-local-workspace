import React, { useState, useEffect, useCallback } from 'react';

const EVIDENCE_VAULT = 'https://sovereign-justice-evidence.trimtab-signal.workers.dev';

interface FeedbackEntry {
  id: string;
  type: string;
  severity: string | null;
  title: string;
  description: string;
  status: string;
  chain_hash: string;
  created_at: string;
  screenshot_key: string | null;
}

const TYPES = [
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'question', label: 'Question' },
  { value: 'praise', label: 'Praise' },
  { value: 'report', label: 'Other' },
];

const SEVERITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

function getAnonymousId(): string {
  let id: string | null = null;
  try { id = localStorage.getItem('feedback_anonymous_id'); } catch {}
  if (!id) {
    id = crypto.randomUUID();
    try { localStorage.setItem('feedback_anonymous_id', id); } catch {}
  }
  return id;
}

interface FeedbackSurfaceProps {
  isGuest?: boolean;
  spoons?: number;
}

export function FeedbackSurface({ isGuest = false, spoons = 3 }: FeedbackSurfaceProps) {
  const [type, setType] = useState('bug');
  const [severity, setSeverity] = useState('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotKey, setScreenshotKey] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackList, setFeedbackList] = useState<FeedbackEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [expungingId, setExpungingId] = useState<string | null>(null);

  const aid = getAnonymousId();

  const fetchFeedback = useCallback(async () => {
    try {
      const res = await fetch(`${EVIDENCE_VAULT}/api/feedback/list?anonymous_id=${aid}`);
      if (res.ok) {
        const data = await res.json();
        setFeedbackList(data.feedback || []);
      }
    } catch {}
  }, [aid]);

  useEffect(() => {
    if (aid) fetchFeedback();
  }, [aid, fetchFeedback]);

  const handleScreenshot = async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      const res = await fetch(`${EVIDENCE_VAULT}/api/feedback/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name }),
      });
      if (!res.ok) throw new Error('Failed to get upload URL');
      const { uploadUrl, screenshotKey: key } = await res.json();
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!putRes.ok) throw new Error('Upload failed');
      setScreenshotKey(key);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    }
    setIsUploading(false);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`${EVIDENCE_VAULT}/api/feedback/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          severity,
          title: title.trim(),
          description: description.trim(),
          screenshot_key: screenshotKey,
          anonymous_id: aid,
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Submission failed');
      }
      const data = await res.json();
      setSuccessMsg(`Submitted. Chain: ${data.chainHash?.slice(0, 16)}...`);
      setTitle('');
      setDescription('');
      setScreenshotKey(null);
      setScreenshotFile(null);
      fetchFeedback();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed');
    }
    setIsSubmitting(false);
  };

  const handleExpunge = async (feedbackId: string) => {
    setExpungingId(feedbackId);
    setError(null);
    try {
      const res = await fetch(`${EVIDENCE_VAULT}/api/feedback/expunge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackId, action: 'redact', anonymous_id: aid }),
      });
      if (!res.ok) throw new Error('Expunge failed');
      fetchFeedback();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Expunge failed');
    }
    setExpungingId(null);
  };

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto">
      <div>
        <h2 className="text-sm font-light tracking-wider text-[var(--phos-primary)]/80">Feedback</h2>
        <p className="text-[10px] font-light tracking-wider text-[var(--phos-mute)] mt-1">
          Your reports are cryptographically chained and court-admissible.
          You own your data — you can expunge it at any time, and the chain stays intact.
        </p>
      </div>

      {error && (
        <div className="phos-glass px-4 py-2 rounded-lg text-xs text-red-400/80 border border-red-400/20">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="phos-glass px-4 py-2 rounded-lg text-xs text-green-400/80 border border-green-400/20">
          {successMsg}
        </div>
      )}

      <div className="phos-glass rounded-xl p-4 space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-[10px] font-mono text-[var(--phos-mute)] mb-1">Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full bg-[var(--phos-card)] text-[var(--phos-text)] text-xs border border-[var(--phos-border)] rounded-lg px-3 py-2"
            >
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          {spoons > 1 && (
            <div className="flex-1">
              <label className="block text-[10px] font-mono text-[var(--phos-mute)] mb-1">Severity</label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value)}
                className="w-full bg-[var(--phos-card)] text-[var(--phos-text)] text-xs border border-[var(--phos-border)] rounded-lg px-3 py-2"
              >
                {SEVERITIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-mono text-[var(--phos-mute)] mb-1">Title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-[var(--phos-card)] text-[var(--phos-text)] text-xs border border-[var(--phos-border)] rounded-lg px-3 py-2"
            placeholder="Brief summary"
          />
        </div>

        {spoons > 1 && (
          <div>
            <label className="block text-[10px] font-mono text-[var(--phos-mute)] mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-[var(--phos-card)] text-[var(--phos-text)] text-xs border border-[var(--phos-border)] rounded-lg px-3 py-2 resize-none"
              placeholder="Steps to reproduce, expected behavior, actual behavior..."
            />
          </div>
        )}

        {spoons > 2 && (
          <div>
            <label className="block text-[10px] font-mono text-[var(--phos-mute)] mb-1">Screenshot (optional)</label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) { setScreenshotFile(f); handleScreenshot(f); }
                }}
                className="text-xs text-[var(--phos-mute)] file:mr-2 file:px-3 file:py-1 file:rounded-lg file:border file:border-[var(--phos-border)] file:bg-[var(--phos-card)] file:text-xs file:text-[var(--phos-text)] hover:file:bg-white/5"
              />
              {isUploading && <span className="text-[10px] text-[var(--phos-mute)]">Uploading...</span>}
              {screenshotKey && <span className="text-[10px] text-green-400/60">✓ Attached</span>}
            </div>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !title.trim() || !description.trim()}
          className="px-6 py-2 rounded-lg bg-[var(--phos-primary)] text-[var(--phos-bg)] text-xs font-medium hover:opacity-80 transition-opacity disabled:opacity-30"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </div>

      {feedbackList.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[10px] font-mono text-[var(--phos-mute)] tracking-wider">
            Previous Feedback ({feedbackList.length})
          </h3>
          {feedbackList.map(entry => (
            <div key={entry.id} className="phos-glass rounded-lg px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/5 text-[var(--phos-mute)]">
                    {entry.type}
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    entry.status === 'expunged' ? 'bg-red-400/10 text-red-400/60' :
                    entry.status === 'resolved' ? 'bg-green-400/10 text-green-400/60' :
                    'bg-white/5 text-[var(--phos-mute)]'
                  }`}>
                    {entry.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-[var(--phos-mute)]/50">
                    {entry.chain_hash?.slice(0, 8)}...
                  </span>
                  {entry.status !== 'expunged' && (
                    <button
                      onClick={() => handleExpunge(entry.id)}
                      disabled={expungingId === entry.id}
                      className="text-[9px] font-mono text-red-400/40 hover:text-red-400/80 transition-colors"
                    >
                      {expungingId === entry.id ? '...' : 'expunge'}
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs font-light text-[var(--phos-text)]/80">{entry.title}</p>
              {entry.status !== 'expunged' && entry.description && (
                <p className="text-[10px] font-light text-[var(--phos-mute)] mt-1 line-clamp-2">{entry.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
