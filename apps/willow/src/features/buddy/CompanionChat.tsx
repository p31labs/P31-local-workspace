/**
 * @file CompanionChat.tsx — WILLOW companion "Buddy" (genesis).
 * Posts to workers/willow-chat ("Star Buddy") with optimistic bubbles +
 * graceful local fallback to the keyword responder if the worker is unreachable.
 */

import { useRef, useState, useEffect } from 'react';
import { GlassCard } from '@p31ca/ui/chrome';
import { useWillowStore, MOODS } from '../../store/willowStore';
import { WillowChipBar } from '../../components/WillowChipBar';

const WILLLOW_CHAT_URL = 'https://willow-safety.trimtab-signal.workers.dev/chat';

const COMPANION_RESPONSES: Record<string, string[]> = {
  happy: ['That makes me so happy to hear! 🌟', 'You’re glowing today ✨', 'Amazing — what made it so good?'],
  tired: ['Rest is important, you know? 💚', 'Even the moon needs to rest sometimes 🌙', 'Maybe the Portal can help — it’s really calming 🌬️'],
  sad: ['I’m right here with you 💚', 'It’s okay to feel that way. Want to draw it out?', 'You’re not alone. I remember you last felt this way and you got through it 🌱'],
  angry: ['That sounds really hard. I hear you 💚', 'Want to tell me more? I’m listening 👂', 'Sometimes music helps — want to make some noise in the Music Maker? 🥁'],
  default: ['Tell me more! 💬', 'I’m listening 💚', 'That’s really interesting!', 'How does that make you feel?'],
};

function localReply(msg: string, mood: string): string {
  const lower = msg.toLowerCase();
  let pool = COMPANION_RESPONSES.default;
  if (lower.includes('happy') || lower.includes('good') || lower.includes('great')) pool = COMPANION_RESPONSES.happy;
  else if (lower.includes('tired') || lower.includes('sleep') || lower.includes('exhausted')) pool = COMPANION_RESPONSES.tired;
  else if (lower.includes('sad') || lower.includes('cry') || lower.includes('miss') || lower.includes('alone')) pool = COMPANION_RESPONSES.sad;
  else if (lower.includes('angry') || lower.includes('mad') || lower.includes('hate') || lower.includes('unfair')) pool = COMPANION_RESPONSES.angry;
  else if (mood === 'rainy' || mood === 'stormy') pool = COMPANION_RESPONSES.sad;
  else if (mood === 'rainbow' || mood === 'sunny') pool = COMPANION_RESPONSES.happy;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function CompanionChat() {
  const { messages, addMessage, mood, age } = useWillowStore();
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || pending) return;
    addMessage(text, 'user');
    setInput('');
    setPending(true);
    try {
      const res = await fetch(WILLLOW_CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json().catch(() => null);
      const reply = data?.content || data?.text || localReply(text, mood);
      addMessage(reply, 'buddy');
    } catch {
      addMessage(localReply(text, mood), 'buddy');
    } finally {
      setPending(false);
    }
  };

  const handleChipSelect = (text: string) => {
    setInput(text);
    setTimeout(() => send(), 300);
  };

  const curMood = MOODS.find((m) => m.id === mood);
  const childMode = (age ?? 10) <= 9;
  const quick = childMode
    ? ['I’m happy 😊', 'I’m sad 😢', 'I’m tired 😴', 'Tell me a joke!']
    : ['Tell me something cool', 'I need to vent', 'I’m stressed', 'What should I do?'];

  return (
    <div className="flex flex-col h-full gap-2.5 animate-[fadeUp_0.22s_ease-out]" data-mcp-tool="companionChat" data-mcp-state={messages.length > 0 ? 'hasMessages' : 'empty'}>
      <GlassCard className="flex items-center gap-2 p-2 flex-shrink-0" style={{ background: 'rgba(52,211,153,0.05)', borderColor: 'rgba(52,211,153,0.12)' }}>
        <span style={{ fontSize: 18 }}>🌿</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600 }}>Willow</div>
          <div style={{ fontSize: 10, color: 'var(--p31-text-secondary)' }}>Sensing: {curMood?.emoji} {curMood?.label} · {childMode ? 'Child mode 🌱' : 'Youth mode 🌿'}</div>
        </div>
      </GlassCard>

      <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-0.5">
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '80%', padding: '10px 14px',
              borderRadius: msg.from === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              background: msg.from === 'user' ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${msg.from === 'user' ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.07)'}`,
            }}>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: msg.from === 'user' ? 'var(--p31-accent)' : 'var(--p31-text-primary)' }}>{msg.text}</div>
              <div style={{ fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 9, color: 'var(--p31-text-secondary)', marginTop: 4 }}>{msg.ts}</div>
            </div>
          </div>
        ))}
        {pending && <div style={{ fontSize: 11, color: 'var(--p31-text-tertiary)', paddingLeft: 4 }}>Willow is thinking… 💭</div>}
        <div ref={endRef} />
      </div>

      <div className="flex gap-1.5 flex-wrap flex-shrink-0" data-mcp-tool="quickReplyGroup" data-mcp-target="quick-replies">
        {quick.map((r) => (
          <button key={r} onClick={() => setInput(r)} data-mcp-tool="quickReply" data-mcp-type="action" data-mcp-target={`quick-reply-${r}`} data-mcp-state={input === r ? 'active' : 'inactive'} style={{ padding: '5px 10px', borderRadius: 20, border: '1px solid rgba(52,211,153,0.2)', background: 'rgba(52,211,153,0.05)', color: 'rgba(52,211,153,0.8)', fontSize: 11, cursor: 'pointer' }}>{r}</button>
        ))}
      </div>

      <WillowChipBar onSelect={handleChipSelect} />

      <div className="flex gap-2 flex-shrink-0">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={childMode ? 'Type to Willow… 💚' : 'What\'s on your mind? 💚'}
          rows={2}
          className="flex-1 p-2.5 resize-none text-[13px] leading-relaxed rounded-xl"
          style={{ minHeight: 64 }}
          data-mcp-tool="chatInput"
          data-mcp-type="input"
          data-mcp-target="chat-textarea"
        />
        <button
          onClick={send}
          disabled={!input.trim() || pending}
          data-mcp-tool="sendMessage"
          data-mcp-type="action"
          data-mcp-target="send-button"
          style={{ minWidth: 64, minHeight: 64, borderRadius: 12, border: '1px solid rgba(52,211,153,0.35)', background: 'rgba(52,211,153,0.1)', color: 'var(--p31-accent)', fontSize: 20, opacity: input.trim() && !pending ? 1 : 0.4, transition: 'opacity 0.15s', alignSelf: 'flex-end', cursor: 'pointer' }}
          aria-label="Send message"
        >💬</button>
      </div>
    </div>
  );
}
