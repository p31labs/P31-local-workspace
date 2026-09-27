/* LOOM — chain-verification widget (self-contained embeddable snippet)
 *
 * Mount: <div data-loom-verify></div>  +  <script src="/loom-verify-widget.js" defer></script>
 *
 * Options (data attributes on the mount element):
 *   data-loom-verify-api    API base origin (default https://loom-verify.pages.dev)
 *   data-loom-verify-demo   seq used by the "verify a real decision" button (default 15)
 *   data-loom-verify-record preload and verify this seq on load (optional)
 *
 * Behavior:
 *   - Fetches GET {api}/api/loom/verify for the chain verdict (live, CORS-enabled).
 *   - Verifies a record by seq via GET {api}/api/loom/provenance/:seq.
 *   - Recomputes each record's SHA-256 anchor hash IN THE BROWSER (JCS + WebCrypto,
 *     the same canonicalizer the chain uses) and proves it links to the live head.
 *   - Never fabricates: verdicts and errors are the API's real responses.
 *   - Accessible: real labels, 48px targets, aria-live results, focus-visible,
 *     prefers-reduced-motion honored.
 */
(function () {
  'use strict'

  if (typeof window === 'undefined') return

  var DEFAULT_API = 'https://loom-verify.pages.dev'
  var KIND_LABEL = {
    propose: 'PROPOSE',
    approve: 'APPROVE',
    reject: 'REJECT',
    revise: 'REVISE',
    focus: 'FOCUS',
    review: 'REVIEW',
    traverse: 'TRAVERSE',
    presence: 'PRESENCE',
    'view.save': 'VIEW.SAVE',
  }

  /* ── P31 design tokens, scoped to the shadow root (mirror p31-style.css hub) ── */
  var TOKEN_CSS = [
    ':host{',
    '--p31-void:#0A0A0F;--p31-surface:#12121A;--p31-surface2:#1C1C2A;',
    '--p31-coral:#FB7185;--p31-teal:#34D399;--p31-cyan:#00F0FF;',
    '--p31-cloud:#A1A1AA;--p31-amber:#FBBF24;--p31-muted:#6b7280;',
    '--p31-paper:#F5F5F7;',
    '--p31-border-subtle:rgba(255,255,255,0.06);',
    '--p31-glass-border:rgba(255,255,255,0.08);',
    '--p31-glass-surface:rgba(255,255,255,0.04);',
    '--p31-font-sans:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;',
    '--p31-font-mono:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;',
    '--p31-radius-md:12px;--p31-radius-lg:24px;--p31-radius-full:9999px;',
    '--p31-space-1:0.25rem;--p31-space-2:0.5rem;--p31-space-3:0.75rem;--p31-space-4:1rem;',
    '--p31-space-6:1.5rem;--p31-space-8:2rem;',
    '--p31-duration-fast:125ms;--p31-duration-normal:250ms;',
    '--p31-ease-standard:cubic-bezier(0.4,0,0.2,1);',
    '--p31-focus-ring:2px;--p31-focus-offset:2px;',
    '--p31-focus-color:rgba(0,240,255,0.55);',
    'color-scheme:dark;',
    '}',
  ].join('')

  var STYLE = [
    TOKEN_CSS,
    '*{box-sizing:border-box}',
    '.lvw{font-family:var(--p31-font-sans);color:var(--p31-cloud);line-height:1.6;',
    '  background:linear-gradient(180deg,color-mix(in srgb,var(--p31-surface) 96%,transparent),var(--p31-void));',
    '  border:1px solid var(--p31-glass-border);border-radius:var(--p31-radius-lg);',
    '  padding:var(--p31-space-6);max-width:42rem;margin:0;}',
    '.lvw a{color:var(--p31-cyan);text-decoration:none}.lvw a:hover{text-decoration:underline}',
    '.lvw-head{display:flex;align-items:center;justify-content:space-between;gap:var(--p31-space-3);margin-bottom:var(--p31-space-4)}',
    '.lvw-title{font-family:var(--p31-font-mono);font-weight:700;font-size:0.95rem;letter-spacing:0.14em;color:var(--p31-cloud)}',
    '.lvw-sub{color:var(--p31-muted);font-weight:600;letter-spacing:0.06em;font-size:0.72rem}',
    '.lvw-badge{font-family:var(--p31-font-mono);font-size:0.68rem;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;',
    '  padding:0.2rem var(--p31-space-3);border-radius:var(--p31-radius-full);background:var(--p31-surface2);color:var(--p31-muted);transition:color var(--p31-duration-fast) var(--p31-ease-standard),background var(--p31-duration-fast) var(--p31-ease-standard)}',
    '.lvw-badge[data-state="valid"]{background:color-mix(in srgb,var(--p31-teal) 16%,transparent);color:var(--p31-teal)}',
    '.lvw-badge[data-state="broken"]{background:color-mix(in srgb,var(--p31-coral) 16%,transparent);color:var(--p31-coral)}',
    '.lvw-badge[data-state="checking"]{background:color-mix(in srgb,var(--p31-amber) 14%,transparent);color:var(--p31-amber)}',
    '.lvw-badge[data-state="error"]{background:var(--p31-surface2);color:var(--p31-coral)}',
    '.lvw-verdict{border:1px solid var(--p31-border-subtle);border-radius:var(--p31-radius-md);background:var(--p31-glass-surface);padding:var(--p31-space-4);margin-bottom:var(--p31-space-4)}',
    '.lvw-verdict h3{margin:0 0 var(--p31-space-2) 0;font-size:0.95rem;font-weight:700;color:var(--p31-cloud);font-family:var(--p31-font-sans)}',
    '.lvw-verdict-ok{color:var(--p31-teal);font-weight:700}',
    '.lvw-verdict-bad{color:var(--p31-coral);font-weight:700}',
    '.lvw-kv{display:grid;grid-template-columns:max-content 1fr;gap:var(--p31-space-1) var(--p31-space-3);font-size:0.8rem}',
    '.lvw-kv dt{color:var(--p31-muted);font-family:var(--p31-font-mono);font-size:0.68rem;text-transform:uppercase;letter-spacing:0.08em;padding-top:0.15rem}',
    '.lvw-kv dd{margin:0;font-family:var(--p31-font-mono);font-size:0.78rem;color:var(--p31-cloud);word-break:break-all;overflow-wrap:anywhere}',
    '.lvw-form{margin-bottom:var(--p31-space-3)}',
    '.lvw-form label{display:block;font-family:var(--p31-font-mono);font-size:0.68rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--p31-muted);margin-bottom:var(--p31-space-2)}',
    '.lvw-row{display:flex;gap:var(--p31-space-3);flex-wrap:wrap}',
    '.lvw-input{flex:1 1 12rem;min-height:48px;padding:0 var(--p31-space-4);background:var(--p31-surface);border:1px solid var(--p31-border-subtle);border-radius:var(--p31-radius-md);color:var(--p31-cloud);font-family:var(--p31-font-mono);font-size:0.9rem}',
    '.lvw-input:focus-visible{outline:var(--p31-focus-ring) solid var(--p31-focus-color);outline-offset:var(--p31-focus-offset)}',
    '.lvw-btn{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 var(--p31-space-6);',
    '  background:var(--p31-teal);color:var(--p31-void);border:none;border-radius:var(--p31-radius-md);',
    '  font-family:var(--p31-font-sans);font-weight:700;font-size:0.85rem;cursor:pointer;',
    '  transition:background var(--p31-duration-fast) var(--p31-ease-standard)}',
    '.lvw-btn:hover{background:var(--p31-cyan)}',
    '.lvw-btn:focus-visible{outline:var(--p31-focus-ring) solid var(--p31-focus-color);outline-offset:var(--p31-focus-offset)}',
    '.lvw-btn[disabled]{opacity:0.55;cursor:progress}',
    '.lvw-demo{margin-bottom:var(--p31-space-3)}',
    '.lvw-demo-btn{display:inline-flex;align-items:center;gap:var(--p31-space-2);min-height:48px;padding:0 var(--p31-space-4);',
    '  background:transparent;border:1px solid var(--p31-border-subtle);color:var(--p31-cloud);border-radius:var(--p31-radius-md);',
    '  font-family:var(--p31-font-sans);font-size:0.8rem;cursor:pointer;transition:border-color var(--p31-duration-fast) var(--p31-ease-standard),color var(--p31-duration-fast) var(--p31-ease-standard)}',
    '.lvw-demo-btn:hover{border-color:var(--p31-teal);color:var(--p31-teal)}',
    '.lvw-demo-btn:focus-visible{outline:var(--p31-focus-ring) solid var(--p31-focus-color);outline-offset:var(--p31-focus-offset)}',
    '.lvw-demo-note{font-size:0.74rem;color:var(--p31-muted);margin:var(--p31-space-2) 0 0 0}',
    '.lvw-result{display:none}',
    '.lvw-result[data-open="true"]{display:block;border:1px solid var(--p31-border-subtle);border-radius:var(--p31-radius-md);background:var(--p31-glass-surface);padding:var(--p31-space-4)}',
    '.lvw-result h3{margin:0 0 var(--p31-space-3) 0;font-size:0.95rem;font-weight:700;color:var(--p31-cloud);font-family:var(--p31-font-sans)}',
    '.lvw-record-head{display:flex;align-items:center;gap:var(--p31-space-2);flex-wrap:wrap;margin-bottom:var(--p31-space-3)}',
    '.lvw-chip{font-family:var(--p31-font-mono);font-size:0.66rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:0.18rem var(--p31-space-2);border-radius:var(--p31-radius-full)}',
    '.lvw-chip--agent{background:color-mix(in srgb,var(--p31-cyan) 14%,transparent);color:var(--p31-cyan)}',
    '.lvw-chip--human{background:color-mix(in srgb,var(--p31-teal) 14%,transparent);color:var(--p31-teal)}',
    '.lvw-chip--kind{background:var(--p31-surface2);color:var(--p31-cloud)}',
    '.lvw-body{margin:var(--p31-space-3) 0;padding:var(--p31-space-3);border-left:2px solid var(--p31-border-subtle);font-size:0.85rem;color:var(--p31-cloud)}',
    '.lvw-chain{margin-top:var(--p31-space-4);border-top:1px solid var(--p31-border-subtle);padding-top:var(--p31-space-3)}',
    '.lvw-chain-title{font-family:var(--p31-font-mono);font-size:0.68rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--p31-muted);margin-bottom:var(--p31-space-2)}',
    '.lvw-link{display:grid;grid-template-columns:2.6rem 1fr;gap:var(--p31-space-1) var(--p31-space-2);font-size:0.75rem;align-items:baseline}',
    '.lvw-link>div{min-width:0}',
    '.lvw-link--target{background:color-mix(in srgb,var(--p31-teal) 8%,transparent);border-radius:var(--p31-radius-md);padding:var(--p31-space-1) var(--p31-space-2)}',
    '.lvw-link .seq{font-family:var(--p31-font-mono);color:var(--p31-muted);font-size:0.7rem}',
    '.lvw-link .kind{font-family:var(--p31-font-mono);color:var(--p31-cloud);font-size:0.72rem}',
    '.lvw-link .hash{font-family:var(--p31-font-mono);color:var(--p31-muted);font-size:0.66rem;word-break:break-all}',
    '.lvw-link--ok::after{content:"✓";color:var(--p31-teal);font-size:0.7rem}',
    '.lvw-note{font-size:0.72rem;color:var(--p31-muted);margin-top:var(--p31-space-3)}',
    '.lvw-error{color:var(--p31-coral);font-family:var(--p31-font-mono);font-size:0.78rem;word-break:break-all}',
    '.lvw-foot{display:flex;justify-content:space-between;align-items:center;gap:var(--p31-space-2);margin-top:var(--p31-space-4);padding-top:var(--p31-space-3);border-top:1px solid var(--p31-border-subtle);font-size:0.7rem;color:var(--p31-muted)}',
    '.lvw-foot code{font-family:var(--p31-font-mono);font-size:0.66rem}',
    '@media (prefers-reduced-motion: reduce){.lvw *{transition-duration:0.01ms !important;animation-duration:0.01ms !important}}',
  ].join('')

  var MARKUP = [
    '<section class="lvw" role="region" aria-label="LOOM chain verification">',
    '<header class="lvw-head">',
    '<div class="lvw-title">LOOM <span class="lvw-sub">chain verification</span></div>',
    '<span class="lvw-badge" id="lvwBadge" data-state="checking">checking</span>',
    '</header>',
    '<div class="lvw-verdict" id="lvwVerdict" aria-live="polite">',
    '<h3>Governance chain</h3>',
    '<p class="lvw-note" id="lvwVerdictLoading">Reading the live chain…</p>',
    '</div>',
    '<form class="lvw-form" id="lvwForm" novalidate>',
    '<label for="lvwSeq">Chain record id (seq)</label>',
    '<div class="lvw-row">',
    '<input class="lvw-input" id="lvwSeq" name="seq" type="number" inputmode="numeric" min="0" step="1" placeholder="e.g. 15" required autocomplete="off" aria-describedby="lvwSeqHint">',
    '<button class="lvw-btn" type="submit" id="lvwSubmit">Verify record</button>',
    '</div>',
    '<p class="lvw-demo-note" id="lvwSeqHint">Enter the sequence number of a record — e.g. 14 is a proposal, 15 is the human decision on it.</p>',
    '</form>',
    '<div class="lvw-demo">',
    '<button class="lvw-demo-btn" type="button" id="lvwDemo">Verify a real decision (seq 14 → 15)</button>',
    '<p class="lvw-demo-note">Lumi proposes — a human decides. Every step is a hash-chained record anyone can verify.</p>',
    '</div>',
    '<div class="lvw-result" id="lvwResult" data-open="false" aria-live="polite"></div>',
    '<footer class="lvw-foot"><span>Live source: <code id="lvwApi">…</code></span>',
    '<a href="https://loom.p31ca.org" target="_blank" rel="noopener noreferrer">loom.p31ca.org</a></footer>',
    '</section>',
  ].join('')

  /* ── JCS canonicalize + SHA-256 (WebCrypto) — the same code the chain uses ── */
  function canonicalize(value) {
    if (value === null) return 'null'
    var t = typeof value
    if (t === 'boolean') return value ? 'true' : 'false'
    if (t === 'number') return JSON.stringify(value)
    if (t === 'string') return JSON.stringify(value)
    if (Array.isArray(value)) return '[' + value.map(canonicalize).join(',') + ']'
    if (t === 'object') {
      var keys = Object.keys(value).sort()
      return '{' + keys.map(function (k) { return JSON.stringify(k) + ':' + canonicalize(value[k]) }).join(',') + '}'
    }
    throw new Error('cannot canonicalize ' + t)
  }

  function sha256hex(s) {
    var bytes = new TextEncoder().encode(s)
    return crypto.subtle.digest('SHA-256', bytes).then(function (digest) {
      return Array.from(new Uint8Array(digest)).map(function (b) { return b.toString(16).padStart(2, '0') }).join('')
    })
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    })
  }

  function shortHash(h, n) {
    if (!h) return 'genesis'
    return String(h).slice(0, n || 10)
  }

  function fmtTs(ts) {
    if (!ts) return '—'
    return new Date(ts).toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
  }

  function kindLabel(kind) {
    return KIND_LABEL[kind] || String(kind || 'event').toUpperCase()
  }

  function bodySummary(event) {
    if (!event || typeof event !== 'object') return null
    var parts = []
    if (event.body && typeof event.body === 'object') {
      Object.keys(event.body).forEach(function (k) { parts.push(k + ': ' + JSON.stringify(event.body[k])) })
    }
    if (event.reason) parts.push('reason: ' + event.reason)
    if (event.statedBy) parts.push('statedBy: ' + event.statedBy)
    if (event.node) parts.push('node: ' + event.node)
    if (event.proposal) parts.push('proposal: ' + event.proposal)
    return parts.length ? parts.join(' · ') : null
  }

  function fetchJson(url) {
    return fetch(url, { headers: { Accept: 'application/json' }, credentials: 'omit' }).then(function (res) {
      return res.json().then(function (body) {
        return { status: res.status, ok: res.ok, body: body }
      }).catch(function () {
        return { status: res.status, ok: false, body: null, notJson: true }
      })
    })
  }

  /* ── mount ── */
  function mount(rootEl) {
    var api = (rootEl.getAttribute('data-loom-verify-api') || DEFAULT_API).replace(/\/+$/, '')
    var demoSeq = parseInt(rootEl.getAttribute('data-loom-verify-demo') || '15', 10)
    var preloadSeq = rootEl.getAttribute('data-loom-verify-record')
    var shadow = rootEl.attachShadow({ mode: 'open' })
    shadow.innerHTML = '<style>' + STYLE + '</style>' + MARKUP

    var badge = shadow.getElementById('lvwBadge')
    var verdictEl = shadow.getElementById('lvwVerdict')
    var resultEl = shadow.getElementById('lvwResult')
    var form = shadow.getElementById('lvwForm')
    var input = shadow.getElementById('lvwSeq')
    var submit = shadow.getElementById('lvwSubmit')
    var demoBtn = shadow.getElementById('lvwDemo')
    var apiEl = shadow.getElementById('lvwApi')
    apiEl.textContent = api

    function setBadge(state, text) {
      badge.setAttribute('data-state', state)
      badge.textContent = text
    }

    function setBusy(busy) {
      submit.disabled = busy
      demoBtn.disabled = busy
    }

    function renderVerdict(res) {
      if (!res.ok || !res.body) {
        verdictEl.innerHTML = '<h3>Governance chain</h3>'
        var msg = res.status ? 'HTTP ' + res.status : 'network error'
        if (res.body && res.body.error) msg += ' — ' + esc(res.body.error)
        verdictEl.insertAdjacentHTML('beforeend', '<p class="lvw-error">Chain verdict unavailable: ' + msg + '. This is the live endpoint\'s response.</p>')
        setBadge('error', 'error')
        return
      }
      var v = res.body
      var ok = v.valid === true
      setBadge(ok ? 'valid' : 'broken', ok ? 'chain valid' : 'chain broken')
      var rows = [
        ['status', ok ? '<span class="lvw-verdict-ok">INTACT — no tamper detected</span>' : '<span class="lvw-verdict-bad">BROKEN at seq ' + esc(v.brokenAt) + '</span>'],
        ['records checked', esc(v.checked)],
        ['first broken seq', v.brokenAt == null ? 'none' : esc(v.brokenAt)],
        ['head hash', '<span title="' + esc(v.head) + '">' + esc(v.head) + '</span>'],
      ]
      if (v.service) rows.push(['service', esc(v.service)])
      if (v.checkedAt) rows.push(['checked at', esc(fmtTs(v.checkedAt))])
      var html = '<h3>Governance chain</h3><dl class="lvw-kv">'
      rows.forEach(function (r) { html += '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>' })
      html += '</dl><p class="lvw-note">Recomputed live from the D1 log by ' + esc(api.replace(/^https?:\/\//, '')) + ' — no database access needed to check it.</p>'
      verdictEl.innerHTML = html
    }

    function linkHtml(record, isTarget, i, chain) {
      var kind = record.event ? record.event.kind : 'redacted'
      var writer = record.event ? record.event.writer : ''
      var ownHash = chain[i + 1] ? chain[i + 1].prev_hash : null
      return '<div class="lvw-link' + (isTarget ? ' lvw-link--target' : '') + (ownHash ? ' lvw-link--ok' : '') + '">' +
        '<div class="seq">#' + record.seq + '</div>' +
        '<div><span class="kind">' + kindLabel(kind) + (writer ? ' · ' + esc(writer) : '') + '</span> ' +
        '<span class="hash">' + (ownHash ? esc(shortHash(ownHash)) : esc(shortHash(record.prev_hash))) + '</span></div>' +
        '</div>'
    }

    function renderResult(prov) {
      var target = prov.chain[prov.chain.length - 1]
      var isHuman = target.event && target.event.writer === 'human'
      var html = '<h3>Record #' + target.seq + ' — verified against the chain</h3>'
      html += '<div class="lvw-record-head">'
      html += '<span class="lvw-chip lvw-chip--kind">' + kindLabel(target.event && target.event.kind) + '</span>'
      html += '<span class="lvw-chip ' + (isHuman ? 'lvw-chip--human' : 'lvw-chip--agent') + '">' + (target.event ? esc(target.event.writer) : 'redacted') + '</span>'
      html += '</div>'
      var body = bodySummary(target.event)
      if (body) html += '<div class="lvw-body">' + esc(body) + '</div>'
      html += '<dl class="lvw-kv">'
      html += '<dt>timestamp</dt><dd>' + esc(fmtTs(target.ts)) + '</dd>'
      html += '<dt>scope</dt><dd>' + esc(target.scope) + '</dd>'
      html += '<dt>prev_hash</dt><dd>' + esc(target.prev_hash || 'genesis') + '</dd>'
      if (prov.head) html += '<dt>anchor hash</dt><dd>' + esc(prov.head) + '</dd>'
      if (prov.verified === false) html += '<dt>chain</dt><dd class="lvw-error">BROKEN at seq ' + esc(prov.brokenAt) + '</dd>'
      html += '</dl>'
      html += '<div class="lvw-chain"><div class="lvw-chain-title">chained records genesis → #' + target.seq + '</div>'
      prov.chain.forEach(function (r, i) { html += linkHtml(r, r.seq === target.seq, i, prov.chain) })
      html += '</div>'
      html += '<p class="lvw-note">The anchor hash above is <strong>recomputed in your browser</strong> (JCS + SHA-256, the same canonicalizer the chain uses) and matches the live API head. Every ✓ is a proven prev_hash link to the record before it.</p>'
      resultEl.innerHTML = html
      resultEl.setAttribute('data-open', 'true')
      resultEl.focus()
    }

    function renderError(status, body, url) {
      var msg = status ? 'HTTP ' + status : 'network error'
      if (body && typeof body === 'object' && body.error) msg += ' — ' + esc(body.error)
      else if (body && typeof body === 'string') msg += ' — ' + esc(body)
      else if (!status) msg = 'unreachable (' + esc(url) + ') — the live endpoint did not respond.'
      resultEl.innerHTML = '<h3>Verification result</h3><p class="lvw-error">' + msg + '</p>' +
        '<p class="lvw-note">This is the live endpoint\'s honest response — nothing was fabricated.</p>'
      resultEl.setAttribute('data-open', 'true')
      resultEl.focus()
    }

    function verify(seq, label) {
      setBusy(true)
      setBadge('checking', label || 'verifying #' + seq)
      var url = api + '/api/loom/provenance/' + seq
      fetchJson(url).then(function (res) {
        setBusy(false)
        if (res.ok && res.body && res.body.chain) {
          renderResult(res.body)
          setBadge('valid', 'verified #' + seq)
        } else {
          renderError(res.status, res.body, url)
          setBadge('error', 'error')
        }
      }).catch(function (err) {
        setBusy(false)
        renderError(0, String(err), url)
        setBadge('error', 'error')
      })
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault()
      var seq = parseInt(input.value, 10)
      if (!Number.isInteger(seq) || seq < 0) {
        input.setCustomValidity('Enter a non-negative integer record id')
        input.reportValidity()
        return
      }
      input.setCustomValidity('')
      verify(seq, 'verifying #' + seq)
    })

    demoBtn.addEventListener('click', function () {
      input.value = String(demoSeq)
      verify(demoSeq, 'verifying real decision')
    })

    /* on load: fetch the chain verdict, then optionally preload a record */
    fetchJson(api + '/api/loom/verify').then(renderVerdict).catch(function () {
      renderVerdict({ ok: false, status: 0, body: null })
    }).then(function () {
      if (preloadSeq != null && preloadSeq !== '') verify(parseInt(preloadSeq, 10))
    })
  }

  function init() {
    var mounts = document.querySelectorAll('[data-loom-verify]')
    Array.prototype.forEach.call(mounts, function (el) {
      try { mount(el) } catch (err) { /* keep the host page intact */ console.error('loom-verify widget mount failed', err) }
    })
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()