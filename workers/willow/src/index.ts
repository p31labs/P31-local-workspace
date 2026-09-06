/**
 * WILLOW — Child-safe companion chat for neurodivergent kids
 * Edge-rendered · Emoji-first · Spoon-aware · WebMCP-annotated
 * Sovereign site at willow.p31ca.org
 */

const T=`--p31-base:clamp(16px,1.2vw,19px);--p31-scale-xs:calc(var(--p31-base,16px)*.75);--p31-scale-sm:var(--p31-base,16px);--p31-scale-md:calc(var(--p31-base,16px)*1.3333);--p31-scale-lg:calc(var(--p31-base,16px)*1.7777);--p31-scale-xl:calc(var(--p31-base,16px)*2.3703);--p31-scale-2xl:calc(var(--p31-base,16px)*3.1604);--p31-bg:oklch(18% .03 180);--p31-surface:oklch(22% .025 180);--p31-accent:oklch(72% .17 160);--p31-accent-cyan:oklch(72% .17 160);--p31-accent-violet:oklch(72% .17 265);--p31-accent-gold:oklch(78% .17 75);--p31-accent-green:oklch(72% .17 140);--p31-accent-red:oklch(68% .17 25);--p31-accent-pink:oklch(72% .17 340);--p31-text-primary:oklch(97% .005 180);--p31-text-secondary:oklch(80% .01 180);--p31-text-tertiary:oklch(60% .01 180);--p31-glass-bg:oklch(100% .01 180/.06);--p31-glass-border:oklch(100% .01 180/.1);--p31-glass-border-hover:oklch(100% .01 180/.18);--p31-glass-shadow:0 8px 32px rgba(0,0,0,.15);--p31-glow-green:0 0 20px rgba(52,211,153,.25);--p31-radius-sm:12px;--p31-radius-md:20px;--p31-radius-lg:28px;--p31-radius-full:9999px;--p31-blur-standard:12px;--p31-blur-strong:24px;--p31-space-xs:clamp(10px,.6vw,14px);--p31-space-sm:clamp(14px,1.2vw,20px);--p31-space-md:clamp(20px,2.5vw,28px);--p31-space-lg:clamp(28px,3.5vw,36px);--p31-space-xl:clamp(36px,5vw,48px);--p31-font-sans:'Nunito','Segoe UI',system-ui,-apple-system,sans-serif;--p31-font-mono:ui-monospace,'SF Mono','Fira Code',monospace;--p31-motion-duration-fast:120ms;--p31-motion-duration-standard:250ms;--p31-motion-duration-generous:450ms;--p31-motion-easing-standard:cubic-bezier(.4,0,.2,1);--p31-motion-easing-entrance:cubic-bezier(.34,1.56,.64,1);--p31-motion-easing-exit:cubic-bezier(.4,0,1,1)`;
const W='A/ZZVmEKj24pW26tJzYs29iGH3sr4RWunccYu4dd4Q2ylf2oLljrwa8QYZkGJZZnTMK0izUI83VEZcu9+yBmRSAAAAB3eyJvcmlnaW4iOiJodHRwczovL3dpbGxvdy5wMzFjYS5vcmc6NDQzIiwiZmVhdHVyZSI6IldlYk1DUCIsImV4cGlyeSI6MTc4ODk2MjI2NiwiaXNTdWJkb21haW4iOnRydWUsImlzVGhpcmRQYXJ0eSI6dHJ1ZX0=';

interface C{brand:string;spoons:number;page:string;name?:string;mood?:string;}

const C_=`:root{${T}}[data-spoons="0"],[data-spoons="1"]{--p31-motion-duration-fast:0ms!important;--p31-motion-duration-standard:0ms!important;--p31-motion-duration-generous:0ms!important;--p31-blur-standard:4px}
[data-spoons="4"],[data-spoons="5"]{--p31-motion-duration-fast:80ms;--p31-motion-duration-standard:150ms;--p31-motion-duration-generous:300ms}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{font-size:var(--p31-base,19px)}
body{background:var(--p31-bg,oklch(18% .03 180));color:var(--p31-text-primary,oklch(97% .005 180));font-family:var(--p31-font-sans,'Nunito',sans-serif);min-height:100dvh;line-height:1.6;overflow-x:hidden;-webkit-font-smoothing:antialiased}
.app{max-width:800px;margin:0 auto;padding:clamp(16px,4vw,40px);display:flex;flex-direction:column;gap:clamp(20px,3vw,32px);position:relative;z-index:1}
.glass{background:var(--p31-glass-bg,oklch(100% .01 180/.06));-webkit-backdrop-filter:blur(var(--p31-blur-standard,12px));backdrop-filter:blur(var(--p31-blur-standard,12px));border:1px solid var(--p31-glass-border,oklch(100% .01 180/.1));border-radius:var(--p31-radius-lg,28px);padding:clamp(24px,4vw,40px);box-shadow:var(--p31-glass-shadow,0 8px 32px rgba(0,0,0,.15));transition:background var(--p31-motion-duration-standard,.25s) var(--p31-motion-easing-standard),border-color var(--p31-motion-duration-standard,.25s) var(--p31-motion-easing-standard)}
.glass::before{content:'';position:absolute;inset:0;border-radius:inherit;background:linear-gradient(135deg,rgba(255,255,255,.03),transparent 50%);pointer-events:none}
.glass:hover{border-color:var(--p31-glass-border-hover,oklch(100% .01 180/.18))}
h1{font-size:clamp(36px,6vw,56px);font-weight:800;line-height:1.1;margin:0 0 8px 0;letter-spacing:-.02em}
h2{font-size:clamp(24px,4vw,36px);font-weight:700;line-height:1.2;margin:0 0 12px 0}
.subtitle{color:var(--p31-text-tertiary,oklch(60% .01 180));font-size:clamp(18px,2vw,22px);margin-bottom:16px;font-weight:500}
p{color:var(--p31-text-secondary,oklch(80% .01 180));font-size:clamp(17px,1.8vw,20px);line-height:1.7;max-width:680px;margin:0 0 12px 0}
p:last-child{margin-bottom:0}
.btn-row{display:flex;gap:12px;flex-wrap:wrap;margin-top:8px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:56px;padding:16px 28px;border-radius:var(--p31-radius-md,20px);font-size:clamp(17px,1.6vw,20px);font-weight:600;text-decoration:none;border:1px solid var(--p31-glass-border,oklch(100% .01 180/.1));background:var(--p31-glass-bg,oklch(100% .01 180/.06));color:var(--p31-text-primary,oklch(97% .005 180));cursor:pointer;transition:all var(--p31-motion-duration-fast,.12s) var(--p31-motion-easing-standard);font-family:inherit;min-width:0;flex:1 1 auto}
.btn:hover{border-color:var(--p31-accent,oklch(72% .17 160));background:rgba(52,211,153,.1);transform:translateY(-2px)}
.btn:active{transform:translateY(0)}
.btn-primary{background:var(--p31-accent,oklch(72% .17 160));color:var(--p31-bg,oklch(18% .03 180));border-color:var(--p31-accent,oklch(72% .17 160));font-weight:700}
.btn-primary:hover{background:color-mix(in oklch,var(--p31-accent,oklch(72% .17 160)),white 15%);border-color:transparent}
.btn-ghost{background:transparent;border-color:transparent;color:var(--p31-text-secondary,oklch(80% .01 180))}
.btn-ghost:hover{background:var(--p31-glass-bg,oklch(100% .01 180/.06));border-color:var(--p31-glass-border,oklch(100% .01 180/.1));color:var(--p31-text-primary,oklch(97% .005 180))}
.btn-sm{min-height:48px;padding:12px 20px;font-size:clamp(15px,1.4vw,17px)}
.mood-badge{display:inline-flex;align-items:center;gap:8px;padding:12px 20px;border-radius:var(--p31-radius-full,9999px);font-size:clamp(16px,1.5vw,19px);font-weight:600;background:var(--p31-glass-bg,oklch(100% .01 180/.06));border:1px solid var(--p31-glass-border,oklch(100% .01 180/.1));transition:all var(--p31-motion-duration-fast,.12s) var(--p31-motion-easing-standard);width:fit-content}
.nav-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:8px 12px;background:var(--p31-glass-bg,oklch(100% .01 180/.06));-webkit-backdrop-filter:blur(var(--p31-blur-standard,12px));backdrop-filter:blur(var(--p31-blur-standard,12px));border:1px solid var(--p31-glass-border,oklch(100% .01 180/.1));border-radius:var(--p31-radius-full,9999px);min-height:56px}
.nav-bar a{text-decoration:none;font-size:clamp(15px,1.4vw,18px);padding:12px 20px;border-radius:var(--p31-radius-full,9999px);border:1px solid transparent;transition:all var(--p31-motion-duration-fast,.12s) var(--p31-motion-easing-standard);color:var(--p31-text-tertiary,oklch(60% .01 180));font-weight:600;min-height:48px;display:inline-flex;align-items:center}
.nav-bar a:hover,.nav-bar a.active{color:var(--p31-accent,oklch(72% .17 160));background:rgba(52,211,153,.08);border-color:var(--p31-accent,oklch(72% .17 160))}
.chat-area{display:flex;flex-direction:column;gap:12px;padding:8px 0;max-height:55vh;overflow-y:auto;scroll-behavior:smooth}
.chat-bubble{max-width:85%;padding:16px 20px;border-radius:var(--p31-radius-lg,28px);font-size:clamp(17px,1.6vw,20px);line-height:1.6;animation:fadeIn var(--p31-motion-duration-standard,.25s) var(--p31-motion-easing-standard)}
.chat-bubble.bot{align-self:flex-start;background:var(--p31-glass-bg,oklch(100% .01 180/.06));border:1px solid var(--p31-glass-border,oklch(100% .01 180/.1));border-bottom-left-radius:var(--p31-radius-sm,12px);color:var(--p31-text-primary,oklch(97% .005 180))}
.chat-bubble.user{align-self:flex-end;background:var(--p31-accent,oklch(72% .17 160));color:var(--p31-bg,oklch(18% .03 180));border-bottom-right-radius:var(--p31-radius-sm,12px);font-weight:600}
.chat-input-row{display:flex;gap:10px;align-items:stretch;margin-top:4px}
.chat-input{flex:1;min-height:56px;padding:16px 20px;border-radius:var(--p31-radius-md,20px);border:1px solid var(--p31-glass-border,oklch(100% .01 180/.1));background:var(--p31-glass-bg,oklch(100% .01 180/.06));color:var(--p31-text-primary,oklch(97% .005 180));font-family:inherit;font-size:clamp(17px,1.6vw,20px);resize:none;transition:border-color var(--p31-motion-duration-fast,.12s) var(--p31-motion-easing-standard)}
.chat-input:focus{outline:none;border-color:var(--p31-accent,oklch(72% .17 160));box-shadow:0 0 0 2px rgba(52,211,153,.2)}
.chat-input::placeholder{color:var(--p31-text-tertiary,oklch(60% .01 180))}
.chip-row{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 4px}
.chip{display:inline-flex;align-items:center;gap:6px;min-height:48px;padding:10px 18px;border-radius:var(--p31-radius-full,9999px);border:1px solid var(--p31-glass-border,oklch(100% .01 180/.1));background:var(--p31-glass-bg,oklch(100% .01 180/.06));color:var(--p31-text-primary,oklch(97% .005 180));font-family:inherit;font-size:clamp(15px,1.4vw,18px);font-weight:500;cursor:pointer;transition:all var(--p31-motion-duration-fast,.12s) var(--p31-motion-easing-standard)}
.chip:hover{border-color:var(--p31-accent,oklch(72% .17 160));background:rgba(52,211,153,.1);transform:translateY(-1px)}
.chip:active{transform:translateY(0)}
.chip.selected{background:var(--p31-accent,oklch(72% .17 160));color:var(--p31-bg,oklch(18% .03 180));border-color:var(--p31-accent,oklch(72% .17 160))}
.form-group{display:flex;flex-direction:column;gap:8px;margin-bottom:20px}
.form-group label{font-size:clamp(16px,1.5vw,19px);font-weight:600;color:var(--p31-text-primary,oklch(97% .005 180))}
.form-input{padding:16px 20px;border-radius:var(--p31-radius-md,20px);border:1px solid var(--p31-glass-border,oklch(100% .01 180/.1));background:var(--p31-glass-bg,oklch(100% .01 180/.06));color:var(--p31-text-primary,oklch(97% .005 180));font-family:inherit;font-size:clamp(17px,1.6vw,20px);min-height:56px;transition:border-color var(--p31-motion-duration-fast,.12s) var(--p31-motion-easing-standard)}
.form-input:focus{outline:none;border-color:var(--p31-accent,oklch(72% .17 160));box-shadow:0 0 0 2px rgba(52,211,153,.2)}
.spoon-group{display:flex;gap:8px;flex-wrap:wrap}
.spoon-btn{width:52px;height:52px;border-radius:50%;border:2px solid var(--p31-glass-border,oklch(100% .01 180/.1));background:var(--p31-glass-bg,oklch(100% .01 180/.06));font-size:22px;cursor:pointer;transition:all var(--p31-motion-duration-fast,.12s) var(--p31-motion-easing-standard);display:flex;align-items:center;justify-content:center}
.spoon-btn.active{border-color:var(--p31-accent,oklch(72% .17 160));background:rgba(52,211,153,.15);transform:scale(1.1)}
.spoon-btn:hover{border-color:var(--p31-accent,oklch(72% .17 160))}
.spoon-label{font-size:clamp(14px,1.3vw,16px);color:var(--p31-text-tertiary,oklch(60% .01 180));margin-top:8px}
.theme-row{display:flex;gap:10px;flex-wrap:wrap}
.theme-opt{display:flex;align-items:center;gap:8px;min-height:56px;padding:14px 22px;border-radius:var(--p31-radius-md,20px);border:1px solid var(--p31-glass-border,oklch(100% .01 180/.1));background:var(--p31-glass-bg,oklch(100% .01 180/.06));color:var(--p31-text-primary,oklch(97% .005 180));font-family:inherit;font-size:clamp(16px,1.5vw,19px);font-weight:500;cursor:pointer;transition:all var(--p31-motion-duration-fast,.12s) var(--p31-motion-easing-standard)}
.theme-opt.active{border-color:var(--p31-accent,oklch(72% .17 160));background:rgba(52,211,153,.1)}
.theme-opt:hover{border-color:var(--p31-accent,oklch(72% .17 160))}
.footer-text{font-size:clamp(13px,1.2vw,15px);color:var(--p31-text-tertiary,oklch(60% .01 180));text-align:center;padding:20px 0;border-top:1px solid var(--p31-glass-border,oklch(100% .01 180/.1));margin-top:16px}
.skip-link{position:fixed;top:-100%;left:50%;transform:translateX(-50%);padding:16px 28px;background:var(--p31-surface,oklch(22% .025 180));color:var(--p31-accent,oklch(72% .17 160));border:1px solid var(--p31-accent,oklch(72% .17 160));border-radius:var(--p31-radius-md,20px);z-index:10000;font-size:clamp(16px,1.5vw,19px);font-weight:600;text-decoration:none;transition:top .2s ease}
.skip-link:focus{top:12px}
:focus-visible{outline:3px solid var(--p31-accent,oklch(72% .17 160));outline-offset:3px;border-radius:var(--p31-radius-md,20px)}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.emoji-xl{font-size:clamp(48px,8vw,72px);display:block;margin-bottom:4px}
.accent-border{border-left:3px solid var(--p31-accent,oklch(72% .17 160))}
.grid-2{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}
.loading-dots::after{content:'';animation:dots 1.2s steps(4) infinite}@keyframes dots{0%{content:''}25%{content:'.'}50%{content:'..'}75%{content:'...'}100%{content:''}}
@media(max-width:640px){.app{padding:14px;gap:16px}.glass{padding:20px}.grid-2{grid-template-columns:1fr}.btn{width:100%;justify-content:center}.chat-bubble{max-width:92%}.nav-bar a{flex:1;justify-content:center}}
@media(max-width:400px){.chip-row{gap:6px}.chip{font-size:clamp(13px,4vw,16px)}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}`;

function nav(p:string,ctx:C){
const l=[
['/', '🏠 Home'],
['/chat', '💬 Chat'],
['/settings', '⚙️ Settings']
];
return `<nav role="navigation" aria-label="Main navigation" class="nav-bar" data-mcp-tool="mainNav" data-mcp-target="willow-nav">
${l.map(([u,t])=>`<a href="${u}"${p===u?' class="active"':''} data-mcp-tool="navLink" data-mcp-type="action" data-mcp-target="nav-${t.toLowerCase().replace(/\s/g,'-').replace(/[🏠💬⚙️]/g,'').replace(/--/g,'-').replace(/^-|-$/g,'')||'home'}" style="${p===u?'':''}">${t}</a>`).join('')}
${ctx.spoons<=3?`<a href="/chat" data-mcp-tool="quickChat" data-mcp-type="action" data-mcp-target="quick-chat" style="margin-left:auto;background:var(--p31-accent,oklch(72% .17 160));color:var(--p31-bg,oklch(18% .03 180));border-color:transparent;font-weight:700">✨ Chat now</a>`:''}
</nav>`}

function footer(ctx:C){return `<footer role="contentinfo" class="footer-text" data-mcp-tool="footer" data-mcp-target="willow-footer" data-mcp-spoons="${ctx.spoons}">
🌿 WILLOW · Your friendly companion · <span data-mcp-tool="spoonDisplay" data-mcp-target="footer-spoons" data-mcp-current="${ctx.spoons}">${ctx.spoons}/5 spoons</span>
</footer>`}

function homePage(ctx:C){
const name=ctx.name||'friend';
const moods=['😊 Happy','😌 Calm','🤔 Curious','😴 Tired','🥳 Excited','😢 Sad'];
const currentMood=moods[Math.floor(Math.random()*moods.length)];
return `<div class="glass accent-border" data-mcp-tool="heroSection" data-mcp-target="willow-hero" data-mcp-state="${ctx.spoons<=1?'gentle':ctx.spoons>=4?'energetic':'standard'}">
<span class="emoji-xl" aria-hidden="true">🌿</span>
<h1>WILLOW</h1>
<p class="subtitle">Your friendly companion ${name} ✨</p>
<p style="font-size:clamp(18px,2vw,22px);color:var(--p31-text-secondary,oklch(80% .01 180))">I'm here to chat, play games, tell stories, and help you feel great. Whatever you need, we'll do it together! 🤗</p>
<div class="mood-badge" data-mcp-tool="currentMood" data-mcp-target="current-mood" data-mcp-state="${currentMood.split(' ')[0].replace(/[😊😌🤔😴🥳😢]/g,'')}">${currentMood}</div>
</div>

<div class="grid-2" data-mcp-tool="actionGrid" data-mcp-target="quick-actions">
<a href="/chat" class="btn" data-mcp-tool="actionButton" data-mcp-type="action" data-mcp-target="action-chat" style="border-left:3px solid var(--p31-accent,oklch(72% .17 160))"><span style="font-size:28px">💬</span> Chat</a>
<a href="/chat?mood=feelings" class="btn" data-mcp-tool="actionButton" data-mcp-type="action" data-mcp-target="action-feelings" style="border-left:3px solid var(--p31-accent-violet,oklch(72% .17 265))"><span style="font-size:28px">😊</span> Feelings</a>
<a href="/games" class="btn" data-mcp-tool="actionButton" data-mcp-type="action" data-mcp-target="action-games" style="border-left:3px solid var(--p31-accent-gold,oklch(78% .17 75))"><span style="font-size:28px">🎮</span> Games</a>
<a href="/stories" class="btn" data-mcp-tool="actionButton" data-mcp-type="action" data-mcp-target="action-stories" style="border-left:3px solid var(--p31-accent-pink,oklch(72% .17 340))"><span style="font-size:28px">📚</span> Stories</a>
</div>

<div class="glass" data-mcp-tool="tipSection" data-mcp-target="daily-tip" style="border-left:3px solid var(--p31-accent-gold,oklch(78% .17 75))">
<h2 style="font-size:clamp(20px,3vw,28px)">💡 Tip of the day</h2>
<p style="font-size:clamp(17px,1.6vw,20px)">Take a deep breath with me! Breathe in slowly for 4 seconds, hold for 4 seconds, then breathe out for 4 seconds. You're doing great! 🌟</p>
</div>`
}

function chatPage(ctx:C){
return `<div class="glass" data-mcp-tool="chatContainer" data-mcp-target="chat-container" style="display:flex;flex-direction:column;min-height:60vh">
<h2 style="font-size:clamp(22px,3.5vw,32px);margin-bottom:12px">💬 Chat with WILLOW</h2>
<div class="chat-area" role="log" aria-label="Chat messages" aria-live="polite" data-mcp-tool="chatMessages" data-mcp-target="chat-messages">
<div class="chat-bubble bot" data-mcp-tool="chatMessage" data-mcp-type="message" data-mcp-target="msg-0" data-mcp-role="assistant">
Hi ${ctx.name||'friend'}! 👋 I'm WILLOW. How are you feeling today? 😊
</div>
<div class="chat-bubble user" data-mcp-tool="chatMessage" data-mcp-type="message" data-mcp-target="msg-1" data-mcp-role="user" style="display:none">
</div>
</div>
<div class="chip-row" data-mcp-tool="quickReplies" data-mcp-target="quick-replies">
<button class="chip" data-mcp-tool="quickReply" data-mcp-type="action" data-mcp-target="qr-happy" data-mcp-value="happy">😊 Happy</button>
<button class="chip" data-mcp-tool="quickReply" data-mcp-type="action" data-mcp-target="qr-tired" data-mcp-value="tired">😴 Tired</button>
<button class="chip" data-mcp-tool="quickReply" data-mcp-type="action" data-mcp-target="qr-worried" data-mcp-value="worried">😟 Worried</button>
<button class="chip" data-mcp-tool="quickReply" data-mcp-type="action" data-mcp-target="qr-bored" data-mcp-value="bored">😐 Bored</button>
<button class="chip" data-mcp-tool="quickReply" data-mcp-type="action" data-mcp-target="qr-excited" data-mcp-value="excited">🥳 Excited</button>
<button class="chip" data-mcp-tool="quickReply" data-mcp-type="action" data-mcp-target="qr-calm" data-mcp-value="calm">🧘 Calm</button>
</div>
<div class="chat-input-row">
<textarea class="chat-input" placeholder="Type your message here..." rows="2" aria-label="Type your message" data-mcp-tool="chatInput" data-mcp-target="chat-input" data-mcp-type="input"></textarea>
<button class="btn btn-primary" style="min-width:72px;display:flex;align-items:center;justify-content:center;font-size:24px" aria-label="Send message" data-mcp-tool="sendButton" data-mcp-type="action" data-mcp-target="send-btn">➡️</button>
</div>
<div style="margin-top:12px">
<a href="/" class="btn btn-ghost btn-sm" data-mcp-tool="backLink" data-mcp-type="action" data-mcp-target="back-home">← Back home</a>
</div>
</div>`
}

function settingsPage(ctx:C){
const spoonLabels=['😴 Resting','🙂 Low','😊 Medium','🤗 Good','⚡ High','🌟 Full'];
const themes=[
['forest','🌿 Forest','--p31-accent'],
['ocean','🌊 Ocean','--p31-accent-cyan'],
['sunset','🌈 Sunset','--p31-accent-pink'],
['candy','🍬 Candy','--p31-accent-violet']
];
return `<div class="glass accent-border" data-mcp-tool="settingsContainer" data-mcp-target="settings-page">
<h2>⚙️ Settings</h2>

<div class="form-group">
<label for="kid-name">Your name ✏️</label>
<input type="text" id="kid-name" class="form-input" placeholder="Enter your name" value="${ctx.name||''}" maxlength="30" data-mcp-tool="nameInput" data-mcp-target="name-input" data-mcp-type="input" data-mcp-name="${ctx.name||''}">
</div>

<div class="form-group">
<label>How much energy do you have? ⚡</label>
<div class="spoon-group" data-mcp-tool="spoonSelector" data-mcp-target="spoon-selector" data-mcp-current="${ctx.spoons}">
${[0,1,2,3,4,5].map(n=>`<button class="spoon-btn${n===ctx.spoons?' active':''}" data-mcp-tool="spoonButton" data-mcp-type="action" data-mcp-target="spoon-${n}" data-mcp-value="${n}" aria-label="${n} spoons — ${spoonLabels[n]}">${spoonLabels[n].split(' ')[0]}</button>`).join('')}
</div>
<div class="spoon-label">${spoonLabels[ctx.spoons]} — ${ctx.spoons} out of 5</div>
</div>

<div class="form-group">
<label>Choose your theme 🎨</label>
<div class="theme-row" data-mcp-tool="themeSelector" data-mcp-target="theme-selector">
${themes.map(([id,label,c])=>`<button class="theme-opt${id==='forest'?' active':''}" data-mcp-tool="themeOption" data-mcp-type="action" data-mcp-target="theme-${id}" data-mcp-theme="${id}" style="${id==='forest'?`border-color:var(${c},oklch(72% .17 160))`:''}">${label}</button>`).join('')}
</div>
</div>

<div style="margin-top:20px">
<a href="/" class="btn btn-ghost btn-sm" data-mcp-tool="backLink" data-mcp-type="action" data-mcp-target="back-home">← Back home</a>
</div>
</div>`
}

function gamesPage(ctx:C){
return `<div class="glass" style="border-left:3px solid var(--p31-accent-gold,oklch(78% .17 75))" data-mcp-tool="gamesPage" data-mcp-target="games-page">
<h2>🎮 Games & Activities</h2>
<p>Choose something fun to do together!</p>
<div class="grid-2" style="margin-top:16px">
<button class="btn" data-mcp-tool="gameButton" data-mcp-type="action" data-mcp-target="game-breathing" style="border-left:3px solid var(--p31-accent,oklch(72% .17 160))"><span style="font-size:28px">🫁</span> Breathing</button>
<button class="btn" data-mcp-tool="gameButton" data-mcp-type="action" data-mcp-target="game-coloring" style="border-left:3px solid var(--p31-accent-pink,oklch(72% .17 340))"><span style="font-size:28px">🎨</span> Coloring</button>
<button class="btn" data-mcp-tool="gameButton" data-mcp-type="action" data-mcp-target="game-memory" style="border-left:3px solid var(--p31-accent-violet,oklch(72% .17 265))"><span style="font-size:28px">🧠</span> Memory</button>
<button class="btn" data-mcp-tool="gameButton" data-mcp-type="action" data-mcp-target="game-emoji" style="border-left:3px solid var(--p31-accent-gold,oklch(78% .17 75))"><span style="font-size:28px">😊</span> Emoji match</button>
</div>
<div style="margin-top:16px"><a href="/" class="btn btn-ghost btn-sm" data-mcp-tool="backLink" data-mcp-type="action" data-mcp-target="back-home">← Back home</a></div>
</div>`
}

function storiesPage(ctx:C){
return `<div class="glass" style="border-left:3px solid var(--p31-accent-pink,oklch(72% .17 340))" data-mcp-tool="storiesPage" data-mcp-target="stories-page">
<h2>📚 Stories</h2>
<p>Pick a story you'd like to hear!</p>
<div class="grid-2" style="margin-top:16px">
<button class="btn" data-mcp-tool="storyButton" data-mcp-type="action" data-mcp-target="story-dragon" style="border-left:3px solid var(--p31-accent-gold,oklch(78% .17 75))"><span style="font-size:28px">🐉</span> The Friendly Dragon</button>
<button class="btn" data-mcp-tool="storyButton" data-mcp-type="action" data-mcp-target="story-space" style="border-left:3px solid var(--p31-accent-violet,oklch(72% .17 265))"><span style="font-size:28px">🚀</span> Space Adventure</button>
<button class="btn" data-mcp-tool="storyButton" data-mcp-type="action" data-mcp-target="story-ocean" style="border-left:3px solid var(--p31-accent-cyan,oklch(72% .17 160))"><span style="font-size:28px">🐠</span> Under the Ocean</button>
<button class="btn" data-mcp-tool="storyButton" data-mcp-type="action" data-mcp-target="story-rainbow" style="border-left:3px solid var(--p31-accent-pink,oklch(72% .17 340))"><span style="font-size:28px">🌈</span> Rainbow Kingdom</button>
</div>
<div style="margin-top:16px"><a href="/" class="btn btn-ghost btn-sm" data-mcp-tool="backLink" data-mcp-type="action" data-mcp-target="back-home">← Back home</a></div>
</div>`
}

const P:Record<string,(c:C)=>string>={
'/':homePage,'/chat':chatPage,'/settings':settingsPage,
'/games':gamesPage,'/stories':storiesPage
};

function shell(ctx:C,body:string):string{
const s=ctx.spoons;
const t=(p:string)=>p==='/'?'🌿 WILLOW · Your friendly companion':p.slice(1).charAt(0).toUpperCase()+p.slice(2)+' · WILLOW';
return `<!DOCTYPE html>
<html lang="en" data-brand="willow" data-spoons="${s}" data-theme="forest">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${t(ctx.page)}</title>
<meta name="description" content="WILLOW — A child-safe companion chat for neurodivergent kids. Emoji responses, quick replies, spoon-aware interaction.">
<meta name="theme-color" content="#0D3B2E"><meta http-equiv="origin-trial" content="${W}"><link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<meta property="og:title" content="🌿 WILLOW · Your friendly companion"><meta property="og:image" content="https://willow.p31ca.org/og-default.png">
<meta name="robots" content="index, follow"><style>${C_}</style></head>
<body><a href="#main-content" class="skip-link">Skip to main content</a>
<svg aria-hidden="true" style="position:fixed;top:5%;right:-5%;width:400px;height:400px;z-index:0;opacity:.04;pointer-events:none" viewBox="0 0 100 100">
<circle cx="50" cy="50" r="40" fill="none" stroke="var(--p31-accent,oklch(72% .17 160))" stroke-width=".5"/>
<circle cx="50" cy="50" r="25" fill="none" stroke="var(--p31-accent-violet,oklch(72% .17 265))" stroke-width=".5"/>
<circle cx="50" cy="50" r="10" fill="none" stroke="var(--p31-accent-gold,oklch(78% .17 75))" stroke-width=".5"/>
</svg>
<svg aria-hidden="true" style="position:fixed;bottom:8%;left:-4%;width:200px;height:200px;z-index:0;opacity:.03;pointer-events:none" viewBox="0 0 100 100">
<path d="M20 50 Q35 20 50 50 Q65 80 80 50" fill="none" stroke="var(--p31-accent-pink,oklch(72% .17 340))" stroke-width=".5"/>
<path d="M30 50 Q40 30 50 50 Q60 70 70 50" fill="none" stroke="var(--p31-accent,oklch(72% .17 160))" stroke-width=".5"/>
</svg>
<div class="app" id="main-content" data-mcp-tool="willowSite" data-mcp-state="${s}" data-mcp-target="site-root">
${nav(ctx.page,ctx)}${body}${footer(ctx)}
</div>
<div id="toast" role="status" aria-live="polite" style="position:fixed;bottom:100px;right:24px;padding:16px 28px;border-radius:var(--p31-radius-md,20px);background:var(--p31-surface,oklch(22% .025 180));border:1px solid var(--p31-glass-border,oklch(100% .01 180/.1));color:var(--p31-text-primary,oklch(97% .005 180));font-size:clamp(15px,1.4vw,18px);z-index:9997;opacity:0;transform:translateY(20px);transition:all var(--p31-motion-duration-generous,.45s) var(--p31-motion-easing-entrance);pointer-events:none;backdrop-filter:blur(var(--p31-blur-standard,12px));-webkit-backdrop-filter:blur(var(--p31-blur-standard,12px));cursor:pointer;min-height:48px"></div>
<script>
(function(){'use strict';
var T={forest:{l:'Forest',e:'🌿',c:'#34D399',t:{'--p31-bg':'oklch(18% .03 180)','--p31-surface':'oklch(22% .025 180)','--p31-accent':'oklch(72% .17 160)','--p31-accent-cyan':'oklch(72% .17 160)','--p31-accent-violet':'oklch(72% .17 265)','--p31-accent-gold':'oklch(78% .17 75)','--p31-accent-green':'oklch(72% .17 140)','--p31-accent-red':'oklch(68% .17 25)','--p31-accent-pink':'oklch(72% .17 340)','--p31-text-primary':'oklch(97% .005 180)','--p31-text-secondary':'oklch(80% .01 180)','--p31-text-tertiary':'oklch(60% .01 180)','--p31-glass-bg':'oklch(100% .01 180/.06)','--p31-glass-border':'oklch(100% .01 180/.1)'}},ocean:{l:'Ocean',e:'🌊',c:'#38BDF8',t:{'--p31-bg':'oklch(15% .04 240)','--p31-surface':'oklch(20% .035 240)','--p31-accent':'oklch(72% .16 200)','--p31-accent-cyan':'oklch(72% .16 200)','--p31-accent-violet':'oklch(68% .16 260)','--p31-accent-gold':'oklch(75% .16 85)','--p31-accent-green':'oklch(70% .16 140)','--p31-accent-red':'oklch(65% .16 25)','--p31-accent-pink':'oklch(72% .16 10)','--p31-text-primary':'oklch(96% .005 240)','--p31-text-secondary':'oklch(78% .01 240)','--p31-text-tertiary':'oklch(55% .01 240)','--p31-glass-bg':'oklch(100% .01 240/.06)','--p31-glass-border':'oklch(100% .01 240/.1)'}},sunset:{l:'Sunset',e:'🌈',c:'#F472B6',t:{'--p31-bg':'oklch(16% .04 10)','--p31-surface':'oklch(22% .03 10)','--p31-accent':'oklch(72% .16 25)','--p31-accent-cyan':'oklch(72% .16 25)','--p31-accent-violet':'oklch(70% .16 300)','--p31-accent-gold':'oklch(78% .16 75)','--p31-accent-green':'oklch(68% .16 130)','--p31-accent-red':'oklch(72% .16 25)','--p31-accent-pink':'oklch(74% .16 350)','--p31-text-primary':'oklch(96% .005 30)','--p31-text-secondary':'oklch(78% .01 30)','--p31-text-tertiary':'oklch(55% .01 30)','--p31-glass-bg':'oklch(100% .01 30/.06)','--p31-glass-border':'oklch(100% .01 30/.1)'}},candy:{l:'Candy',e:'🍬',c:'#A78BFA',t:{'--p31-bg':'oklch(14% .04 290)','--p31-surface':'oklch(20% .03 290)','--p31-accent':'oklch(74% .16 290)','--p31-accent-cyan':'oklch(74% .16 290)','--p31-accent-violet':'oklch(72% .16 310)','--p31-accent-gold':'oklch(76% .16 90)','--p31-accent-green':'oklch(70% .16 140)','--p31-accent-red':'oklch(68% .16 15)','--p31-accent-pink':'oklch(74% .16 350)','--p31-text-primary':'oklch(96% .005 290)','--p31-text-secondary':'oklch(78% .01 290)','--p31-text-tertiary':'oklch(55% .01 290)','--p31-glass-bg':'oklch(100% .01 290/.06)','--p31-glass-border':'oklch(100% .01 290/.1)'}}};
var K=Object.keys(T);var C=localStorage.getItem('willow-theme')||'forest';function A(id,t){var th=T[id];if(!th)return;var r=document.documentElement;r.setAttribute('data-theme',id);for(var k in th.t){if(th.t.hasOwnProperty(k)){r.style.setProperty(k,th.t[k])}}localStorage.setItem('willow-theme',id);C=id;window.dispatchEvent(new CustomEvent('willow:themeChanged',{detail:{theme:id,label:th.l,emoji:th.e}}));if(t){var to=document.getElementById('toast');if(to){to.textContent=t;to.style.opacity='1';to.style.transform='translateY(0)';to.style.pointerEvents='auto';var td=setTimeout(function(){to.style.opacity='0';to.style.transform='translateY(20px)';to.style.pointerEvents='none'},3000);to.onclick=function(){clearTimeout(td);to.style.opacity='0';to.style.transform='translateY(20px)';to.style.pointerEvents='none'}}}}function R(){var o=K.filter(function(t){return t!==C});return o[Math.floor(Math.random()*o.length)]}function B(){var co=T[C].c||'#34D399';var b=document.getElementById('willow-burst');if(!b){b=document.createElement('div');b.id='willow-burst';b.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:99999;overflow:hidden';document.body.appendChild(b)}for(var i=0;i<20;i++){(function(){var p=document.createElement('div');p.style.cssText='position:absolute;width:8px;height:8px;border-radius:50%;background:'+co+';left:'+(50+Math.random()*40-20)+'%;top:'+(50+Math.random()*40-20)+'%;opacity:1;transform:scale(0);animation:wb .6s ease-out forwards;animation-delay:'+(Math.random()*0.2)+'s';b.appendChild(p);setTimeout(function(){if(p.parentNode)p.parentNode.removeChild(p)},1000)})()}}if(!document.getElementById('willow-burst-style')){var st=document.createElement('style');st.id='willow-burst-style';st.textContent='@keyframes wb{0%{transform:scale(0);opacity:1}50%{transform:scale(3);opacity:.6}100%{transform:scale(5);opacity:0}}';document.head.appendChild(st)}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){var s=localStorage.getItem('willow-theme');if(s&&T[s])A(s);I()})}else{var s=localStorage.getItem('willow-theme');if(s&&T[s])A(s);I()}
function I(){var o=document.createElement('div');o.id='willow-theme-orb';o.setAttribute('data-mcp-tool','themeOrb');o.setAttribute('data-mcp-type','action');o.setAttribute('data-mcp-target','theme-orb');o.setAttribute('data-mcp-state',C);o.title='Click to change theme!';o.setAttribute('aria-label','Theme switcher — click to cycle themes');o.setAttribute('role','button');o.setAttribute('tabindex','0');var e=document.createElement('span');e.id='willow-theme-emoji';e.textContent=T[C].e;o.appendChild(e);o.style.cssText='position:fixed;bottom:24px;right:24px;width:60px;height:60px;border-radius:50%;border:2px solid var(--p31-glass-border,oklch(100% .01 180/.1));background:var(--p31-glass-bg,oklch(100% .01 180/.06));backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);cursor:pointer;z-index:9999;display:flex;align-items:center;justify-content:center;font-size:26px;transition:all .3s cubic-bezier(.34,1.56,.64,1);box-shadow:0 4px 20px rgba(0,0,0,.3);user-select:none';var ci=null;var idx=K.indexOf(C);o.addEventListener('click',function(){if(ci)return;var ni=K.indexOf(C);ni=(ni+1)%K.length;A(K[ni],'✨ '+T[K[ni]].l);e.textContent=T[K[ni]].e;o.dataset.mcpState=K[ni];B();idx=ni});var lt=null;o.addEventListener('mousedown',function(){lt=setTimeout(function(){ci=setInterval(function(){idx=(idx+1)%K.length;A(K[idx],'✨ '+T[K[idx]].l);e.textContent=T[K[idx]].e;o.dataset.mcpState=K[idx];B()},400)},400)});o.addEventListener('mouseup',function(){if(lt){clearTimeout(lt);lt=null}if(ci){clearInterval(ci);ci=null}});o.addEventListener('mouseleave',function(){if(lt){clearTimeout(lt);lt=null}if(ci){clearInterval(ci);ci=null}});document.body.appendChild(o);document.addEventListener('willow:themeChanged',function(d){e.textContent=T[d.detail.theme].e});}
// ── Spoon gating ──
var spoonsAttr=document.documentElement.getAttribute('data-spoons');var ss=parseInt(spoonsAttr,10)||3;
// ── Chat quick-reply handlers ──
document.addEventListener('click',function(ev){var t=ev.target.closest('[data-mcp-tool="quickReply"]');if(t&&ss>0){var val=t.getAttribute('data-mcp-value')||'';var input=document.querySelector('[data-mcp-tool="chatInput"]');if(input){var msgs={'happy':'That\\'s wonderful! 😊 What would you like to do today?','tired':'It\\'s okay to rest. 🛋️ Let\\'s do something calming.','worried':'I\\'m here for you. 🤗 Take a deep breath with me.','bored':'Let\\'s find something fun! 🎮 How about a game?','excited':'Yay! 🥳 I\\'m excited too! What shall we do?','calm':'Peaceful vibes 🧘 Let\\'s enjoy this calm moment together.'};var reply=msgs[val]||'Thanks for sharing! 😊 Tell me more.';var area=document.querySelector('.chat-area');if(area){var ub=document.createElement('div');ub.className='chat-bubble user';ub.textContent=t.textContent.trim();ub.style.display='block';area.appendChild(ub);setTimeout(function(){var bb=document.createElement('div');bb.className='chat-bubble bot';bb.textContent=reply;bb.style.display='block';area.appendChild(bb);area.scrollTop=area.scrollHeight},300)}input.focus()}}});
// ── Spoon level buttons ──
document.addEventListener('click',function(ev){var t=ev.target.closest('[data-mcp-tool="spoonButton"]');if(t){var val=t.getAttribute('data-mcp-value');if(val!==null){document.documentElement.setAttribute('data-spoons',val);var all=document.querySelectorAll('[data-mcp-tool="spoonButton"]');all.forEach(function(b){b.classList.remove('active')});t.classList.add('active');var labels=['😴 Resting','🙂 Low','😊 Medium','🤗 Good','⚡ High','🌟 Full'];var lbl=document.querySelector('.spoon-label');if(lbl)lbl.textContent=labels[parseInt(val,10)]+' — '+val+' out of 5'}ev.preventDefault()}});
// ── Send button ──
document.addEventListener('click',function(ev){var t=ev.target.closest('[data-mcp-tool="sendButton"]');if(t&&ss>0){var input=document.querySelector('[data-mcp-tool="chatInput"]');if(input&&input.value.trim()){var area=document.querySelector('.chat-area');if(area){var ub=document.createElement('div');ub.className='chat-bubble user';ub.textContent=input.value.trim();ub.style.display='block';area.appendChild(ub);input.value='';setTimeout(function(){var bb=document.createElement('div');bb.className='chat-bubble bot';bb.textContent='Thanks for sharing! 😊 I\\'m here to listen. Tell me more!';bb.style.display='block';area.appendChild(bb);area.scrollTop=area.scrollHeight},500)}input.focus()}}});
// ── Theme option buttons ──
document.addEventListener('click',function(ev){var t=ev.target.closest('[data-mcp-tool="themeOption"]');if(t){var id=t.getAttribute('data-mcp-theme');if(id&&T[id]){A(id,'✨ '+T[id].l);var orb=document.getElementById('willow-theme-emoji');if(orb)orb.textContent=T[id].e;var all=document.querySelectorAll('[data-mcp-tool="themeOption"]');all.forEach(function(b){b.classList.remove('active')});t.classList.add('active')}}});
// ── Name input save ──
document.addEventListener('input',function(ev){var t=ev.target.closest('[data-mcp-tool="nameInput"]');if(t){localStorage.setItem('willow-name',t.value)}});
// ── Game / Story buttons show toast ──
document.addEventListener('click',function(ev){var t=ev.target.closest('[data-mcp-tool="gameButton"],[data-mcp-tool="storyButton"]');if(t){var to=document.getElementById('toast');if(to){to.textContent='🎮 Coming soon! I\\'ll help you play this together.';to.style.opacity='1';to.style.transform='translateY(0)';to.style.pointerEvents='auto';var td=setTimeout(function(){to.style.opacity='0';to.style.transform='translateY(20px)';to.style.pointerEvents='none'},2500);to.onclick=function(){clearTimeout(td);to.style.opacity='0';to.style.transform='translateY(20px)';to.style.pointerEvents='none'}}}});
// ── Spoon-aware motion from stored level ──
var storedSpoons=localStorage.getItem('willow-spoons');
if(storedSpoons!==null){document.documentElement.setAttribute('data-spoons',storedSpoons)}
// ── Register WebMCP tools ──
var _wctx=(typeof document!=='undefined'&&document.modelContext)?document.modelContext:(typeof navigator!=='undefined'&&navigator.modelContext)?navigator.modelContext:null;if(_wctx&&_wctx.registerTool){_wctx.registerTool({name:'setSpoonLevel',description:'Set the user spoon level 0-5 for motion gating',schema:{type:'object',properties:{level:{type:'number',minimum:0,maximum:5}},required:['level']},handler:function(args){var l=Math.max(0,Math.min(5,Math.round(args.level)));document.documentElement.setAttribute('data-spoons',l);localStorage.setItem('willow-spoons',l);window.dispatchEvent(new CustomEvent('spoons:changed',{detail:{spoons:l}}));return{ok:true,spoons:l}}})}
window.__p31MCPTools=window.__p31MCPTools||{};
window.__p31MCPExec=function(name,args){switch(name){case'setSpoonLevel':var l=Math.max(0,Math.min(5,Math.round(args.level)));document.documentElement.setAttribute('data-spoons',String(l));localStorage.setItem('willow-spoons',String(l));return{ok:true,spoons:l};default:return{error:'unknown tool'}}}
})();
</script></body></html>`
}

function css(n:number):number{return Math.max(0,Math.min(5,Math.round(n)))}

export default{
fetch:async function(req:Request):Promise<Response>{
const u=new URL(req.url);
const p=u.pathname;

if(p==='/health')return new Response(JSON.stringify({
status:'ok',version:'1.0.0',app:'willow',
pages:Object.keys(P),ts:new Date().toISOString()
}),{headers:{
'Content-Type':'application/json',
'Access-Control-Allow-Origin':'*',
'Cache-Control':'no-cache'
}});

if(p==='/favicon.svg')return new Response(
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="oklch(72% .17 160)"/><path d="M35 55 Q50 40 65 55 Q50 70 35 55" fill="none" stroke="#fff" stroke-width="3"/><circle cx="50" cy="50" r="25" fill="none" stroke="#fff" stroke-width="1.5" opacity=".3"/><circle cx="43" cy="47" r="4" fill="#fff"/><circle cx="57" cy="47" r="4" fill="#fff"/></svg>',
{headers:{'Content-Type':'image/svg+xml','Cache-Control':'public,max-age=86400'}}
);

if(p==='/robots.txt')return new Response(
'User-agent: *\nAllow: /\nSitemap: https://willow.p31ca.org/sitemap.xml\n',
{headers:{'Content-Type':'text/plain'}}
);

if(p==='/sitemap.xml'){
const urls=Object.keys(P).map(p=>'  <url><loc>https://willow.p31ca.org'+p+'</loc><changefreq>weekly</changefreq></url>').join('\n');
return new Response(
'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls+'\n</urlset>',
{headers:{'Content-Type':'application/xml','Cache-Control':'public,max-age=86400'}}
);
}

const r=P[p];
if(!r){
return new Response(shell(
{brand:'willow',spoons:3,page:'/'},
'<div class="glass" style="border-left:3px solid var(--p31-accent-red,oklch(68% .17 25))"><span class="emoji-xl" aria-hidden="true">🤔</span><h1>Hmm, not found</h1><p>I couldn\'t find that page. Let\'s go back home!</p><div class="btn-row"><a href="/" class="btn btn-primary">🏠 Go home</a></div></div>'
),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'public,max-age=60'}});
}

const rawSpoons=u.searchParams.get('spoons');
const spoons=rawSpoons?css(parseInt(rawSpoons,10)):3;
const rawName=u.searchParams.get('name')||'';
const name=rawName.slice(0,30);

return new Response(shell(
{brand:'willow',spoons,page:p,name},
r({brand:'willow',spoons,page:p,name})
),{headers:{
'Content-Type':'text/html; charset=utf-8',
'Cache-Control':'public,max-age=300,s-maxage=600',
'X-Generator':'p31-willow-worker/1.0',
'X-Protocol-Version':'2026-07-28'
}})
}
};
