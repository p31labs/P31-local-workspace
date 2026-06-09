// spaceship-earth/src/components/BugReportButton.tsx
// Live bug reporting — floating button + slide-out form.
// Posts to spaceship-relay /bug-report endpoint.
import React, { useState, useCallback, useRef, useEffect } from 'react';

const RELAY = 'https://spaceship-relay.trimtab-signal.workers.dev';

interface Props {
  room: string;
  sessionId?: string;
}

export function BugReportButton({ room, sessionId }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [flash, setFlash] = useState<'ok' | 'err' | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [open]);

  // Auto-dismiss flash
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => {
      setFlash(null);
      if (flash === 'ok') setOpen(false);
    }, 1500);
    return () => clearTimeout(t);
  }, [flash]);

  const submit = useCallback(async () => {
    const desc = text.trim();
    if (!desc || sending) return;
    setSending(true);
    try {
      const viewport = `${window.innerWidth}x${window.innerHeight}@${devicePixelRatio}`;
      const res = await fetch(`${RELAY}/bug-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: desc, room, viewport, sessionId }),
      });
      if (res.ok) {
        setText('');
        setFlash('ok');
      } else {
        setFlash('err');
      }
    } catch {
      setFlash('err');
    } finally {
      setSending(false);
    }
  }, [text, room, sessionId, sending]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    }
    if (e.key === 'Escape') {
      setOpen(false);
    }
  }, [submit]);

  return (
    <>
      {/* Floating trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close bug report" : "Report a bug"}
        aria-expanded={open}
        className="glass-btn"
        style={{
          position: 'fixed',
          bottom: 68,
          right: 8,
          zIndex: 40,
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: open
            ? '1px solid rgba(255,68,102,0.5)'
            : '1px solid rgba(255,255,255,0.06)',
          background: open
            ? 'rgba(255,68,102,0.12)'
            : 'rgba(255,255,255,0.03)',
          color: open ? '#ff4466' : 'rgba(0,255,255,0.3)',
          fontSize: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          boxShadow: open ? '0 0 16px rgba(255,68,102,0.15)' : 'none',
        }}
      >
        {open ? '\u00d7' : '\u{1f41b}'}
      </button>

      {/* Report form */}
      {open && (
        <div className="glass-card accent-red" style={{
          position: 'fixed',
          bottom: 110,
          right: 8,
          zIndex: 40,
          width: 240,
          padding: 12,
          fontFamily: "'JetBrains Mono', monospace",
          animation: 'fadeInUp 0.25s ease-out both',
        }}>
          <div style={{
            fontSize: 10,
            letterSpacing: 2,
            color: '#ff4466',
            marginBottom: 8,
            textShadow: '0 0 8px rgba(255,68,102,0.2)',
          }}>
            BUG REPORT
          </div>
          <div style={{ fontSize: 9, color: 'rgba(0,255,255,0.2)', marginBottom: 8 }}>
            room: {room}
          </div>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="What happened?"
            rows={4}
            aria-label="Bug description"
            className="glass-input"
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <span style={{ fontSize: 8, color: 'rgba(0,255,255,0.15)' }}>
              {flash === 'ok' ? 'sent!' : flash === 'err' ? 'failed' : '\u2318+Enter to send'}
            </span>
            <button
              type="button"
              onClick={submit}
              disabled={sending || !text.trim()}
              className="glass-btn"
              style={{
                padding: '5px 12px',
                color: flash === 'ok' ? '#00FFFF' : flash === 'err' ? '#ff4466' : '#00FFFF',
                fontSize: 10,
                letterSpacing: 1,
                opacity: sending || !text.trim() ? 0.4 : 1,
              }}
            >
              {sending ? 'SENDING...' : flash === 'ok' ? 'SENT' : 'SEND'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
