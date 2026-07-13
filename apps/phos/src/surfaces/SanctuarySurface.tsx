import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateAuthToken } from '../lib/did-auth';
import { createLoveToken, type LoveTokenReward } from '../lib/taler-client';
import useSanctuaryWS, { type SanctuaryMessage } from '../lib/useSanctuaryWS';

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

interface DisplayMessage {
  id: string;
  from: string;
  body: string;
  timestamp: number;
  isMine: boolean;
}

export function SanctuarySurface({ spoons }: { spoons: number }) {
  const [peerDid, setPeerDid] = useState('');
  const [myDid, setMyDid] = useState('');
  const [signingKey, setSigningKey] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emergencyContact] = useState<EmergencyContact>(DEFAULT_EMERGENCY);
  const [talerReward, setTalerReward] = useState<LoveTokenReward | null>(null);
  const [lastTokenClaim, setLastTokenClaim] = useState<number>(
    parseInt(localStorage.getItem('last_love_claim') || '0', 10)
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const roomId = myDid && peerDid
    ? `sanctuary-${[myDid, peerDid].sort().join('-')}`
    : 'sanctuary-pending';

  const {
    status: wsStatus,
    sendMessage: wsSend,
    joinRoom,
    isConnected,
  } = useSanctuaryWS({
    roomId,
    did: myDid,
    signingKey,
    peerDid,
    onMessage: useCallback((msg: SanctuaryMessage) => {
      if (msg.type === 'message' && msg.from && msg.body) {
        const m: DisplayMessage = {
          id: `${msg.timestamp}-${Math.random().toString(36).slice(2, 8)}`,
          from: msg.from,
          body: msg.body,
          timestamp: msg.timestamp || Date.now(),
          isMine: false,
        };
        setMessages((prev) => [...prev, m]);
      }
      if (msg.type === 'joined' && msg.peerDid) {
        setPeerDid(msg.peerDid);
      }
    }, []),
    onStatusChange: useCallback(() => {
      // connection status reflected via wsStatus
    }, []),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (peerDid && isConnected && myDid) {
      joinRoom(peerDid);
    }
  }, [peerDid, isConnected, myDid, joinRoom]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !myDid || !peerDid || !signingKey || !isConnected) return;
    setSending(true);
    setError(null);
    try {
      const msg: SanctuaryMessage = {
        type: 'message',
        from: myDid,
        to: peerDid,
        body: input.trim(),
        timestamp: Date.now(),
      };
      wsSend(msg);

      setMessages((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          from: myDid,
          body: input.trim(),
          timestamp: Date.now(),
          isMine: true,
        },
      ]);
      setInput('');

      const now = Date.now();
      if (now - lastTokenClaim > 86400000) {
        const edgeId = `edge:${[myDid, peerDid].sort().join(':')}`;
        try {
          const token = await generateAuthToken(myDid, signingKey, JSON.stringify({ action: 'claim_love', edgeId }));
          const reward = await createLoveToken(
            edgeId,
            'LOVE:0.10',
            'Successful co-parenting communication milestone',
            'https://phos.p31ca.org/sanctuary/reward',
            token
          );
          setTalerReward(reward);
          setLastTokenClaim(now);
          localStorage.setItem('last_love_claim', String(now));
        } catch (e) {
          console.warn('LOVE token claim deferred:', e);
        }
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  }, [input, myDid, peerDid, signingKey, isConnected, wsSend, lastTokenClaim]);

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
          <div className="p-4 border border-white/10 phos-glass rounded-lg space-y-2">
            <div className="text-sm font-mono text-red-300">{emergencyContact.name}</div>
            <div className="text-lg font-bold text-primary">{emergencyContact.phone}</div>
            <div className="text-[10px] font-mono opacity-60">{emergencyContact.relation}</div>
          </div>
          <p className="text-[10px] font-mono text-amber-400/60">
            Reach out when you have more spoons.
          </p>
        </div>
      </div>
    );
  }

  if (spoons <= 2) {
    return (
      <div className="flex flex-col h-full space-y-3">
        <div className="text-xs font-mono tracking-widest uppercase opacity-60 text-center shrink-0">
          SANCTUARY // Low Energy
        </div>

        <div className="flex gap-2 shrink-0">
          <input
            placeholder="Your DID"
            value={myDid}
            onChange={(e) => setMyDid(e.target.value)}
            className="flex-1 px-2 py-1 text-[10px] font-mono phos-bg/40 border border-emerald-500/20 rounded text-slate-200 placeholder-slate-600"
          />
          <input
            placeholder="Peer DID"
            value={peerDid}
            onChange={(e) => setPeerDid(e.target.value)}
            className="flex-1 px-2 py-1 text-[10px] font-mono phos-bg/40 border border-emerald-500/20 rounded text-slate-200 placeholder-slate-600"
          />
        </div>

        <div className="shrink-0">
          <input
            placeholder="Signing key (hex)"
            value={signingKey}
            onChange={(e) => setSigningKey(e.target.value)}
            type="password"
            className="w-full px-2 py-1 text-[10px] font-mono phos-bg/40 border border-emerald-500/20 rounded text-slate-200 placeholder-slate-600"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 min-h-0 border border-white/5 rounded-lg p-3 phos-bg/20">
          {messages.length === 0 ? (
            <p className="text-xs text-slate-500 text-center">No messages yet.</p>
          ) : (
            messages.slice(-10).map((m) => (
              <div key={m.id} className={`flex ${m.isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-2 rounded-lg text-xs ${
                  m.isMine
                    ? 'bg-emerald-900/30 border border-emerald-500/20 text-emerald-200'
                    : 'phos-surface/50 border border-slate-600/20 text-slate-200'
                }`}>
                  <p>{m.body}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2 shrink-0">
          <textarea
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            className="flex-1 px-3 py-2 text-xs font-mono phos-bg/40 border border-emerald-500/20 rounded text-slate-200 placeholder-slate-600 resize-none"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !input.trim() || !myDid || !peerDid || !signingKey || !isConnected}
            className="px-4 py-2 text-xs font-mono border border-emerald-500/30 rounded text-emerald-300 hover:bg-emerald-950/20 disabled:opacity-40"
          >
            {sending ? '…' : 'Send'}
          </button>
        </div>

        <div className="text-[9px] font-mono text-center shrink-0">
          <span className={isConnected ? 'text-emerald-400' : 'text-amber-400'}>
            {isConnected ? '● Connected' : '○ Connecting'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-3">
      <div className="flex justify-between items-center shrink-0">
        <div className="text-xs font-mono tracking-widest uppercase opacity-60">
          SANCTUARY // Secure Messaging
        </div>
        <span className={`text-[10px] font-mono ${isConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
          {isConnected ? '● Connected' : '○ Connecting'}
        </span>
      </div>

      <div className="flex gap-2 shrink-0">
        <input
          placeholder="Your DID"
          value={myDid}
          onChange={(e) => setMyDid(e.target.value)}
          className="flex-1 px-3 py-2 text-xs font-mono phos-bg/40 border border-emerald-500/20 rounded text-slate-200 placeholder-slate-600"
        />
        <input
          placeholder="Peer DID"
          value={peerDid}
          onChange={(e) => setPeerDid(e.target.value)}
          className="flex-1 px-3 py-2 text-xs font-mono phos-bg/40 border border-emerald-500/20 rounded text-slate-200 placeholder-slate-600"
        />
      </div>

      <div className="shrink-0">
        <input
          placeholder="Signing key (hex)"
          value={signingKey}
          onChange={(e) => setSigningKey(e.target.value)}
          type="password"
          className="w-full px-3 py-2 text-xs font-mono phos-bg/40 border border-emerald-500/20 rounded text-slate-200 placeholder-slate-600"
        />
      </div>

      {error && (
        <p className="text-red-400 text-xs shrink-0">{error}</p>
      )}

      <div className="flex-1 overflow-y-auto space-y-2 min-h-0 border border-white/5 rounded-lg p-3 phos-bg/20">
        {messages.length === 0 ? (
          <p className="text-xs text-slate-500 text-center">No messages yet. Start a conversation.</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-2 rounded-lg text-xs ${
                m.isMine
                  ? 'bg-emerald-900/30 border border-emerald-500/20 text-emerald-200'
                  : 'phos-surface/50 border border-slate-600/20 text-slate-200'
              }`}>
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[9px] opacity-50">
                    {new Date(m.timestamp).toLocaleTimeString()}
                  </span>
                  {m.isMine && (
                    <span className="text-[9px] text-emerald-400/60">sent</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 shrink-0">
        <textarea
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          className="flex-1 px-3 py-2 text-xs font-mono phos-bg/40 border border-emerald-500/20 rounded text-slate-200 placeholder-slate-600 resize-none"
        />
        <button
          onClick={sendMessage}
          disabled={sending || !input.trim() || !myDid || !peerDid || !signingKey || !isConnected}
          className="px-4 py-2 text-xs font-mono border border-emerald-500/30 rounded text-emerald-300 hover:bg-emerald-950/20 disabled:opacity-40"
        >
          {sending ? '…' : 'Send'}
        </button>
      </div>

      {talerReward && (
        <div className="shrink-0 p-3 border border-amber-500/30 bg-amber-950/10 rounded">
          <p className="text-amber-400 text-xs font-mono">LOVE Token Earned</p>
          <p className="text-slate-400 text-[10px] font-mono">
            {talerReward.amount} — Co-parenting milestone
          </p>
          {talerReward.payUrl && (
            <a
              href={talerReward.payUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-1 px-3 py-1 text-[10px] font-mono border border-emerald-500/30 rounded text-emerald-300 hover:bg-emerald-950/20"
            >
              Claim with Taler Wallet
            </a>
          )}
        </div>
      )}

      <div className="text-[9px] font-mono opacity-40 text-center shrink-0">
        End-to-end encrypted via WebSocket. All messages are cryptographically signed.
      </div>
    </div>
  );
}

export default SanctuarySurface;
