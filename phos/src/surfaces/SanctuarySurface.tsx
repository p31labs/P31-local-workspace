import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateAuthToken } from '../lib/did-auth';

const K4_CORE = 'https://k4-core.trimtab-signal.workers.dev';
const POLL_INTERVAL = 5000;

interface Message {
  id: string;
  fromDid: string;
  toDid: string;
  body: string;
  timestamp: number;
  read: boolean;
}

interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

const DEFAULT_EMERGENCY: EmergencyContact = {
  name: 'Emergency Services',
  phone: '911',
  relation: 'Emergency',
};

export function SanctuarySurface({ spoons }: { spoons: number }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [myDid, setMyDid] = useState('');
  const [peerDid, setPeerDid] = useState('');
  const [signingKey, setSigningKey] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emergencyContact, _setEmergencyContact] = useState<EmergencyContact>(DEFAULT_EMERGENCY);
  const pollRef = useRef<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    if (!myDid || !signingKey) return;
    try {
      const token = await generateAuthToken(myDid, signingKey);
      const res = await fetch(`${K4_CORE}/sanctuary/messages?did=${encodeURIComponent(myDid)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch {
      // silent fail -- poll will retry
    }
  }, [myDid, signingKey]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !myDid || !peerDid || !signingKey) return;
    setSending(true);
    setError(null);
    try {
      const token = await generateAuthToken(myDid, signingKey, JSON.stringify({ body: input.trim(), toDid: peerDid }));
      const res = await fetch(`${K4_CORE}/sanctuary/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fromDid: myDid, toDid: peerDid, body: input.trim() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setInput('');
      await fetchMessages();
    } catch (e: any) {
      setError(e?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  }, [input, myDid, peerDid, signingKey, fetchMessages]);

  useEffect(() => {
    if (myDid) {
      fetchMessages();
      pollRef.current = window.setInterval(fetchMessages, POLL_INTERVAL);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [myDid, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (spoons <= 1) {
    return (
      <div className="space-y-4 w-full">
        <div className="text-xs font-mono tracking-widest uppercase opacity-60 text-center">
          SANCTUARY // Emergency
        </div>
        <div className="p-6 border border-red-500/30 bg-red-950/10 rounded-xl text-center space-y-4">
          <div className="text-lg font-bold text-red-400">Low Spoon Mode</div>
          <p className="text-xs text-slate-300">
            Messaging hidden to conserve energy. Emergency contacts shown below.
          </p>
          <div className="p-4 border border-white/10 bg-white/5 rounded-lg space-y-2">
            <div className="text-sm font-mono text-red-300">{emergencyContact.name}</div>
            <div className="text-lg font-bold text-white">{emergencyContact.phone}</div>
            <div className="text-[10px] font-mono opacity-60">{emergencyContact.relation}</div>
          </div>
          <p className="text-[10px] font-mono text-amber-400/60">
            Reach out when you have more spoons.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-3">
      <div className="text-xs font-mono tracking-widest uppercase opacity-60 text-center shrink-0">
        SANCTUARY // Secure Messaging
      </div>

      <div className="flex gap-2 shrink-0">
        <input
          placeholder="Your DID"
          value={myDid}
          onChange={(e) => setMyDid(e.target.value)}
          className="flex-1 px-2 py-1 text-[10px] font-mono bg-black/40 border border-emerald-500/20 rounded text-slate-200 placeholder-slate-600"
        />
        <input
          placeholder="Peer DID"
          value={peerDid}
          onChange={(e) => setPeerDid(e.target.value)}
          className="flex-1 px-2 py-1 text-[10px] font-mono bg-black/40 border border-emerald-500/20 rounded text-slate-200 placeholder-slate-600"
        />
      </div>

      <div className="shrink-0">
        <input
          placeholder="Signing key (hex)"
          value={signingKey}
          onChange={(e) => setSigningKey(e.target.value)}
          type="password"
          className="w-full px-2 py-1 text-[10px] font-mono bg-black/40 border border-emerald-500/20 rounded text-slate-200 placeholder-slate-600"
        />
      </div>

      {error && (
        <p className="text-red-400 text-xs shrink-0">{error}</p>
      )}

      <div className="flex-1 overflow-y-auto space-y-2 min-h-0 border border-white/5 rounded-lg p-3 bg-black/20">
        {messages.length === 0 ? (
          <p className="text-xs text-slate-500 text-center">No messages yet.</p>
        ) : (
          messages.map((m) => {
            const isMine = m.fromDid === myDid;
            return (
              <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-2 rounded-lg text-xs ${
                  isMine
                    ? 'bg-emerald-900/30 border border-emerald-500/20 text-emerald-200'
                    : 'bg-slate-800/50 border border-slate-600/20 text-slate-200'
                }`}>
                  <p>{m.body}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[9px] opacity-50">{new Date(m.timestamp).toLocaleTimeString()}</span>
                    {isMine && (
                      <span className={`text-[9px] ml-2 ${m.read ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {m.read ? 'read' : 'sent'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 shrink-0">
        <textarea
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          className="flex-1 px-3 py-2 text-xs font-mono bg-black/40 border border-emerald-500/20 rounded text-slate-200 placeholder-slate-600 resize-none"
        />
        <button
          onClick={sendMessage}
          disabled={sending || !input.trim() || !myDid || !peerDid || !signingKey}
          className="px-4 py-2 text-xs font-mono border border-emerald-500/30 rounded text-emerald-300 hover:bg-emerald-950/20 disabled:opacity-40"
        >
          {sending ? '...' : 'Send'}
        </button>
      </div>

      <div className="text-[9px] font-mono opacity-40 text-center shrink-0">
        End-to-end encrypted. All messages are cryptographically signed.
      </div>
    </div>
  );
}

export default SanctuarySurface;
