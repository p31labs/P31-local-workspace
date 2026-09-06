// Auto-generated from cli/component-registry.js
// Shared between CLI and Cloudflare Worker

export const COMPONENTS = [
  {
    "name": "GlassPanel",
    "description": "Glassmorphic elevated surface with backdrop blur. Use for cards, modals, drawers.",
    "tokens": [
      "glass-surface",
      "glass-border",
      "rounded.lg"
    ],
    "example": "<div className=\"phos-glass rounded-3xl p-6\">\n  {children}\n</div>"
  },
  {
    "name": "GlassCard",
    "description": "Compact glassmorphic card with padding. Use for list items, data tiles.",
    "tokens": [
      "glass-surface",
      "glass-border",
      "rounded.lg",
      "spacing.lg"
    ],
    "example": "<div className=\"phos-glass-card\">\n  <p className=\"text-[var(--phos-text)]\">{content}</p>\n</div>"
  },
  {
    "name": "PillButton",
    "description": "Rounded pill-shaped button. Use for mode switches, toggles, actions.",
    "tokens": [
      "quantum-cyan",
      "rounded.md",
      "spacing.sm",
      "spacing.lg"
    ],
    "example": "<button className=\"px-4 py-2 rounded-xl bg-[var(--phos-primary)] text-[var(--phos-bg)] font-bold\n  hover:translate-y-[-2px] transition-all duration-200 shadow-[0_4px_16px_rgba(0,240,255,0.2)]\">\n  {label}\n</button>"
  },
  {
    "name": "SpoonDots",
    "description": "Energy level indicator dots (0–5). Use in headers for spoon state display.",
    "tokens": [
      "quantum-cyan",
      "void"
    ],
    "example": "<div className=\"flex gap-2\">\n  {[0,1,2,3,4,5].map(sp => (\n    <button key={sp} onClick={() => onSet(sp)}\n      className=\"w-2.5 h-2.5 rounded-full transition-all duration-500\"\n      style={{\n        backgroundColor: level >= sp ? 'var(--phos-primary)' : 'rgba(255,255,255,0.1)',\n        boxShadow: level >= sp && level > 0 ? '0 0 6px var(--phos-primary)' : 'none',\n      }}\n      aria-label={\"Energy level \" + sp} />\n  ))}\n</div>"
  },
  {
    "name": "CrisisOverlay",
    "description": "Full-screen crisis mode overlay. ONLY rendered at spoons === 0. Hard invariant: no other UI chrome.",
    "tokens": [
      "void",
      "quantum-cyan"
    ],
    "example": "{spoons === 0 && <CrisisMode onExit={() => spoonsStore.set(3)} />}"
  },
  {
    "name": "Sidebar",
    "description": "Vertical icon sidebar for surface navigation. Hidden on mobile.",
    "tokens": [
      "glass-surface",
      "glass-border"
    ],
    "example": "<div className=\"w-16 md:w-20 z-30 flex-shrink-0 border-r border-white/5 bg-black/20 backdrop-blur-md\">\n  <PHOSSidebar surfaces={SURFACE_NAV} active={cs} onSelect={ss} spoons={s} />\n</div>"
  },
  {
    "name": "PromptBar",
    "description": "Chat input bar with send button. Use for message composition.",
    "tokens": [
      "glass-surface",
      "quantum-cyan",
      "rounded.md"
    ],
    "example": "<PHOSPromptBar onSend={handleSend} disabled={s === 0} />"
  },
  {
    "name": "SurfaceContent",
    "description": "Dynamic surface renderer. Routes to the correct surface component by ID.",
    "tokens": [],
    "example": "<SurfaceContent currentSurface={cs} setSurface={ss} spoons={s} theme={theme} isGuest={false} />"
  },
  {
    "name": "TetraHeader",
    "description": "Compact operator header with mesh status, quantum metadata, and spoon toggle. Use at top of dashboard surfaces.",
    "tokens": [
      "glass-border",
      "quantum-cyan",
      "quantum-green",
      "quantum-gold",
      "quantum-red",
      "text-tertiary",
      "font-mono"
    ],
    "example": "<header className=\"tetra-hdr glass-strong\" style={{ borderBottom: '1px solid var(--p31-glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--p31-spacing-lg)' }}>\n  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>\n    <div style={{ width: 28, height: 28, borderRadius: 'var(--p31-radius-md)', background: 'linear-gradient(135deg, var(--p31-accent-gold), var(--p31-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#000' }}>⬦</div>\n    <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '0.08em' }}>P31&nbsp;<span style={{ color: 'var(--p31-accent)' }}>TETRA</span></span>\n  </div>\n  <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'var(--p31-font-mono)', fontSize: 10 }}>\n    <span style={{ color: 'var(--p31-text-tertiary)' }}>β₂ = 1</span>\n    <span style={{ color: 'var(--p31-accent)' }}>863 Hz</span>\n    <span style={{ color: 'var(--p31-accent-green)' }}>K₄ planar</span>\n    <button onClick={() => onSpoonsChange((spoons + 1) % 6)} style={{ minHeight: 36, padding: '0 10px', gap: 5, display: 'flex', alignItems: 'center' }}>\n      <span style={{ color: spoons <= 1 ? 'var(--p31-accent-red)' : 'var(--p31-accent)' }}>⚡</span>\n      <span style={{ color: 'var(--p31-text-primary)' }}>{spoons}</span><span style={{ color: 'var(--p31-text-tertiary)' }}>/5</span>\n    </button>\n  </div>\n</header>"
  },
  {
    "name": "ControlsPanel",
    "description": "Dev menu panel with spoons slider, scene toggle, and live skin preview grid.",
    "tokens": [
      "text-secondary",
      "text-tertiary",
      "quantum-cyan",
      "quantum-red",
      "quantum-gold",
      "font-mono",
      "glass-border"
    ],
    "example": "<div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 11 }}>\n  <div>\n    <div style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>Spoons</div>\n    <input type=\"range\" min={0} max={5} value={spoons} onChange={(e) => onSpoonsChange(Number(e.target.value))} data-mcp-tool=\"setSpoonLevel\" data-mcp-type=\"input\" data-mcp-range=\"0,5\" data-mcp-current={String(spoons)} style={{ flex: 1, accentColor: spoons <= 1 ? '#fb7185' : '#00f0ff' }} />\n  </div>\n  <div>\n    <div style={{ fontSize: 9, color: 'rgba(240,242,245,0.3)', letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase' }}>Scene</div>\n    <div style={{ display: 'flex', gap: 4 }}>\n      {['tetra','posner','cradle'].map(s => (\n        <button key={s} onClick={() => onSceneChange(s)} style={{ flex: 1, padding: '5px 0', borderRadius: 6, border: `1px solid ${scene === s ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.08)'}`, background: scene === s ? 'rgba(251,191,36,0.1)' : 'transparent', color: scene === s ? '#fbbf24' : 'rgba(240,242,245,0.4)', fontSize: 10, cursor: 'pointer' }}>{s === 'tetra' ? 'K₄' : s === 'posner' ? 'Posner' : '🌌'}</button>\n      ))}\n    </div>\n  </div>\n</div>"
  },
  {
    "name": "VertexRegistry",
    "description": "Expandable vertex card list with status chips and Sierpinski invariant footer.",
    "tokens": [
      "glass-surface",
      "glass-border",
      "quantum-cyan",
      "quantum-violet",
      "quantum-gold",
      "quantum-green",
      "quantum-red",
      "text-tertiary",
      "font-mono"
    ],
    "example": "<div className=\"tetra-left\">\n  <div className=\"tetra-pi\">\n    <div className=\"tetra-label\">Vertex Registry</div>\n    {vertices.map(v => (\n      <button key={v.id} onClick={() => toggle(v.id)} className={`vbtn ${openDetail === v.id ? 'active' : ''}`} aria-expanded={openDetail === v.id}>\n        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>\n          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>\n            <span className=\"dot\" style={{ background: ACCENT_VAR[v.accent], boxShadow: `0 0 7px ${ACCENT_VAR[v.accent]}` }} />\n            <span className=\"font-mono\" style={{ fontSize: 9, color: ACCENT_VAR[v.accent], letterSpacing: '0.1em' }}>V{v.id}</span>\n          </div>\n          <span className=\"chip\" style={{ background: v.alive ? 'rgba(52,211,153,.1)' : 'rgba(251,113,133,.1)', border: `1px solid ${v.alive ? 'rgba(52,211,153,.2)' : 'rgba(251,113,133,.2)'}` }}>\n            {v.alive ? '● live' : '○ down'}\n          </span>\n        </div>\n        <div style={{ fontWeight: 700, fontSize: 12 }}>{v.host}</div>\n        <div className=\"text-muted\" style={{ fontSize: 10, marginTop: 2 }}>{v.role}</div>\n      </button>\n    ))}\n  </div>\n</div>"
  },
  {
    "name": "SynthPanel",
    "description": "Neuro-acoustic synth with binaural 863 Hz tone, frequency and amplitude sliders. Disabled at spoons ≤ 1.",
    "tokens": [
      "quantum-cyan",
      "quantum-violet",
      "quantum-red",
      "glass-border",
      "font-mono"
    ],
    "example": "<div data-mcp-tool=\"synthPanel\" data-mcp-state={isPlaying ? 'playing' : 'stopped'} style={{ padding: 'var(--p31-spacing-md)', borderRadius: 'var(--p31-radius-lg)', background: 'rgba(0,240,255,.04)', border: '1px solid rgba(0,240,255,.1)' }}>\n  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>\n    <span style={{ fontSize: 11, fontFamily: 'var(--p31-font-mono)', color: 'var(--p31-text-secondary)' }}>863 Hz · +7 Hz α</span>\n    <button onClick={onToggle} disabled={spoons <= 1} data-mcp-tool=\"toggleSynth\" data-mcp-type=\"action\" data-mcp-state={isPlaying ? 'playing' : 'stopped'} style={{ padding: '4px 10px', borderRadius: 7, fontFamily: 'var(--p31-font-mono)', fontSize: 9, cursor: spoons <= 1 ? 'not-allowed' : 'pointer', background: isPlaying ? 'rgba(251,113,133,.12)' : 'rgba(0,240,255,.1)', border: `1px solid ${isPlaying ? 'rgba(251,113,133,.3)' : 'rgba(0,240,255,.25)'}`, color: isPlaying ? 'var(--p31-accent-red)' : 'var(--p31-accent)', opacity: spoons <= 1 ? 0.4 : 1 }}>\n      {isPlaying ? '⏹ STOP' : '▶ START'}\n    </button>\n  </div>\n  <input type=\"range\" min={100} max={1500} value={frequency} disabled={spoons <= 1} onChange={(e) => onFrequencyChange(Number(e.target.value))} data-mcp-tool=\"setFrequency\" data-mcp-type=\"input\" data-mcp-range=\"100,1500\" data-mcp-current={String(frequency)} style={{ width: '100%', accentColor: 'var(--p31-accent)' }} aria-label=\"Resonance frequency\" />\n  <input type=\"range\" min={0} max={100} value={amplitude} disabled={spoons <= 1} onChange={(e) => onAmplitudeChange(Number(e.target.value))} data-mcp-tool=\"setAmplitude\" data-mcp-type=\"input\" data-mcp-range=\"0,100\" data-mcp-current={String(amplitude)} style={{ width: '100%', accentColor: 'var(--p31-accent-violet)' }} aria-label=\"Amplitude\" />\n</div>"
  },
  {
    "name": "NotificationToast",
    "description": "Severity-aware toast notification with icon, title, message, and dismiss action.",
    "tokens": [
      "glass-surface",
      "glass-border",
      "quantum-cyan",
      "quantum-green",
      "quantum-gold",
      "quantum-red",
      "text-primary",
      "text-secondary"
    ],
    "example": "<div role=\"status\" aria-live={severity === 'error' ? 'assertive' : 'polite'} className=\"glass-panel\" style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '9px 11px', borderRadius: 'var(--p31-radius-lg)', borderColor: sev.accent, boxShadow: `0 0 18px ${sev.accent}22`, minWidth: 240, maxWidth: 340 }}>\n  <i className={`fa-solid ${sev.icon}`} style={{ color: sev.accent, fontSize: 12, marginTop: 1 }} aria-hidden=\"true\" />\n  <div style={{ flex: 1, minWidth: 0 }}>\n    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--p31-text-primary)', letterSpacing: '0.02em' }}>{title}</div>\n    {message && <div style={{ fontSize: 10, color: 'var(--p31-text-secondary)', marginTop: 2, lineHeight: 1.45 }}>{message}</div>}\n  </div>\n  <button onClick={onDismiss} aria-label=\"Dismiss notification\" style={{ minHeight: 0, minWidth: 0, padding: '0 6px', height: 22, fontSize: 10, flexShrink: 0 }}>✕</button>\n</div>"
  },
  {
    "name": "WillowStarfield",
    "description": "Lightweight canvas starfield for willow skin. Gentle floating particles with spoon-aware density.",
    "tokens": [
      "quantum-green",
      "void"
    ],
    "example": "<canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />\n{spoons === 0 && ctx.clearRect(0, 0, c.width, c.height)}"
  },
  {
    "name": "WillowCrisisOverlay",
    "description": "Breathing circle crisis overlay for willow skin. Shows at spoons === 0 with 4-4-6 pattern.",
    "tokens": [
      "quantum-green",
      "void",
      "text-primary"
    ],
    "example": "{spoons === 0 && (\n  <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28 }}>\n    <div className=\"breathe-el\" style={{ width: 130, height: 130, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.25), rgba(52,211,153,0.04))', border: '2px solid rgba(52,211,153,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🌿</div>\n    <div style={{ textAlign: 'center' }}>\n      <div style={{ fontFamily: 'var(--w-mono)', fontSize: 10, letterSpacing: '0.2em', color: 'rgba(52,211,153,0.55)', marginBottom: 8 }}>QUIET MODE</div>\n      <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.45)', fontWeight: 300 }}>Breathe with me 🌬️</div>\n      <div style={{ fontFamily: 'var(--w-mono)', fontSize: 10, color: 'rgba(255,255,255,0.18)', marginTop: 8 }}>In 4 · Hold 4 · Out 6</div>\n    </div>\n    <button onClick={onExit} style={{ padding: '12px 28px', borderRadius: 14, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: 'rgba(52,211,153,0.8)', fontSize: 14, fontWeight: 600 }}>I'm ready to come back 💚</button>\n  </div>\n)}"
  },
  {
    "name": "WillowHeader",
    "description": "Compact willow header with mood indicator, love/XP stats, and spoon button.",
    "tokens": [
      "glass-border",
      "quantum-green",
      "quantum-gold",
      "quantum-violet",
      "text-primary",
      "text-tertiary",
      "font-mono"
    ],
    "example": "<div className=\"glass ui-chrome\" style={{ height: 46, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', borderBottom: '1px solid rgba(52,211,153,0.1)', zIndex: 10, position: 'relative', flexShrink: 0 }}>\n  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>\n    <div style={{ width: 26, height: 26, borderRadius: 6, background: 'linear-gradient(135deg, #34d399, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>🌿</div>\n    <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '0.04em' }}>P31 <span style={{ color: '#34d399' }}>WILLOW</span></span>\n  </div>\n  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--w-mono)', fontSize: 10 }}>\n    <span style={{ color: '#fbbf24' }}>❤️ {love}</span>\n    <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>\n    <span style={{ color: '#a78bfa' }}>Lv.{level}</span>\n    <button onClick={() => onSpoonsChange((spoons + 1) % 6)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 7, border: `1px solid ${spoons <= 1 ? 'rgba(251,65,117,0.3)' : 'rgba(52,211,153,0.2)'}`, background: 'transparent', color: spoons <= 1 ? '#fb7185' : 'rgba(240,242,245,0.7)', fontSize: 10, fontFamily: 'var(--w-mono)' }}>⚡ {spoons}/5</button>\n  </div>\n</div>"
  },
  {
    "name": "WillowBottomNav",
    "description": "Emoji tab bar navigation for willow screens. Fixed bottom, 5-tap layout.",
    "tokens": [
      "glass-border",
      "quantum-green",
      "text-primary",
      "text-tertiary"
    ],
    "example": "<div className=\"glass ui-chrome\" style={{ height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-around', borderTop: '1px solid rgba(52,211,153,0.1)', borderRadius: 0, zIndex: 10, flexShrink: 0 }}>\n  {NAV_ITEMS.map(({ id, emoji, label }) => {\n    const active = screen === id;\n    return (\n      <button key={id} onClick={() => onSelect(id)} data-mcp-tool=\"navigate\" data-mcp-type=\"action\" data-mcp-target={`nav-${id}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '6px 12px', minWidth: 48, minHeight: 48, borderRadius: 12, background: active ? 'rgba(52,211,153,0.1)' : 'transparent', border: `1px solid ${active ? 'rgba(52,211,153,0.3)' : 'transparent'}`, transition: 'all 0.15s' }}>\n        <span style={{ fontSize: 20, lineHeight: 1 }}>{emoji}</span>\n        <span style={{ fontSize: 10, color: active ? '#34d399' : 'rgba(240,242,245,0.4)', fontWeight: active ? 600 : 400 }}>{label}</span>\n      </button>\n    );\n  })}\n</div>"
  },
  {
    "name": "MoodSelector",
    "description": "Emoji mood picker with active highlight. Used in willow home screen.",
    "tokens": [
      "quantum-green",
      "text-primary",
      "text-tertiary"
    ],
    "example": "<div style={{ display: 'flex', justifyContent: 'space-around' }}>\n  {MOODS.map(m => (\n    <button key={m.id} onClick={() => onMoodChange(m.id)} data-mcp-tool=\"setMood\" data-mcp-type=\"control\" data-mcp-current={mood} title={m.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 10px', borderRadius: 12, border: `1px solid ${mood === m.id ? 'rgba(52,211,153,0.4)' : 'transparent'}`, background: mood === m.id ? 'rgba(52,211,153,0.08)' : 'transparent', transition: 'all 0.15s', minWidth: 44, minHeight: 44 }}>\n      <span style={{ fontSize: 20 }}>{m.emoji}</span>\n      <span style={{ fontSize: 9, color: mood === m.id ? '#34d399' : 'var(--w-muted)' }}>{m.label}</span>\n    </button>\n  ))}\n</div>"
  },
  {
    "name": "QuestCard",
    "description": "Quest list item with icon, title, description, reward badges, and claim button.",
    "tokens": [
      "quantum-green",
      "quantum-gold",
      "quantum-violet",
      "text-primary",
      "text-tertiary",
      "glass-border"
    ],
    "example": "<div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, border: `1px solid ${q.done ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.07)'}`, background: q.done ? 'rgba(52,211,153,0.04)' : 'rgba(255,255,255,0.02)', opacity: q.done ? 0.7 : 1 }}>\n  <span style={{ fontSize: 22, flexShrink: 0 }}>{q.icon}</span>\n  <div style={{ flex: 1 }}>\n    <div style={{ fontSize: 12, fontWeight: 600, textDecoration: q.done ? 'line-through' : 'none', color: q.done ? 'var(--w-muted)' : 'var(--w-text)' }}>{q.title}</div>\n    <div style={{ fontSize: 10, color: 'var(--w-muted)', marginTop: 2 }}>{q.desc}</div>\n    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>\n      <span style={{ fontFamily: 'var(--w-mono)', fontSize: 9, color: '#a78bfa' }}>+{q.xp} XP</span>\n      <span style={{ fontFamily: 'var(--w-mono)', fontSize: 9, color: '#fbbf24' }}>+{q.love} ❤️</span>\n    </div>\n  </div>\n  {q.done ? <span style={{ fontSize: 20 }}>✅</span> : <button onClick={() => onClaim(q.id)} data-mcp-tool=\"completeQuest\" data-mcp-type=\"action\" data-mcp-target={`quest-${q.id}`} style={{ minWidth: 60, minHeight: 36, padding: '6px 12px', borderRadius: 10, border: '1px solid rgba(52,211,153,0.35)', background: 'rgba(52,211,153,0.08)', color: '#34d399', fontSize: 11, fontWeight: 600 }}>Claim</button>}\n</div>"
  },
  {
    "name": "SkillBar",
    "description": "Horizontal XP progress bar with label, level badge, and remaining XP text.",
    "tokens": [
      "text-primary",
      "text-tertiary",
      "font-mono"
    ],
    "example": "<div style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>\n  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>\n    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>\n      <span style={{ fontSize: 20 }}>{emoji}</span>\n      <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>\n    </div>\n    <span style={{ fontFamily: 'var(--w-mono)', fontSize: 11, color: color, fontWeight: 700 }}>Lv.{level}</span>\n  </div>\n  <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>\n    <div style={{ height: '100%', width: `${progress * 100}%`, background: color, borderRadius: 3, transition: 'width 0.4s' }} />\n  </div>\n  <div style={{ fontFamily: 'var(--w-mono)', fontSize: 9, color: 'var(--w-muted)', marginTop: 4 }}>{Math.floor(progress * xpNeeded * level)} / {xpNeeded * level} XP to Lv.{level + 1}</div>\n</div>"
  },
  {
    "name": "ChatBubble",
    "description": "Message bubble for companion chat with sender differentiation and timestamp.",
    "tokens": [
      "quantum-green",
      "text-primary",
      "text-secondary",
      "text-tertiary",
      "font-mono"
    ],
    "example": "<div style={{ padding: '10px 12px', borderRadius: 12, border: `1px solid ${from === 'user' ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.07)'}`, background: from === 'user' ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)' }}>\n  <div style={{ fontSize: 13, lineHeight: 1.5, color: from === 'user' ? '#34d399' : 'var(--w-text)' }}>{text}</div>\n  <div style={{ fontFamily: 'var(--w-mono)', fontSize: 9, color: 'var(--w-muted)', marginTop: 4 }}>{timestamp}</div>\n</div>"
  },
  {
    "name": "BreathingPortal",
    "description": "Guided 4-4-6 breathing exercise with animated orb, phase labels, and cycle counter.",
    "tokens": [
      "quantum-green",
      "quantum-gold",
      "quantum-cyan",
      "text-primary",
      "text-tertiary",
      "font-mono"
    ],
    "example": "<div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>\n  {active && <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', border: `2px solid ${phaseColor}30`, animation: 'ripple 2s ease-out infinite', pointerEvents: 'none' }} />}\n  <div style={{ width: 140, height: 140, borderRadius: '50%', border: `2px solid ${active ? phaseColor : 'rgba(52,211,153,0.25)'}`, background: `radial-gradient(circle, ${active ? phaseColor : '#34d399'}18, ${active ? phaseColor : '#34d399'}04)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transition: 'all 0.5s', boxShadow: active ? `0 0 40px ${phaseColor}25` : 'none' }}>\n    <span style={{ fontSize: 32 }}>🌿</span>\n    <span style={{ fontFamily: 'var(--w-mono)', fontSize: 24, fontWeight: 700, color: active ? phaseColor : 'rgba(52,211,153,0.5)', lineHeight: 1, marginTop: 4 }}>{count}</span>\n  </div>\n</div>"
  },
  {
    "name": "MusicGrid",
    "description": "8-step sequencer grid for 4 tracks (kick, snare, hihat, melody) with play/stop and BPM.",
    "tokens": [
      "quantum-cyan",
      "quantum-gold",
      "quantum-red",
      "quantum-green",
      "text-primary",
      "text-tertiary"
    ],
    "example": "<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>\n  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>\n    <button onClick={onToggle} data-mcp-tool=\"togglePlay\" data-mcp-type=\"control\" data-mcp-state={isPlaying ? 'playing' : 'stopped'} style={{ minWidth: 80, minHeight: 44, padding: '10px 18px', borderRadius: 12, border: `1px solid ${isPlaying ? 'rgba(251,65,117,0.4)' : 'rgba(52,211,153,0.4)'}`, background: isPlaying ? 'rgba(251,65,117,0.1)' : 'rgba(52,211,153,0.1)', color: isPlaying ? '#fb7185' : '#34d399', fontWeight: 700, fontSize: 15 }}>{isPlaying ? '⏹ Stop' : '▶ Play'}</button>\n    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>\n      <span style={{ fontSize: 11, color: 'var(--w-muted)' }}>BPM</span>\n      <input type=\"range\" min={60} max={200} value={bpm} onChange={(e) => onBpmChange(Number(e.target.value))} style={{ width: 90, accentColor: '#34d399' }} />\n      <span style={{ fontFamily: 'var(--w-mono)', fontSize: 12, color: 'var(--w-text)', minWidth: 28 }}>{bpm}</span>\n    </div>\n  </div>\n  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>\n    {tracks.map(t => (\n      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>\n        <div style={{ width: 78, fontSize: 11, color: t.color, fontWeight: 600, flexShrink: 0 }}>{t.label}</div>\n        <div style={{ display: 'flex', gap: 5, flex: 1 }}>\n          {(grid[t.id as keyof typeof grid] as number[]).map((active, i) => (\n            <button key={i} onClick={() => onStepToggle(t.id, i)} data-mcp-tool=\"toggleStep\" data-mcp-type=\"action\" data-mcp-target={`step-${t.id}-${i}`} style={{ flex: 1, minWidth: 32, height: 38, borderRadius: 8, border: `1px solid ${active ? t.color : 'rgba(255,255,255,0.07)'}`, background: active ? `${t.color}20` : 'rgba(255,255,255,0.02)', transition: 'all 0.06s', boxShadow: isCurrent ? `0 0 14px ${t.color}70` : 'none', transform: isCurrent ? 'scale(1.08)' : 'scale(1)' }} />\n          ))}\n        </div>\n      </div>\n    ))}\n  </div>\n</div>"
  }
];

export const TOKEN_REFERENCE = {
  "colors": {
    "void": "oklch(10% 0.01 240)",
    "surface": "oklch(15% 0.015 240)",
    "surface2": "oklch(22% 0.02 240)",
    "text-primary": "oklch(96% 0.005 240)",
    "text-secondary": "oklch(75% 0.01 240)",
    "text-tertiary": "oklch(55% 0.01 240)",
    "quantum-cyan": "oklch(65% 0.18 195)",
    "quantum-violet": "oklch(65% 0.18 285)",
    "quantum-gold": "oklch(65% 0.18 15)",
    "quantum-green": "oklch(65% 0.18 105)",
    "quantum-red": "oklch(65% 0.18 20)",
    "quantum-iris": "oklch(65% 0.18 270)",
    "glass-surface": "rgba(255,255,255,0.04)",
    "glass-border": "rgba(255,255,255,0.08)",
    "glass-border-hover": "rgba(255,255,255,0.15)"
  },
  "typography": {
    "sans": "'Inter', sans-serif",
    "mono": "'JetBrains Mono', monospace"
  },
  "rounded": {
    "sm": "12px",
    "md": "16px",
    "lg": "24px"
  },
  "spacing": {
    "sm": "8px",
    "md": "16px",
    "lg": "24px"
  },
  "invariants": [
    "Never use pure white (#FFFFFF) or pure black (#000000)",
    "Primary accent is quantum-cyan (#00F0FF)",
    "All glass surfaces require backdrop-filter: blur(12px)",
    "Border radius for elevated surfaces: 24px (rounded.lg)",
    "Crisis mode (spoons=0): no UI chrome, only breathing overlay",
    "Motion disabled at spoons 0-1, slowed at 2, baseline at 3, accelerated at 4-5"
  ]
};

export const TOOLS = [
  {
    "name": "design_list_components",
    "description": "List all available PHOS design system components with their descriptions.",
    "inputSchema": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "name": "design_get_component",
    "description": "Get full component details: props, tokens, CSS, and usage example.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "description": "Component name (e.g. GlassPanel, CrisisOverlay)"
        }
      },
      "required": [
        "name"
      ]
    }
  },
  {
    "name": "design_get_tokens",
    "description": "Get all design system tokens (colors, typography, spacing, rounding) and invariants.",
    "inputSchema": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "name": "design_search",
    "description": "Search components by keyword or token usage.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "description": "Search term (e.g. \"glass\", \"button\", \"crisis\")"
        }
      },
      "required": [
        "query"
      ]
    }
  },
  {
    "name": "design_spoon_guide",
    "description": "Get spoon-level behavior guide — how the UI adapts at each energy level (0-5).",
    "inputSchema": {
      "type": "object",
      "properties": {}
    }
  }
];

export function executeTool(name, args) {
  switch (name) {
    case 'design_list_components':
      return {
        components: COMPONENTS.map(c => ({
          name: c.name,
          description: c.description,
          tokens: c.tokens,
        })),
        total: COMPONENTS.length,
        status: 'ok',
      };
    case 'design_get_component': {
      const comp = COMPONENTS.find(c => c.name.toLowerCase() === (args.name || '').toLowerCase());
      if (!comp) {
        const available = COMPONENTS.map(c => c.name).join(', ');
        return { error: `Unknown component "${args.name}". Available: ${available}`, status: 'error' };
      }
      return { component: comp, status: 'ok' };
    }
    case 'design_get_tokens':
      return { tokens: TOKEN_REFERENCE, status: 'ok' };
    case 'design_search': {
      const query = (args.query || '').toLowerCase();
      const results = COMPONENTS.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.tokens.some(t => t.toLowerCase().includes(query))
      );
      return { query: args.query, results, total: results.length, status: 'ok' };
    }
    default:
      return { error: `Unknown tool: ${name}`, status: 'error' };
  }
}
