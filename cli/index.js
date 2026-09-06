#!/usr/bin/env node

// ═════════════════════════════════════════════════════════════════════════════
// P31 OASIS CLI v1.0.0 — Production TUI
// Stack: blessed + blessed-contrib + node-pty
// ═════════════════════════════════════════════════════════════════════════════

// ─── Agent Mode (non-TTY safe) ──────────────────────────────────────────────
// Check for --agent / -a BEFORE the TTY gate so agents can invoke from any ctx.
// If a subcommand (status/surfaces/deploy) is present with --agent, the
// subcommand handles it — so we skip this block.
const _SUBCOMMANDS = ['status', 'surfaces', 'deploy', 'love', 'monetization'];

{
  const _args = process.argv.slice(2);
  const _hasSubcommand = _args.some(a => _SUBCOMMANDS.includes(a));
  if ((_args.includes('--agent') || _args.includes('-a')) && !_hasSubcommand) {
    const _fs = require('fs');
    const _path = require('path');
    const _yaml = require('yaml');

    function _loadSession() {
      const _dir = _path.join(require('os').homedir(), '.p31');
      const _file = _path.join(_dir, 'cli-session.json');
      try {
        if (_fs.existsSync(_file)) {
          const _raw = _fs.readFileSync(_file, 'utf-8');
          const _s = JSON.parse(_raw);
          return {
            theme: _s.theme || 'warm',
            todos: _s.todos || [],
            mode: _s.mode || 'BUILD',
            sandboxCwd: _s.sandboxCwd || process.cwd(),
          };
        }
      } catch (_) { /* start fresh */ }
      return { theme: 'warm', todos: [], mode: 'BUILD', sandboxCwd: process.cwd() };
    }

    function _loadDesign() {
      const _designPath = _path.join(__dirname, '..', 'DESIGN.md');
      try {
        const _raw = _fs.readFileSync(_designPath, 'utf8');
        const _match = _raw.match(/^---\n([\s\S]*?)\n---/);
        if (_match) return _yaml.parse(_match[1]) || {};
      } catch (_) { /* ignore */ }
      return {};
    }

    const _session = _loadSession();
    const _design = _loadDesign();

    const output = {
      version: require('./package.json').version,
      mode: _session.mode,
      theme: _session.theme,
      todos: _session.todos.map(t => ({ text: t.text || t, done: t.done || false })),
      sandboxCwd: _session.sandboxCwd,
      design: {
        colors: _design.colors || {},
        typography: _design.typography || {},
        rounded: _design.rounded || {},
        spacing: _design.spacing || {},
        components: _design.components || {},
      },
      capabilities: {
        slashCommands: ['/exit', '/clear', '/sandbox clear', '/export log', '/save', '/notify test', '/help', '/theme <name>', '/mode <name>'],
        shortcuts: { 'ctrl+p': 'palette', 'ctrl+t': 'cycle theme', 'ctrl+s': 'save session', 'ctrl+l': 'clear log', 'tab': 'next pane', 'space': 'toggle todo', 'esc': 'exit' },
        themes: ['cyberpunk', 'nord', 'dracula', 'catppuccin', 'warm'],
        modes: ['BUILD', 'PLAN', 'REVIEW', 'DEBUG'],
      },
      status: 'ok',
    };

    console.log(JSON.stringify(output, null, 2));
    process.exit(0);
  }
}

// ─── Subcommand routing (Phase 2) ──────────────────────────────────────────
// Runs synchronously (commands uses execSync internally) so the TUI/non-TTY
// fallback below is never reached when a subcommand is invoked.
{
  const _args = process.argv.slice(2);
  const _matched = _args.find(a => _SUBCOMMANDS.includes(a));
  if (_matched) {
    const cmds = require('./commands');
    const cmd = { status: cmds.status, surfaces: cmds.surfaces, deploy: cmds.deploy, love: cmds.love, monetization: cmds.monetization }[_matched];
    const opts = { agent: _args.includes('--agent') || _args.includes('-a') };

    // Extract per-command options
    const getOpt = (flag) => { const i = _args.indexOf(flag); return i !== -1 ? _args[i + 1] : undefined; };
    if (_matched === 'status') opts.service = getOpt('--service');
    if (_matched === 'surfaces') opts.name = getOpt('--name');
    if (_matched === 'deploy') {
      opts.app = getOpt('--app');
      opts.env = getOpt('--env') || 'production';
      opts.dryRun = _args.includes('--dry-run');
      opts.yes = _args.includes('--yes');
      opts.nonInteractive = _args.includes('--non-interactive');
    }
    if (_matched === 'love') {
      opts.subcommand = _args.find(a => ['status', 'balance', 'sync'].includes(a)) || 'status';
      opts.userId = getOpt('balance') || getOpt('sync') || process.env.P31_USER_ID || 'guest';
    }
    if (_matched === 'monetization') {
      opts.target = _args.find(a => ['revenue', 'entitlement', 'allocation'].includes(a)) || 'revenue';
      opts.subcommand = _args.find(a => ['record', 'balance', 'summary', 'check', 'tier', 'create', 'status'].includes(a)) || 'status';
      opts.source = getOpt('--source');
      opts.range = getOpt('--range') || '30d';
      opts.did = getOpt('--did');
      opts['payer-did'] = getOpt('--payer-did');
      opts['merchant-did'] = getOpt('--merchant-did');
      opts.amount = getOpt('--amount');
      opts.asset = getOpt('--asset');
      opts['tool-id'] = getOpt('--tool-id');
      opts.cost = getOpt('--cost');
      opts.tier = getOpt('--tier');
      opts['tx-id'] = getOpt('--tx-id');
      opts.weight = getOpt('--weight');
    }

    cmd(opts);
    process.exit(0);
  }
}

// ─── TTY Gate ────────────────────────────────────────────────────────────────
if (!process.stdout.isTTY || !process.stdin.isTTY) {
  const args = process.argv.slice(2);
  if (args.includes('--version') || args.includes('-v')) {
    console.log('andromeda-cli v1.0.0');
    process.exit(0);
  }
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
andromeda-cli v1.0.0

USAGE
  andromeda              Launch interactive TUI
  andromeda status       Check health of gateway and services
  andromeda surfaces     List PHOS surfaces
  andromeda deploy       Deploy an app to Cloudflare Pages/Workers
  andromeda love         LOVE ledger status/balance/sync
  andromeda monetization Monetization engine (revenue/entitlement/allocation)
  andromeda --agent      Output session state as JSON
  andromeda --help       Show this help
  andromeda --version    Show version
`);
    process.exit(0);
  }
  console.error('[P31] Requires an interactive TTY.');
  process.exit(1);
}

// Lazy-load TUI dependencies — in optionalDependencies so npm install always
// succeeds in headless agent environments. The --agent path exits above before
// reaching here, so these are only required when a TTY is present.
let blessed, contrib, pty;
try {
  blessed = require('blessed');
  contrib = require('blessed-contrib');
  pty = require('node-pty');
} catch (e) {
  console.error('[P31] TUI dependencies not available. Install build essentials and reinstall:');
  console.error('[P31]   npm install -g @p31/andromeda-cli');
  console.error('[P31] For headless agent mode, use: andromeda --agent');
  process.exit(1);
}

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// ═════════════════════════════════════════════════════════════════════════════
// THEME SYSTEM — 4 presets, hot-swappable
// ═════════════════════════════════════════════════════════════════════════════

const THEMES = {
  cyberpunk: {
    name: 'Cyberpunk',
    bg: '#0a0e17', fg: '#00ffcc', accent: '#ff00ff', neon: '#39ff14',
    muted: '#4a5568', danger: '#ff3366', warning: '#ffaa00',
    border: { fg: '#ff00ff' }, logTime: '#4a5568',
    logInfo: '#00ffcc', logWarn: '#ffaa00', logErr: '#ff3366', logOk: '#39ff14',
  },
  nord: {
    name: 'Nord',
    bg: '#2e3440', fg: '#88c0d0', accent: '#81a1c1', neon: '#a3be8c',
    muted: '#4c566a', danger: '#bf616a', warning: '#d08770',
    border: { fg: '#81a1c1' }, logTime: '#4c566a',
    logInfo: '#88c0d0', logWarn: '#d08770', logErr: '#bf616a', logOk: '#a3be8c',
  },
  dracula: {
    name: 'Dracula',
    bg: '#282a36', fg: '#f8f8f2', accent: '#bd93f9', neon: '#50fa7b',
    muted: '#6272a4', danger: '#ff5555', warning: '#ffb86c',
    border: { fg: '#bd93f9' }, logTime: '#6272a4',
    logInfo: '#f8f8f2', logWarn: '#ffb86c', logErr: '#ff5555', logOk: '#50fa7b',
  },
  catppuccin: {
    name: 'Catppuccin',
    bg: '#1e1e2e', fg: '#cdd6f4', accent: '#cba6f7', neon: '#a6e3a1',
    muted: '#6c7086', danger: '#f38ba8', warning: '#fab387',
    border: { fg: '#cba6f7' }, logTime: '#6c7086',
    logInfo: '#cdd6f4', logWarn: '#fab387', logErr: '#f38ba8', logOk: '#a6e3a1',
  },
  warm: {
    name: 'P31 Precision',
    bg: '#201d1d', fg: '#fdfcfc', accent: '#7c3aed', neon: '#7c3aed',
    muted: '#9a9898', danger: '#ff3b30', warning: '#f59e0b',
    border: { fg: '#2a2626' }, logTime: '#6b6868',
    logInfo: '#fdfcfc', logWarn: '#f59e0b', logErr: '#ff3b30', logOk: '#30d158',
  },
};

// ═════════════════════════════════════════════════════════════════════════════
// SESSION — persisted to ~/.p31/cli-session.json
// ═════════════════════════════════════════════════════════════════════════════

const SESSION_DIR = path.join(os.homedir(), '.p31');
const SESSION_FILE = path.join(SESSION_DIR, 'cli-session.json');

function loadSession() {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      const raw = fs.readFileSync(SESSION_FILE, 'utf-8');
      const saved = JSON.parse(raw);
      return {
        theme: saved.theme || 'warm',
        todos: saved.todos || [],
        log: saved.log || [],
        mode: saved.mode || 'BUILD',
        sandboxCwd: saved.sandboxCwd || process.cwd(),
      };
    }
  } catch (e) { /* corrupt file, start fresh */ }
  return {
    theme: 'warm',
    todos: [],
    log: [],
    mode: 'BUILD',
    sandboxCwd: process.cwd(),
  };
}

function saveSession() {
  try {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
    const data = {
      theme: currentThemeName,
      todos: state.todos,
      log: state.logBuffer.slice(-200),
      mode: state.mode,
      sandboxCwd: state.sandboxCwd,
      savedAt: new Date().toISOString(),
    };
    fs.writeFileSync(SESSION_FILE, JSON.stringify(data, null, 2));
  } catch (e) { /* non-fatal */ }
}

// ═════════════════════════════════════════════════════════════════════════════
// STATE
// ═════════════════════════════════════════════════════════════════════════════

const session = loadSession();
let currentThemeName = session.theme;
let currentTheme = THEMES[currentThemeName] || THEMES.warm;

const state = {
  mode: session.mode,
  model: 'deepseek-v4-flash',
  tokens: { used: 1247, limit: 128000 },
  spend: 0.014,
  lspConnected: true,
  todos: session.todos.length ? session.todos : [
    { text: 'Parse input', done: true },
    { text: 'Run tests', done: false },
    { text: 'Deploy to staging', done: false },
    { text: 'Review PR #42', done: false },
  ],
  logBuffer: session.log,
  logMax: 500,
  progress: 0.42,
  ptyBusy: false,
  sandboxCwd: session.sandboxCwd,
  paletteOpen: false,
  helpOpen: false,
  commandHistory: [],
  historyIndex: -1,
  notifications: [],
  lastScrollPos: 0,
  isUserScrolling: false,
};

// ═════════════════════════════════════════════════════════════════════════════
// SCREEN
// ═════════════════════════════════════════════════════════════════════════════

const screen = blessed.screen({
  smartCSR: true,
  title: 'P31 Oasis CLI',
  fullUnicode: true,
  warnings: false,
  dockBorders: true,
  autoPadding: true,
  defaultPadding: { top: 0, left: 1, right: 1, bottom: 0 },
});

// ═════════════════════════════════════════════════════════════════════════════
// WIDGETS
// ═════════════════════════════════════════════════════════════════════════════

let topBar, logBox, sandboxBox, metaBox, todoBox, inputBar, footer;
let notificationManager;

function createWidgets() {
  const t = currentTheme;

  topBar = blessed.box({
    parent: screen,
    top: 0, left: 0, width: '100%', height: 1,
    tags: true,
    style: { fg: t.fg, bg: t.bg, bold: true },
  });

  logBox = blessed.box({
    parent: screen,
    top: 1, left: 0, width: '70%', height: '60%',
    label: ' {cyan-fg}◉ LOG{/cyan-fg} ',
    scrollable: true,
    alwaysScroll: true,
    scrollbar: { ch: ' ' },
    keys: true,
    vi: true,
    mouse: true,
    tags: true,
    style: { fg: t.fg, bg: t.bg, border: { fg: t.border.fg } },
    border: { type: 'line', fg: t.border.fg },
  });

  sandboxBox = blessed.box({
    parent: screen,
    top: '61%', left: 0, width: '70%', height: '39%',
    label: ' {green-fg}◉ SANDBOX{/green-fg} ',
    scrollable: true,
    alwaysScroll: true,
    scrollbar: { ch: ' ' },
    keys: true,
    vi: true,
    mouse: true,
    tags: true,
    input: true,
    style: { fg: t.neon, bg: t.bg, border: { fg: t.neon } },
    border: { type: 'line', fg: t.neon },
  });

  metaBox = blessed.box({
    parent: screen,
    top: 1, left: '70%', width: '30%', height: '40%',
    label: ' {grey-fg}▸ META{/grey-fg} ',
    tags: true,
    scrollable: true,
    style: { fg: t.fg, bg: t.bg, border: { fg: t.muted } },
    border: { type: 'line', fg: t.muted },
  });

  todoBox = blessed.list({
    parent: screen,
    top: '41%', left: '70%', width: '30%', height: '59%',
    label: ' {grey-fg}▸ TODOS{/grey-fg} ',
    tags: true,
    keys: true,
    vi: true,
    mouse: true,
    style: {
      fg: t.fg, bg: t.bg,
      border: { fg: t.muted },
      selected: { bg: t.muted, fg: t.bg },
    },
    border: { type: 'line', fg: t.muted },
    items: renderTodoItems(),
  });

  inputBar = blessed.textbox({
    parent: screen,
    bottom: 1, left: 0, width: '100%', height: 1,
    tags: true,
    style: { fg: t.fg, bg: t.bg, border: { fg: t.accent } },
    border: { type: 'line', fg: t.accent },
    inputOnFocus: true,
    padding: { left: 1, right: 1 },
  });

  footer = blessed.box({
    parent: screen,
    bottom: 0, left: 0, width: '100%', height: 1,
    tags: true,
    style: { fg: t.muted, bg: t.bg },
  });

  // Notification overlay layer
  notificationManager = new NotificationManager(screen, t);

  screen.append(topBar);
  screen.append(logBox);
  screen.append(sandboxBox);
  screen.append(metaBox);
  screen.append(todoBox);
  screen.append(inputBar);
  screen.append(footer);
}

// ═════════════════════════════════════════════════════════════════════════════
// NOTIFICATION SYSTEM — auto-dismissing toasts
// ═════════════════════════════════════════════════════════════════════════════

class NotificationManager {
  constructor(screen, theme) {
    this.screen = screen;
    this.theme = theme;
    this.notifications = [];
    this.maxNotifications = 3;
  }

  show(message, type = 'info', duration = 4000) {
    const colors = {
      info: this.theme.fg,
      ok: this.theme.neon,
      warn: this.theme.warning,
      err: this.theme.danger,
    };
    const glyphs = { info: 'i', ok: '✓', warn: '!', err: '✗' };

    const box = blessed.box({
      parent: this.screen,
      top: this.notifications.length + 1,
      right: 0,
      width: Math.min(60, Math.floor(this.screen.width * 0.4)),
      height: 3,
      tags: true,
      content: `{bold}{${colors[type]}-fg}[${glyphs[type]}]{/${colors[type]}-fg}{/bold}  ${message}`,
      style: {
        fg: colors[type],
        bg: this.theme.bg,
        border: { fg: colors[type] },
      },
      border: { type: 'line', fg: colors[type] },
      hidden: true,
    });

    this.screen.append(box);
    box.show();
    this.notifications.push({ box, timeout: setTimeout(() => this.dismiss(box), duration) });

    if (this.notifications.length > this.maxNotifications) {
      this.dismiss(this.notifications[0].box);
    }
    this.screen.render();
  }

  dismiss(box) {
    box.destroy();
    this.notifications = this.notifications.filter(n => {
      if (n.box === box) { clearTimeout(n.timeout); return false; }
      return true;
    });
    this.reflow();
  }

  reflow() {
    this.notifications.forEach((n, i) => {
      n.box.style.top = i + 1;
    });
    this.screen.render();
  }

  updateTheme(theme) {
    this.theme = theme;
  }
}

// ─── Shortcut: notify(this, 'ok', 'Theme switched') ─────────────────────────

function notify(message, type = 'info', duration = 4000) {
  notificationManager.show(message, type, duration);
}

// ═════════════════════════════════════════════════════════════════════════════
// PTY SANDBOX — persistent shell session
// ═════════════════════════════════════════════════════════════════════════════

let shell;

function initSandbox() {
  const cols = Math.max(20, Math.floor((screen.cols || 80) * 0.68) - 4);
  const rows = Math.max(5, Math.floor(((screen.rows || 24) - 4) * 0.38) - 3);
  try {
    shell = pty.spawn(process.env.SHELL || 'bash', [], {
      name: 'xterm-256color',
      cols, rows,
      cwd: state.sandboxCwd,
      env: { ...process.env, TERM: 'xterm-256color', P31_THEME: currentThemeName },
    });
    shell.on('data', (data) => {
      state.ptyBusy = true;
      const safe = data
        .replace(/[\x00-\x08\x0e-\x1f]/g, '')
        .replace(/\x1b\[[0-9;]*[A-Za-z]/g, (m) => m)
        .slice(0, 4000);
      const content = sandboxBox.getContent() + safe;
      const lines = content.split('\n');
      if (lines.length > 800) lines.splice(0, lines.length - 800);
      sandboxBox.setContent(lines.join('\n'));
      sandboxBox.setScrollPerc(100);
      state.ptyBusy = false;
      screen.render();
    });
    shell.on('exit', () => {
      appLog('warn', 'Sandbox session ended — reconnecting in 1s…');
      notify('Sandbox reconnecting…', 'warn');
      setTimeout(initSandbox, 1000);
    });
    sandboxBox.setContent(
      `{${currentTheme.neon}-fg}\u25b8{/${currentTheme.neon}-fg} Sandbox ready ({bold}${state.sandboxCwd}{/bold})\n` +
      `{${currentTheme.muted}-fg}Type /help for commands. Tab to focus. Your shell session is persistent.{/${currentTheme.muted}-fg}\n\n`
    );
    appLog('ok', 'Sandbox initialised');
  } catch (e) {
    sandboxBox.setContent(`{${currentTheme.danger}-fg}Sandbox unavailable: ${e.message}{/${currentTheme.danger}-fg}\n{e.message}{/}`);
    appLog('err', `Sandbox failed: ${e.message}`);
  }
}

function resizeSandbox() {
  if (!shell) return;
  const cols = Math.max(20, Math.floor((screen.cols || 80) * 0.68) - 4);
  const rows = Math.max(5, Math.floor(((screen.rows || 24) - 4) * 0.38) - 3);
  try { shell.resize(cols, rows); } catch (e) { /* ignore */ }
}

function runInSandbox(cmd) {
  if (!shell || process.platform === 'win32') {
    appLog('err', 'Sandbox not ready — command queued');
    return;
  }
  state.sandboxCwd = shell.cwd || state.sandboxCwd;
  shell.write(cmd + '\n');
  appLog('info', `$ ${cmd}`);
  state.commandHistory.push(cmd);
  state.historyIndex = state.commandHistory.length;
}

// ═════════════════════════════════════════════════════════════════════════════
// LOG SYSTEM — streaming, scrollable, timestamped, colour-coded
// ═════════════════════════════════════════════════════════════════════════════

function ts() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
}

const GL = { info: '▸', ok: '✓', warn: '!', err: '✗', step: '→', dry: '~' };
const GC = { info: 'cyan', ok: 'green', warn: 'yellow', err: 'red', step: 'blue', dry: 'grey' };

function appLog(level, msg) {
  const c = currentTheme;
  const ts_ = ts();
  const tsColor = c.logTime;
  const lvlColor = c[`log${level.charAt(0).toUpperCase() + level.slice(1)}`] || c.logInfo;
  const line = `{${tsColor}-fg}[${ts_}]{/${tsColor}-fg} {bold}{${lvlColor}-fg}${GL[level]}{/${lvlColor}-fg}{/bold} ${msg}`;
  pushLog(line, level);
}

function pushLog(line, level) {
  const content = logBox.getContent();
  const lines = content.split('\n').filter(l => l.length > 0);
  lines.push(line);
  if (lines.length > state.logMax) lines.splice(0, lines.length - state.logMax);
  state.logBuffer = lines.map(l => l.replace(/\{[^}]+\}/g, '').trim());
  logBox.setContent(lines.join('\n'));
  if (!state.isUserScrolling) {
    logBox.setScrollPerc(100);
  }
  screen.render();
}

function clearLog() {
  logBox.setContent('');
  state.logBuffer = [];
  screen.render();
}

// ═════════════════════════════════════════════════════════════════════════════
// TODO LIST — reactive, keyboard-togglable, persistent
// ═════════════════════════════════════════════════════════════════════════════

function renderTodoItems() {
  return state.todos.map((t) => {
    const c = currentTheme;
    const box = t.done
      ? `{${c.todoDone}-fg}[✓]{/${c.todoDone}-fg}`
      : `{${c.todoPending}-fg}[•]{/${c.todoPending}-fg}`;
    return `${box}  ${t.text}`;
  });
}

function toggleTodo() {
  const idx = todoBox.selected;
  if (idx >= 0 && idx < state.todos.length) {
    state.todos[idx].done = !state.todos[idx].done;
    todoBox.setItems(renderTodoItems());
    todoBox.select(idx);
    screen.render();
    const t = state.todos[idx];
    appLog('info', `Todo ${idx + 1}: ${t.done ? '✓ done' : '○ pending'} — "${t.text}"`);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// RENDER PIPELINE — all panes refresh in a single screen.render() call
// ═════════════════════════════════════════════════════════════════════════════

function renderAll() {
  const t = currentTheme;
  const pct = Math.round(state.progress * 100);
  const pctColor = state.progress < 0.3 ? t.danger : state.progress < 0.7 ? t.warning : t.neon;

  const bar = (
    ` {bold}{${t.neon}-fg}●{/${t.neon}-fg}{/bold} ` +
    `{bold}${state.mode}{/bold}{${t.muted}-fg} · BIG PICKLE{/${t.muted}-fg}` +
    `{right}{${t.muted}-fg}v1.0.0  │  ${pctColor}${'█'.repeat(Math.floor(pct / 5))}${'░'.repeat(20 - Math.floor(pct / 5))} ${pct}%{/${t.muted}-fg}  │ ` +
    `${state.tokens.used.toLocaleString()} tok  │ ` +
    `{${t.accent}-fg}${t.name}{/${t.accent}-fg}`
  );
  topBar.setContent(bar);

  metaBox.setContent(
    `{bold}META{/bold}\n\n` +
    `{${t.muted}-fg}Model:{/${t.muted}-fg}     {bold}${state.model}{/bold}\n` +
    `{${t.muted}-fg}Tokens:{/${t.muted}-fg}     ${state.tokens.used.toLocaleString()} / ${state.tokens.limit.toLocaleString()}\n` +
    `{${t.muted}-fg}Spend:{/${t.muted}-fg}      {bold}$${state.spend.toFixed(3)}{/bold}\n` +
    `{${t.muted}-fg}Mode:{/${t.muted}-fg}       {${t.accent}-fg}${state.mode}{/${t.accent}-fg}\n` +
    `{${t.muted}-fg}LSP:{/${t.muted}-fg}        ${state.lspConnected ? `{${t.neon}-fg}● connected{/${t.neon}-fg}` : `{${t.danger}-fg}● disconnected{/${t.danger}-fg}`}\n` +
    (state.ptyBusy ? `{${t.warning}-fg}▸ sandbox busy…{/${t.warning}-fg}\n` : '') +
    `\n{bold}SHORTCUTS{/bold}\n\n` +
    `{${t.accent}-fg}ctrl+p{/${t.accent}-fg} palette\n` +
    `{${t.accent}-fg}ctrl+t{/${t.accent}-fg} cycle theme\n` +
    `{${t.accent}-fg}ctrl+s{/${t.accent}-fg} save session\n` +
    `{${t.accent}-fg}ctrl+l{/${t.accent}-fg} clear log\n` +
    `{${t.accent}-fg}space{/${t.accent}-fg}  toggle todo\n` +
    `{${t.accent}-fg}tab{/${t.accent}-fg}     next pane`
  );

  footer.setContent(
    ` {${t.muted}-fg}[tab] focus  [ctrl+p] palette  [ctrl+t] theme  [ctrl+l] clear  [space] todo  [esc] exit{/${t.muted}-fg}`
  );

  inputBar.setContent(
    ` {${t.accent}-fg}▸{/${t.accent}-fg} {bold}${state.mode}{/bold}  ` +
    `{${t.muted}-fg}·{/${t.muted}-fg}  {bold}${currentThemeName}{/bold}  ` +
    `{${t.muted}-fg}·{/${t.muted}-fg}  type a command{/${t.fg}}`
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// THEME HOT-SWAP
// ═════════════════════════════════════════════════════════════════════════════

function applyTheme(theme) {
  currentTheme = theme;
  screen.style.bg = theme.bg;
  screen.style.fg = theme.fg;

  const styledWidgets = [topBar, logBox, sandboxBox, metaBox, todoBox, inputBar, footer];
  styledWidgets.forEach((w) => {
    w.style.fg = theme.fg;
    w.style.bg = theme.bg;
    if (w.style.border) w.style.border.fg = theme.muted;
    if (w.options && w.options.style && w.options.style.border) {
      // refresh border colours based on type
    }
  });

  // Per-widget overrides
  logBox.style.border.fg = theme.border.fg;
  sandboxBox.style.fg = theme.neon;
  sandboxBox.style.border.fg = theme.neon;
  metaBox.style.border.fg = theme.muted;
  todoBox.style.fg = theme.fg;
  todoBox.style.border.fg = theme.muted;
  todoBox.style.selected = { bg: theme.muted, fg: theme.bg };
  inputBar.style.fg = theme.fg;
  inputBar.style.border.fg = theme.accent;
  footer.style.fg = theme.muted;

  notificationManager.updateTheme(theme);

  // Rebuild list items with new theme colours
  todoBox.setItems(renderTodoItems());

  if (shell) {
    try { shell.write(`export P31_THEME=${currentThemeName}\n`); } catch (e) { /* ignore */ }
  }
  renderAll();
  screen.render();
}

const THEME_ORDER = Object.keys(THEMES);
let themeIdx = THEME_ORDER.indexOf(currentThemeName);

function cycleTheme() {
  themeIdx = (themeIdx + 1) % THEME_ORDER.length;
  currentThemeName = THEME_ORDER[themeIdx];
  currentTheme = THEMES[currentThemeName];
  applyTheme(currentTheme);
  appLog('ok', `Theme → ${currentTheme.name}`);
  notify(`Theme: ${currentTheme.name}`, 'ok');
  saveSession();
}

function setTheme(name) {
  if (THEMES[name]) {
    currentThemeName = name;
    currentTheme = THEMES[name];
    themeIdx = THEME_ORDER.indexOf(name);
    applyTheme(currentTheme);
    appLog('ok', `Theme → ${currentTheme.name}`);
    notify(`Theme: ${currentTheme.name}`, 'ok');
    saveSession();
  } else {
    appLog('warn', `Unknown theme "${name}". Options: ${THEME_ORDER.join(', ')}`);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// FOCUS MANAGEMENT
// ═════════════════════════════════════════════════════════════════════════════

const PANES = () => [logBox, sandboxBox, todoBox, inputBar];
let focusIdx = 0;

function cycleFocus(dir) {
  const panes = PANES();
  focusIdx = (focusIdx + dir + panes.length) % panes.length;
  panes[focusIdx].focus();
  screen.render();
}

// ═════════════════════════════════════════════════════════════════════════════
// COMMAND PALETTE
// ═════════════════════════════════════════════════════════════════════════════

const PALETTE_COMMANDS = [
  '/theme cyberpunk', '/theme nord', '/theme dracula', '/theme catppuccin',
  '/mode build', '/mode plan', '/mode review', '/mode debug',
  '/clear', '/sandbox clear', '/export log',
  '/save', '/notify test', '/help',
  'monetization revenue summary', 'monetization entitlement check',
];

function openPalette() {
  if (state.paletteOpen) return;
  state.paletteOpen = true;

  const palette = blessed.list({
    parent: screen,
    top: 'center', left: 'center',
    width: '45%', height: '60%',
    label: ' COMMAND PALETTE ',
    keys: true, vi: true, mouse: true,
    items: PALETTE_COMMANDS,
    tags: true,
    style: {
      fg: currentTheme.fg, bg: currentTheme.bg,
      border: { fg: currentTheme.accent },
      selected: { bg: currentTheme.accent, fg: currentTheme.bg },
    },
    border: { type: 'line', fg: currentTheme.accent },
    padding: { left: 2, right: 2 },
  });

  palette.key(['escape'], () => {
    palette.destroy();
    state.paletteOpen = false;
    screen.render();
  });
  palette.key(['enter'], () => {
    const cmd = PALETTE_COMMANDS[palette.selected];
    palette.destroy();
    state.paletteOpen = false;
    executeCommand(cmd);
  });
  palette.focus();
  screen.render();
}

function executeCommand(cmd) {
  switch (cmd) {
    case '/exit':
      notify('Goodbye.', 'info');
      setTimeout(() => process.exit(0), 300);
      break;
    case '/clear':
      clearLog();
      appLog('info', 'Log cleared');
      break;
    case '/sandbox clear':
      sandboxBox.setContent('');
      screen.render();
      break;
    case '/export log':
      exportLog();
      break;
    case '/save':
      saveSession();
      notify('Session saved', 'ok');
      appLog('ok', 'Session state saved to ' + SESSION_FILE);
      break;
    case '/notify test':
      notify('This is a test notification', 'info');
      setTimeout(() => notify('Second notification (warn)', 'warn'), 250);
      setTimeout(() => notify('Third notification (ok)', 'ok', 6000), 500);
      break;
    case '/help':
      showHelp();
      break;
    default:
      if (cmd.startsWith('/theme ')) setTheme(cmd.replace('/theme ', ''));
      else if (cmd.startsWith('/mode ')) {
        state.mode = cmd.replace('/mode ', '').toUpperCase();
        renderAll();
        screen.render();
        appLog('info', `Mode → ${state.mode}`);
      }
      else runInSandbox(cmd);
  }
  saveSession();
}

function exportLog() {
  try {
    const clean = logBox.getContent().replace(/\{[^}]+\}/g, '').replace(/\x1b\[[0-9;]*[mK]/g, '');
    const fd = fs.openSync(`p31-oasis-log-${Date.now()}.txt`, 'w');
    fs.writeSync(fd, clean);
    fs.closeSync(fd);
    appLog('ok', 'Log exported');
    notify('Log exported to file', 'ok');
  } catch (e) {
    appLog('err', `Export failed: ${e.message}`);
  }
}

function showHelp() {
  if (state.helpOpen) return;
  state.helpOpen = true;

  const c = currentTheme;
  const helpText = [
    `{bold}KEYBOARD SHORTCUTS{/bold}`,
    `  {${c.accent}-fg}[tab]{/${c.accent}-fg}         Focus next pane`,
    `  {${c.accent}-fg}[S-tab]{/${c.accent}-fg}       Focus previous pane`,
    `  {${c.accent}-fg}[ctrl+p]{/${c.accent}-fg}      Command palette`,
    `  {${c.accent}-fg}[ctrl+t]{/${c.accent}-fg}      Cycle theme`,
    `  {${c.accent}-fg}[ctrl+s]{/${c.accent}-fg}      Save session`,
    `  {${c.accent}-fg}[ctrl+l]{/${c.accent}-fg}      Clear log`,
    `  {${c.accent}-fg}[space]{/${c.accent}-fg}       Toggle selected todo`,
    `  {${c.accent}-fg}[up/down]{/${c.accent}-fg}     Scroll / navigate`,
    `  {${c.accent}-fg}[pgup/pgdn]{/${c.accent}-fg}   Page scroll`,
    `  {${c.accent}-fg}[esc]{/${c.accent}-fg}         Exit`,
    ``,
    `{bold}COMMANDS{/bold}`,
    `  {${c.neon}-fg}/theme <name>{/${c.neon}-fg}     Switch theme`,
    `  {${c.neon}-fg}/mode <name>{/${c.neon}-fg}      Set mode (build/plan/review/debug)`,
    `  {${c.neon}-fg}/clear{/${c.neon}-fg}             Clear log`,
    `  {${c.neon}-fg}/sandbox clear{/${c.neon}-fg}     Clear sandbox output`,
    `  {${c.neon}-fg}/export log{/${c.neon}-fg}        Export log to file`,
    `  {${c.neon}-fg}/save{/${c.neon}-fg}              Save session state`,
    `  {${c.neon}-fg}/notify test{/${c.neon}-fg}       Test notifications`,
    `  {${c.neon}-fg}/help{/${c.neon}-fg}              Show this help`,
    ``,
    ` {${c.muted}-fg}Any other input is sent to the sandbox shell.{/${c.muted}-fg}`,
  ].join('\n');

  const help = blessed.box({
    parent: screen,
    top: 'center', left: 'center',
    width: '55%', height: '65%',
    label: ' HELP ',
    content: helpText,
    tags: true,
    keys: true, vi: true,
    scrollable: true,
    style: {
      fg: c.fg, bg: c.bg,
      border: { fg: c.accent },
    },
    border: { type: 'line', fg: c.accent },
    padding: { left: 2, right: 2 },
  });
  help.key(['escape', 'q'], () => { help.destroy(); state.helpOpen = false; screen.render(); });
  help.focus();
  screen.render();
}

// ═════════════════════════════════════════════════════════════════════════════
// KEYBOARD SHORTCUTS
// ═════════════════════════════════════════════════════════════════════════════

screen.key(['escape', 'C-c'], () => {
  saveSession();
  process.exit(0);
});

screen.key(['tab'], () => cycleFocus(1));
screen.key(['S-tab'], () => cycleFocus(-1));

screen.key(['C-p'], () => openPalette());
screen.key(['C-t'], () => cycleTheme());
screen.key(['C-l'], () => { clearLog(); appLog('info', 'Log cleared'); });
screen.key(['C-s'], () => {
  saveSession();
  notify('Session saved', 'ok');
  appLog('ok', `Saved to ${SESSION_FILE}`);
});

screen.key(['space'], () => {
  if (todoBox.hasFocus()) toggleTodo();
});

// ─── Input handling ──────────────────────────────────────────────────────────

inputBar.on('submit', (text) => {
  const cmd = (text || '').trim();
  inputBar.clearValue();
  if (!cmd) { screen.render(); return; }
  if (cmd.startsWith('/')) executeCommand(cmd);
  else runInSandbox(cmd);
  screen.render();
});

// ─── Scroll-aware auto-follow in log ─────────────────────────────────────────

logBox.on('scroll', () => {
  const max = logBox.scroll - logBox.height;
  state.isUserScrolling = logBox.scroll < state.logBuffer.length - logBox.height - 2;
});

// ═════════════════════════════════════════════════════════════════════════════
// RESIZE — recalculate sandbox PTY dimensions, reflow notifications
// ═════════════════════════════════════════════════════════════════════════════

screen.on('resize', () => {
  resizeSandbox();
  notificationManager.reflow();
  screen.render();
});

// ═════════════════════════════════════════════════════════════════════════════
// DEMO SIMULATION — realistic activity stream for testing the UI
// ═════════════════════════════════════════════════════════════════════════════

function bootstrap() {
  const lines = [
    { level: 'info', msg: `P31 Oasis CLI ${currentTheme.name} — initialising…` },
    { level: 'info', msg: `Loaded ${state.todos.length} todos from session` },
    { level: 'info', msg: `Sandbox: ${state.sandboxCwd}` },
    { level: 'ok', msg: 'Module resolution complete: blessed, contrib, node-pty' },
    { level: 'ok', msg: `Session restored from ${SESSION_FILE}` },
    { level: 'info', msg: 'Reading workspace files…' },
    { level: 'warn', msg: '2 deprecation warnings in cli/dependencies' },
    { level: 'ok', msg: 'Found 12 source files across 3 packages' },
    { level: 'info', msg: 'Running dependency analysis…' },
    { level: 'ok', msg: 'Dependency tree verified — no critical issues' },
    { level: 'info', msg: 'Running test suite…' },
    { level: 'err', msg: 'Unit test failed: auth-flow.spec.js:47', delay: 800 },
    { level: 'warn', msg: 'Root cause: token expiry mismatch in refresh logic' },
    { level: 'info', msg: 'Auto-fix applied: updated token refresh handler' },
    { level: 'info', msg: 'Re-running failed test…' },
    { level: 'ok', msg: 'Unit test passed: auth-flow.spec.js:47' },
    { level: 'info', msg: 'Running full test suite…' },
    { level: 'ok', msg: 'All 142 tests passed — 87.3% coverage' },
    { level: 'info', msg: 'Running lint…' },
    { level: 'warn', msg: '1 unused variable in utils/helpers.ts' },
    { level: 'info', msg: 'Patching…' },
    { level: 'ok', msg: 'Lint clean' },
    { level: 'info', msg: 'Compiling bundle…' },
    { level: 'ok', msg: 'Bundle: 2.4 MB (gzip: 612 KB)' },
    { level: 'info', msg: 'Deploying to staging…' },
    { level: 'ok', msg: 'Deployed: andromeda-v1.0.0-staging' },
    { level: 'ok', msg: `Build complete — ${state.todos.filter(t=>t.done).length}/${state.todos.length} todos done` },
  ];

  let i = 0;
  const tick = setInterval(() => {
    if (i >= lines.length) {
      clearInterval(tick);
      state.progress = 1.0;
      renderAll();
      appLog('ok', 'Ready. Type a command, press / for palette, or Tab to navigate.');
      setTimeout(() => notify('System ready', 'ok', 3000), 200);
      return;
    }
    const l = lines[i];
    appLog(l.level, l.msg);
    state.progress = (i + 1) / lines.length;
    renderAll();
    screen.render();
    i++;
  }, l.delay || 300);

  // ─── Periodic heartbeat ────────────────────────────────────────────────────
  setInterval(() => {
    notify(SystemMetrics(), 'info', 2000);
  }, 30000);
}

function SystemMetrics() {
  const used = Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 10) / 10;
  const rss = Math.round((process.memoryUsage().rss / 1024 / 1024) * 10) / 10;
  return `Heap: ${used}MB  RSS: ${rss}MB`;
}

// ═════════════════════════════════════════════════════════════════════════════
// INIT — boot the TUI
// ═════════════════════════════════════════════════════════════════════════════

createWidgets();
initSandbox();
renderAll();
todoBox.setItems(renderTodoItems());

// Replay previous log into the log pane
state.logBuffer.forEach((line) => {
  const c = currentTheme;
  const ts_ = ts();
  const formatted = `{${c.logTime}-fg}[${ts_}]{/${c.logTime}-fg} {bold}{${c.logInfo}-fg}→{/${c.logInfo}-fg}{/bold} ${line}`;
  pushLog(formatted, 'info');
});

appLog('info', 'P31 Oasis CLI v1.0.0 started');
appLog('info', `Theme: ${currentTheme.name}  |  Model: ${state.model}`);
appLog('info', 'Tab to navigate • Ctrl+P palette • Ctrl+T cycle theme');
appLog('info', 'Type /help for commands, or any text to sandbox');

bootstrap();
screen.render();
logBox.focus();

// Graceful exit handler
process.on('SIGINT', () => { saveSession(); process.exit(0); });
process.on('exit', () => saveSession());
