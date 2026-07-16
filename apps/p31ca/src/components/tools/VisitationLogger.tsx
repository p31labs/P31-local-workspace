import React, { useState, useEffect, useRef } from 'react';
import { saveVisitLog, getVisitLogs, generateId, VisitLog } from '../../lib/tetrahedron/db';

export function VisitationLogger() {
  const [logs, setLogs] = useState<VisitLog[]>([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    duration: '',
    supervisor: '',
    childrenState: '',
    deviations: '',
    reaction: '',
  });
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    loadLogs();
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, []);

  const loadLogs = async () => {
    const stored = await getVisitLogs(30);
    setLogs(stored);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.duration) return;
    const newLog: VisitLog = {
      id: generateId(),
      date: form.date,
      duration: parseInt(form.duration, 10),
      supervisor: form.supervisor,
      childrenState: form.childrenState,
      deviations: form.deviations,
      reaction: form.reaction,
      audioBlob: audioBlob ?? undefined,
      createdAt: Date.now(),
    };
    await saveVisitLog(newLog);
    await loadLogs();
    setForm({ date: new Date().toISOString().slice(0, 10), duration: '', supervisor: '', childrenState: '', deviations: '', reaction: '' });
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (err) {
      console.warn('Microphone not available:', err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <h2 style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 14, color: '#cda852', marginBottom: 24 }}>
        Visitation Logger
      </h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <label style={labelStyle}>
            Date
            <input type="date" name="date" value={form.date} onChange={handleChange} required style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Duration (min)
            <input type="number" name="duration" value={form.duration} onChange={handleChange} required min="1" style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Supervisor
            <input type="text" name="supervisor" value={form.supervisor} onChange={handleChange} style={inputStyle} />
          </label>
        </div>

        <label style={labelStyle}>
          Children's State
          <textarea name="childrenState" value={form.childrenState} onChange={handleChange} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
        </label>

        <label style={labelStyle}>
          Deviations from Plan
          <textarea name="deviations" value={form.deviations} onChange={handleChange} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
        </label>

        <label style={labelStyle}>
          Your Reaction
          <textarea name="reaction" value={form.reaction} onChange={handleChange} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
        </label>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={recording ? stopRecording : startRecording}
            style={{ ...btnStyle, background: recording ? '#cc6247' : 'rgba(77,184,168,0.3)' }}>
            {recording ? '⏹ Stop Recording' : '🎤 Voice Memo'}
          </button>
          {audioUrl && (
            <audio controls src={audioUrl} style={{ height: 36, maxWidth: 240 }} />
          )}
          <button type="submit" style={{ ...btnStyle, background: '#cda852', color: '#0A0A0F', fontWeight: 600 }}>
            Save Log
          </button>
        </div>
      </form>

      <div style={{ marginTop: 32 }}>
        <h3 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(232,230,227,0.4)', marginBottom: 12 }}>
          Recent Logs ({logs.length})
        </h3>
        {logs.length === 0 && (
          <p style={{ fontSize: 11, color: 'rgba(232,230,227,0.2)' }}>No logs yet.</p>
        )}
        {logs.map(log => (
          <div key={log.id} style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <strong>{log.date}</strong>
              <span style={{ color: 'rgba(232,230,227,0.4)' }}>{log.duration} min</span>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(232,230,227,0.5)' }}>
              Supervisor: {log.supervisor || 'N/A'}
            </div>
            {log.audioBlob && <div style={{ fontSize: 10, color: '#00F0FF' }}>🎤 Voice memo attached</div>}
            {log.deviations && (
              <div style={{ fontSize: 11, color: '#cc6247', marginTop: 4 }}>⚠️ {log.deviations}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const baseInput: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '8px 10px',
  marginTop: 4,
  borderRadius: 6,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.03)',
  color: '#e8e6e3',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 12,
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  color: 'rgba(232,230,227,0.5)',
  flex: '1 1 180px',
};

const inputStyle: React.CSSProperties = { ...baseInput, minWidth: 160 };

const btnStyle: React.CSSProperties = {
  padding: '10px 20px',
  border: 'none',
  borderRadius: 6,
  background: 'rgba(255,255,255,0.08)',
  color: '#e8e6e3',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11,
  cursor: 'pointer',
};
