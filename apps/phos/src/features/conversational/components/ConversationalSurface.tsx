/**
 * @file ConversationalSurface — PHOS zero-reading entry point.
 *
 * Research-backed: pre-cognitive action chips ABOVE the input bar
 * eliminate blank-page paralysis. Limited to 5 chips (W3C Cognitive
 * Accessibility guidance). Touch targets: 48px min (WCAG 2.5.5).
 * Crisis overlay handled by the shell via <p31-crisis-overlay>.
 */

import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react';
import { ChipBar, type Chip } from '../../../../src/components/ChipBar';

const DEFAULT_CHIPS: Chip[] = [
  { label: 'Check spoons', action: 'spoons', icon: '🥄' },
  { label: 'Grounding', action: 'grounding', icon: '🧘' },
  { label: 'Log care proof', action: 'care-proof', icon: '📝' },
  { label: 'LOVE balance', action: 'love', icon: '❤️' },
  { label: 'Ask anything', action: 'chat', icon: '💬' },
];

const CHIP_RESPONSES: Record<string, string> = {
  spoons: "I'm checking your spoon energy... How are you feeling right now?",
  grounding: "Let's ground together. Take a slow breath in... and out. Notice five things you can see.",
  'care-proof': "I'm logging a care proof moment. What did you notice about your care today?",
  love: 'Your LOVE balance is growing. Every act of care — for yourself or others — adds to the ledger.',
  chat: "I'm here. What's on your mind?",
};

const STAGE_MESSAGES: Record<string, string> = {
  thinking: 'Thinking...',
  searching: 'Searching...',
  drafting: 'Drafting reply...',
};

interface Message {
  id: string;
  role: 'user' | 'system';
  text: string;
  timestamp: Date;
}

type ProcessingStage = 'idle' | 'thinking' | 'searching' | 'drafting';

export function ConversationalSurface() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stage, setStage] = useState<ProcessingStage>('idle');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
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

  const handleChip = (action: string) => {
    if (isProcessing) return;
    const label = DEFAULT_CHIPS.find((c) => c.action === action)?.label || action;
    const response = CHIP_RESPONSES[action] || `Processing "${action}"...`;

    addMessage('user', `[${label}]`);
    setIsProcessing(true);
    setError(null);
    setStage('thinking');

    const stageTimeline: Array<{ ms: number; stage: ProcessingStage }> = [
      { ms: 400, stage: 'searching' },
      { ms: 800, stage: 'drafting' },
    ];
    stageTimeline.forEach(({ ms, stage: s }) => {
      setTimeout(() => setStage(s), ms);
    });

    setTimeout(() => {
      setStage('idle');
      setIsProcessing(false);
      addMessage('system', response);
    }, 1200 + Math.random() * 300);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    const text = input.trim();
    addMessage('user', text);
    setInput('');
    setError(null);
    setIsProcessing(true);
    setStage('thinking');

    const stageTimeline: Array<{ ms: number; stage: ProcessingStage }> = [
      { ms: 500, stage: 'searching' },
      { ms: 1000, stage: 'drafting' },
    ];
    stageTimeline.forEach(({ ms, stage: s }) => {
      setTimeout(() => setStage(s), ms);
    });

    setTimeout(() => {
      setStage('idle');
      setIsProcessing(false);
      const responses = [
        `You said: "${text}". I'm processing that... How can I help further?`,
        `That's interesting. Tell me more about "${text}".`,
        `Got it. Let me think about "${text}" for a moment.`,
      ];
      addMessage('system', responses[Math.floor(Math.random() * responses.length)]);
    }, 1500 + Math.random() * 400);
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

  const getStageLabel = (s: ProcessingStage): string => {
    return STAGE_MESSAGES[s] || '...';
  };

  return (
    <div
      className="conversational-surface"
      data-mcp-tool="conversationalSurface"
      data-mcp-state="ready"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--p31-space-lg)',
        background: 'var(--p31-surface-bg, var(--p31-void))',
        color: 'var(--p31-text-primary)',
      }}
    >
      <main
        data-mcp-tool="conversationRegion"
        data-mcp-target="phos-conversation"
        style={{
          width: '100%',
          maxWidth: 'var(--p31-max-width-md)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--p31-space-lg)',
        }}
      >
        <h1
          style={{
            fontSize: 'var(--p31-type-h1)',
            fontWeight: 'var(--p31-weight-extrabold)',
            lineHeight: 'var(--p31-line-height-tight)',
            textAlign: 'center',
            margin: 0,
            color: 'var(--p31-text-primary)',
          }}
        >
          What do you need right now?
        </h1>

        <ChipBar chips={DEFAULT_CHIPS} onChipClick={handleChip} disabled={isProcessing} />

        {messages.length > 0 && (
          <div
            className="conversation-canvas"
            role="log"
            aria-live="polite"
            aria-label="Conversation with PHOS assistant"
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--p31-space-xs)',
              maxHeight: '50vh',
              minHeight: '120px',
              overflowY: 'auto',
              padding: 'var(--p31-space-md)',
              background: 'var(--p31-surface-card)',
              borderRadius: 'var(--p31-radius-lg)',
              border: '1px solid var(--p31-surface-border)',
              scrollBehavior: 'smooth',
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                role="article"
                aria-label={`${msg.role === 'user' ? 'You' : 'Assistant'} said: ${msg.text}`}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: 'var(--p31-space-sm) var(--p31-space-md)',
                  borderRadius:
                    msg.role === 'user'
                      ? 'var(--p31-radius-lg) var(--p31-radius-lg) var(--p31-radius-xs) var(--p31-radius-lg)'
                      : 'var(--p31-radius-lg) var(--p31-radius-lg) var(--p31-radius-lg) var(--p31-radius-xs)',
                  background: msg.role === 'user' ? 'var(--p31-accent)' : 'var(--p31-surface2)',
                  color: msg.role === 'user' ? 'var(--p31-void-deep)' : 'var(--p31-text-primary)',
                  fontSize: 'var(--p31-type-body)',
                  fontWeight: msg.role === 'user' ? 'var(--p31-weight-semibold)' : 'var(--p31-weight-normal)',
                  lineHeight: 'var(--p31-line-height-normal)',
                  wordBreak: 'break-word',
                  boxShadow: msg.role === 'user' ? 'var(--p31-glow-cyan)' : 'none',
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
            ))}

            {isProcessing && (
              <div
                aria-hidden="true"
                role="status"
                style={{
                  alignSelf: 'flex-start',
                  padding: 'var(--p31-space-sm) var(--p31-space-md)',
                  background: 'var(--p31-surface2)',
                  borderRadius: 'var(--p31-radius-lg) var(--p31-radius-lg) var(--p31-radius-lg) var(--p31-radius-xs)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--p31-space-sm)',
                }}
              >
                <span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span className="typing-dot" style={{ animationDelay: '0s' }} />
                  <span className="typing-dot" style={{ animationDelay: '0.2s' }} />
                  <span className="typing-dot" style={{ animationDelay: '0.4s' }} />
                </span>
                <span
                  style={{
                    fontSize: 'var(--p31-type-caption)',
                    color: 'var(--p31-text-muted)',
                    fontStyle: 'italic',
                  }}
                >
                  {getStageLabel(stage)}
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {error && (
          <div
            role="alert"
            style={{
              width: '100%',
              padding: 'var(--p31-space-sm) var(--p31-space-md)',
              borderRadius: 'var(--p31-radius-md)',
              background: 'var(--p31-glass-surface)',
              border: '1px solid var(--p31-semantic-error)',
              color: 'var(--p31-semantic-error)',
              fontSize: 'var(--p31-type-caption)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              aria-label="Dismiss error"
              data-mcp-tool="dismissError"
              data-mcp-target="conversation-error"
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: 'var(--p31-type-body)',
                padding: 'var(--p31-space-xs)',
              }}
            >
              ✕
            </button>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          data-mcp-tool="conversationForm"
          data-mcp-target="phos-chat-form"
          style={{
            width: '100%',
            display: 'flex',
            gap: 'var(--p31-space-sm)',
            alignItems: 'center',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type or speak..."
            disabled={isProcessing}
            aria-label="Type your message"
            data-mcp-tool="conversationInput"
            data-mcp-target="phos-text-input"
            style={{
              flex: 1,
              minHeight: 'var(--p31-touch-target, 48px)',
              padding: 'var(--p31-space-sm) var(--p31-space-md)',
              borderRadius: 'var(--p31-radius-full)',
              background: 'var(--p31-surface-card)',
              border: '1px solid var(--p31-surface-border)',
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
            data-mcp-tool="sendPhosMessage"
            data-mcp-type="action"
            style={{
              minHeight: 'var(--p31-touch-target, 48px)',
              minWidth: 'var(--p31-touch-target, 48px)',
              padding: 'var(--p31-space-sm) var(--p31-space-md)',
              borderRadius: 'var(--p31-radius-full)',
              background: 'var(--p31-accent)',
              color: 'var(--p31-void-deep)',
              fontWeight: 'var(--p31-weight-bold)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all var(--p31-duration-normal) var(--p31-easing-smooth)',
              opacity: isProcessing || !input.trim() ? 0.4 : 1,
              pointerEvents: isProcessing || !input.trim() ? 'none' : 'auto',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            margin: 0,
            paddingTop: 'var(--p31-space-xs)',
          }}
        >
          No pressure. Take your time.
        </p>
      </main>

      <style>{`
        .typing-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--p31-text-muted);
          animation: typingBounce 1.4s infinite ease-in-out both;
        }
        @keyframes typingBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .typing-dot { animation: none; }
        }
      `}</style>
    </div>
  );
}
