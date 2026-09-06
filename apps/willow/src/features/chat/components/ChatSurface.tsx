/**
 * ChatSurface.tsx — WILLOW child-friendly chat interface
 *
 * Research-backed: 64px touch targets for small hands, emoji-driven
 * pre-cognitive chips, warm color palette, age-appropriate language.
 * WCAG 2.5.5: touch targets >= 44px (64px here for children).
 * Crisis overlay handled by shell via <p31-crisis-overlay>.
 */

import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react';

interface Message {
  id: string;
  role: 'user' | 'willow';
  text: string;
  timestamp: Date;
}

interface ChipItem {
  label: string;
  emoji: string;
  response: string;
}

const DEFAULT_CHIPS: ChipItem[] = [
  { label: "I'm happy", emoji: '😊', response: "That makes me smile! Tell me more about what made you happy." },
  { label: "I'm sad", emoji: '😢', response: "I hear you. It's okay to feel sad. Would you like to talk about it?" },
  { label: "I'm tired", emoji: '😴', response: 'Rest is important. Maybe we can do something calm together?' },
  { label: 'Tell me a joke', emoji: '😂', response: 'Why did the scarecrow win an award? Because he was outstanding in his field! 🌾' },
  { label: 'I need help', emoji: '🆘', response: "I'm here. What do you need help with? You're not alone." },
];

const WILLOW_AVATAR = '\u{1F33F}';
const USER_AVATAR = '\u{1F9D2}';

export function ChatSurface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    if (messages.length === 0) {
      setMessages([
        {
          id: crypto.randomUUID(),
          role: 'willow',
          text: "Hi there! \u{1F44B} I'm Willow. How are you feeling today?",
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (role: Message['role'], text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role, text, timestamp: new Date() },
    ]);
  };

  const handleChip = (chip: ChipItem) => {
    if (isProcessing) return;
    addMessage('user', `${chip.emoji} ${chip.label}`);
    setIsProcessing(true);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setIsProcessing(false);
      addMessage('willow', chip.response);
    }, 1000 + Math.random() * 600);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    const text = input.trim();
    addMessage('user', text);
    setInput('');
    setIsProcessing(true);
    setIsTyping(true);
    const responses = [
      "That's really interesting! Tell me more.",
      'I understand. How does that make you feel?',
      "Thanks for sharing that with me. You're brave.",
      "Hmm, let me think about that... What do you think?",
      "That sounds important. I'm glad you told me.",
    ];
    const response = responses[Math.floor(Math.random() * responses.length)];
    setTimeout(() => {
      setIsTyping(false);
      setIsProcessing(false);
      addMessage('willow', response);
    }, 1200 + Math.random() * 600);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className="chat-surface"
      style={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--p31-surface-bg, var(--p31-void))',
        color: 'var(--p31-text-primary)',
        fontFamily: 'var(--p31-font-sans)',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--p31-space-sm)',
          padding: 'var(--p31-space-md) var(--p31-space-lg)',
          background: 'var(--p31-surface-card)',
          borderBottom: '1px solid var(--p31-surface-border)',
          minHeight: '64px',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--p31-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--p31-type-h2)',
            color: 'var(--p31-void-deep)',
          }}
        >
          {WILLOW_AVATAR}
        </div>
        <div>
          <h1
            style={{
              fontSize: 'var(--p31-type-h3)',
              fontWeight: 'var(--p31-weight-extrabold)',
              margin: 0,
              color: 'var(--p31-text-primary)',
            }}
          >
            Willow
          </h1>
          <p
            style={{
              fontSize: 'var(--p31-type-caption)',
              margin: 0,
              color: 'var(--p31-text-muted)',
            }}
          >
            Always here for you 💚
          </p>
        </div>
      </header>

      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: 'var(--p31-max-width-md)',
          width: '100%',
          margin: '0 auto',
          padding: 'var(--p31-space-md)',
        }}
      >
        <div
          className="chip-bar"
          role="group"
          aria-label="Quick feelings"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--p31-space-sm)',
            justifyContent: 'center',
            paddingBottom: 'var(--p31-space-md)',
            borderBottom: '1px solid var(--p31-surface-border)',
            marginBottom: 'var(--p31-space-md)',
          }}
        >
          {DEFAULT_CHIPS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => handleChip(chip)}
              disabled={isProcessing}
              aria-label={`Say: ${chip.label}`}
              data-mcp-tool="quickChip"
              data-mcp-type="action"
              data-mcp-target={`chip-${chip.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
              style={{
                minHeight: '64px',
                minWidth: '64px',
                padding: 'var(--p31-space-sm) var(--p31-space-md)',
                borderRadius: 'var(--p31-radius-full)',
                border: '2px solid var(--p31-surface-border)',
                background: 'var(--p31-surface-card)',
                color: 'var(--p31-text-primary)',
                fontSize: 'var(--p31-type-body)',
                fontWeight: 'var(--p31-weight-medium)',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--p31-space-xs)',
                transition: 'all var(--p31-duration-fast) var(--p31-easing-smooth)',
                opacity: isProcessing ? 0.5 : 1,
                fontFamily: 'var(--p31-font-sans)',
              }}
              onMouseEnter={(e) => {
                if (!isProcessing) {
                  e.currentTarget.style.borderColor = 'var(--p31-accent)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--p31-glow-cyan)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--p31-surface-border)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span style={{ fontSize: 'var(--p31-type-h3)', lineHeight: 1 }}>
                {chip.emoji}
              </span>
              <span>{chip.label}</span>
            </button>
          ))}
        </div>

        <div
          className="messages-container"
          role="log"
          aria-live="polite"
          aria-label="Chat with Willow"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--p31-space-sm)',
            minHeight: '200px',
            maxHeight: '50vh',
            overflowY: 'auto',
            padding: 'var(--p31-space-sm)',
            scrollBehavior: 'smooth',
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              role="article"
              aria-label={`${msg.role === 'user' ? 'You' : 'Willow'} said: ${msg.text}`}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--p31-space-xs)',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
              }}
            >
              {msg.role === 'willow' && (
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--p31-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--p31-type-label)',
                    flexShrink: 0,
                    color: 'var(--p31-void-deep)',
                  }}
                >
                  {WILLOW_AVATAR}
                </div>
              )}

              <div
                style={{
                  padding: 'var(--p31-space-sm) var(--p31-space-md)',
                  borderRadius:
                    msg.role === 'user'
                      ? 'var(--p31-radius-lg) var(--p31-radius-lg) var(--p31-radius-xs) var(--p31-radius-lg)'
                      : 'var(--p31-radius-lg) var(--p31-radius-lg) var(--p31-radius-lg) var(--p31-radius-xs)',
                  background: msg.role === 'user' ? 'var(--p31-accent)' : 'var(--p31-surface2)',
                  color: msg.role === 'user' ? 'var(--p31-void-deep)' : 'var(--p31-text-primary)',
                  fontSize: 'var(--p31-type-body)',
                  fontWeight: msg.role === 'user' ? 'var(--p31-weight-semibold)' : 'var(--p31-weight-normal)',
                  lineHeight: 'var(--p31-line-height-relaxed)',
                  wordBreak: 'break-word',
                }}
              >
                <div className="message-text">{msg.text}</div>
                <div
                  style={{
                    fontSize: 'var(--p31-type-caption)',
                    opacity: 0.5,
                    marginTop: 'var(--p31-space-xs)',
                    textAlign: msg.role === 'user' ? 'right' : 'left',
                  }}
                >
                  {formatTime(msg.timestamp)}
                </div>
              </div>

              {msg.role === 'user' && (
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--p31-surface2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--p31-type-label)',
                    flexShrink: 0,
                    color: 'var(--p31-text-muted)',
                  }}
                >
                  {USER_AVATAR}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div
              aria-hidden="true"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--p31-space-xs)',
                alignSelf: 'flex-start',
                padding: 'var(--p31-space-sm) var(--p31-space-md)',
                background: 'var(--p31-surface2)',
                borderRadius: 'var(--p31-radius-lg) var(--p31-radius-lg) var(--p31-radius-lg) var(--p31-radius-xs)',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--p31-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'var(--p31-type-label)',
                  flexShrink: 0,
                  color: 'var(--p31-void-deep)',
                }}
              >
                {WILLOW_AVATAR}
              </div>
              <div style={{ display: 'flex', gap: '4px', padding: 'var(--p31-space-xs)' }}>
                <span className="willow-dot" style={{ animationDelay: '0s' }} />
                <span className="willow-dot" style={{ animationDelay: '0.2s' }} />
                <span className="willow-dot" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          data-mcp-tool="chatForm"
          data-mcp-target="chat-input-form"
          style={{
            display: 'flex',
            gap: 'var(--p31-space-sm)',
            paddingTop: 'var(--p31-space-md)',
            borderTop: '1px solid var(--p31-surface-border)',
            marginTop: 'var(--p31-space-sm)',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isProcessing}
            aria-label="Type your message"
            data-mcp-tool="chatInput"
            data-mcp-target="chat-text-input"
            style={{
              flex: 1,
              minHeight: '64px',
              padding: 'var(--p31-space-sm) var(--p31-space-md)',
              borderRadius: 'var(--p31-radius-full)',
              background: 'var(--p31-surface-card)',
              border: '2px solid var(--p31-surface-border)',
              color: 'var(--p31-text-primary)',
              fontSize: 'var(--p31-type-body)',
              fontFamily: 'var(--p31-font-sans)',
              outline: 'none',
              transition: 'border-color var(--p31-duration-normal) var(--p31-easing-smooth)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--p31-accent)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--p31-surface-border)';
            }}
          />
          <button
            type="submit"
            disabled={isProcessing || !input.trim()}
            aria-label="Send message"
            data-mcp-tool="sendMessage"
            data-mcp-type="action"
            style={{
              minHeight: '64px',
              minWidth: '64px',
              padding: 'var(--p31-space-sm) var(--p31-space-lg)',
              borderRadius: 'var(--p31-radius-full)',
              background: 'var(--p31-accent)',
              color: 'var(--p31-void-deep)',
              fontWeight: 'var(--p31-weight-bold)',
              fontSize: 'var(--p31-type-label)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all var(--p31-duration-normal) var(--p31-easing-smooth)',
              opacity: isProcessing || !input.trim() ? 0.4 : 1,
              pointerEvents: isProcessing || !input.trim() ? 'none' : 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--p31-space-xs)',
            }}
          >
            Send
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>

        <p
          style={{
            fontSize: 'var(--p31-type-caption)',
            color: 'var(--p31-text-muted)',
            textAlign: 'center',
            paddingTop: 'var(--p31-space-md)',
            margin: 0,
          }}
        >
          Willow is here to listen 💚
        </p>
      </main>

      <style>{`
        .willow-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--p31-text-muted);
          animation: willowTyping 1.4s infinite ease-in-out both;
        }
        @keyframes willowTyping {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .willow-dot { animation: none; }
        }
      `}</style>
    </div>
  );
}
