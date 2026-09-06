(function(){
  var ctx = document.modelContext || (typeof navigator !== 'undefined' ? navigator.modelContext : undefined);
  if (typeof ctx === 'undefined' || typeof ctx.registerTool !== 'function') {
    // WebMCP not available (Chrome 149+ origin trial required)
    window.__p31MCPTools = {};
    window.__p31MCPExec = function() {};
    if (window.__p31MCPReady) window.__p31MCPReady(false);
    return;
  }

  var TOOLS = {};
  var REGISTERED = false;

  function readAttr(el, name, fallback) {
    if (!el) return fallback;
    var v = el.getAttribute(name);
    return v !== null && v !== undefined ? v : fallback;
  }

  function readNumAttr(el, name, fallback) {
    var v = readAttr(el, name);
    var n = Number(v);
    return !isNaN(n) ? n : fallback;
  }

  function fireEvent(name, detail) {
    try {
      document.dispatchEvent(new CustomEvent(name, { detail: detail }));
    } catch(e) {}
  }

  // ---- Query helpers ----
  function getRoot() { return document.documentElement; }
  function getBody() { return document.body; }

  function scanA2UIComponents() {
    var results = [];
    var els = document.querySelectorAll('[data-a2ui-component]');
    els.forEach(function(el){
      var name = el.getAttribute('data-a2ui-component');
      var props = {};
      try { props = JSON.parse(el.getAttribute('data-a2ui-props') || '{}'); } catch(e) {}
      var actions = [];
      try { actions = JSON.parse(el.getAttribute('data-a2ui-actions') || '[]'); } catch(e) {}
      results.push({
        name: name,
        tagName: el.tagName.toLowerCase(),
        id: el.id || null,
        props: props,
        actions: actions,
      });
    });
    return results;
  }

  function getCSSVar(name) {
    return getComputedStyle(getRoot()).getPropertyValue(name).trim();
  }

  function findStatusBadge() {
    return document.querySelector('[data-a2ui-component="StatusBadge"], [data-status]');
  }

  function findDrawer() {
    return document.querySelector('[data-a2ui-component="Drawer"], [open][data-a2ui-component]');
  }

  // ---- Tool implementations ----
  function tool_setSpoonLevel(args) {
    var level = Math.max(0, Math.min(5, Math.round(Number(args.level)) || 3));
    getRoot().setAttribute('data-spoons', String(level));
    fireEvent('spoons:changed', { level: level });
    return { spoonLevel: level };
  }

  function tool_setStatus(args) {
    var badge = findStatusBadge();
    if (badge) {
      if (args.status) badge.setAttribute('data-status', args.status);
      if (args.label) badge.setAttribute('data-label', args.label);
    }
    fireEvent('status:changed', { status: args.status, label: args.label });
    return { status: args.status, label: args.label };
  }

  function tool_navigate(args) {
    if (args.external && args.href) {
      window.open(args.href, '_blank', 'noopener,noreferrer');
    } else if (args.href) {
      window.location.href = args.href;
    }
    return { navigated: true, href: args.href, external: !!args.external };
  }

  function tool_toggleDrawer(args) {
    var drawer = document.querySelector(args.target || '[data-a2ui-component="Drawer"]');
    if (!drawer) return { error: 'Drawer not found' };
    var shouldOpen = args.state !== undefined ? args.state : !drawer.hasAttribute('open');
    if (shouldOpen) {
      drawer.setAttribute('open', '');
    } else {
      drawer.removeAttribute('open');
    }
    fireEvent('drawer:changed', { open: shouldOpen, target: args.target });
    return { open: shouldOpen };
  }

  function tool_getSpoonLevel() {
    return { spoonLevel: readNumAttr(getRoot(), 'data-spoons', 3) };
  }

  function tool_getTheme() {
    return { theme: readAttr(getRoot(), 'data-theme', 'default') };
  }

  function tool_getMode() {
    return { mode: readAttr(getRoot(), 'data-mode', 'play') };
  }

  function tool_getStatus() {
    var badge = findStatusBadge();
    return {
      status: badge ? readAttr(badge, 'data-status', 'active') : null,
      label: badge ? readAttr(badge, 'data-label', '') : null,
    };
  }

  function tool_scanUI() {
    return { components: scanA2UIComponents() };
  }

  function tool_tokenList() {
    var tokens = {};
    for (var i = 0; i < document.styleSheets.length; i++) {
      try {
        var rules = document.styleSheets[i].cssRules;
        for (var j = 0; j < (rules || []).length; j++) {
          var rule = rules[j];
          if (rule instanceof CSSStyleRule && rule.selectorText === ':root') {
            for (var k = 0; k < rule.style.length; k++) {
              var prop = rule.style[k];
              if (prop.startsWith('--p31-')) tokens[prop] = rule.style.getPropertyValue(prop).trim();
            }
          }
        }
      } catch(e) {}
    }
    var inline = document.querySelector('[style*="--p31-"]');
    if (inline) {
      for (var k2 = 0; k2 < inline.style.length; k2++) {
        var p = inline.style[k2];
        if (p.startsWith('--p31-')) tokens[p] = inline.style.getPropertyValue(p).trim();
      }
    }
    return { tokens: tokens, count: Object.keys(tokens).length };
  }

  function tool_getLoveBalance() {
    return { loveBalance: readNumAttr(getBody(), 'data-love-balance', 0) };
  }

  function tool_getTrustTier() {
    return { trustTier: readAttr(getBody(), 'data-trust-tier', 'bronze') };
  }

  function tool_getState() {
    return {
      spoonLevel: readNumAttr(getRoot(), 'data-spoons', 3),
      theme: readAttr(getRoot(), 'data-theme', 'default'),
      mode: readAttr(getRoot(), 'data-mode', 'play'),
      brand: readAttr(getRoot(), 'data-brand', ''),
      trustTier: readAttr(getBody(), 'data-trust-tier', 'bronze'),
      loveBalance: readNumAttr(getBody(), 'data-love-balance', 0),
      url: window.location.href,
      title: document.title,
    };
  }

  function tool_getActiveComponent() {
    var active = document.activeElement;
    if (!active) return { component: null };
    var a2ui = active.closest('[data-a2ui-component]');
    if (!a2ui) return { component: null, tagName: active.tagName.toLowerCase(), id: active.id || null };
    return {
      component: a2ui.getAttribute('data-a2ui-component'),
      tagName: a2ui.tagName.toLowerCase(),
      id: a2ui.id || null,
    };
  }

  function tool_getAllComponents() {
    var names = [];
    var seen = {};
    var els = document.querySelectorAll('[data-a2ui-component]');
    els.forEach(function(el){
      var n = el.getAttribute('data-a2ui-component');
      if (n && !seen[n]) { seen[n] = true; names.push(n); }
    });
    return { components: names, count: names.length };
  }

  function tool_getAccentColor() {
    return {
      accent: getCSSVar('--p31-accent'),
      accentAlt: getCSSVar('--p31-accent-alt'),
      accentViolet: getCSSVar('--p31-accent-violet'),
    };
  }

  function tool_getContrast() {
    var bg = getCSSVar('--p31-bg');
    var text = getCSSVar('--p31-text');
    return { background: bg, text: text };
  }

  function tool_getMotion() {
    var spoons = readNumAttr(getRoot(), 'data-spoons', 3);
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return {
      spoons: spoons,
      motionEnabled: spoons >= 2 && !reduced,
      reducedMotion: reduced,
      speedFactor: spoons >= 4 ? 1.0 : spoons >= 2 ? 0.5 : 0.0,
    };
  }

  function tool_getPageMeta() {
    var ogTitle = document.querySelector('meta[property="og:title"]');
    var ogDesc = document.querySelector('meta[property="og:description"]');
    var ogImage = document.querySelector('meta[property="og:image"]');
    var ogUrl = document.querySelector('meta[property="og:url"]');
    return {
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
      ogTitle: ogTitle?.getAttribute('content') || null,
      ogDescription: ogDesc?.getAttribute('content') || null,
      ogImage: ogImage?.getAttribute('content') || null,
      ogUrl: ogUrl?.getAttribute('content') || null,
      brand: readAttr(getRoot(), 'data-brand', ''),
    };
  }

  function tool_getComponentProps(args) {
    var el;
    if (args.id) {
      el = document.getElementById(args.id);
    } else if (args.name) {
      el = document.querySelector('[data-a2ui-component="' + args.name.replace(/"/g, '') + '"]');
    } else {
      el = document.querySelector('[data-a2ui-component]');
    }
    if (!el) return { error: 'Component not found' };
    var props = {};
    try { props = JSON.parse(el.getAttribute('data-a2ui-props') || '{}'); } catch(e) {}
    var actions = [];
    try { actions = JSON.parse(el.getAttribute('data-a2ui-actions') || '[]'); } catch(e) {}
    return {
      name: el.getAttribute('data-a2ui-component'),
      tagName: el.tagName.toLowerCase(),
      id: el.id || null,
      props: props,
      actions: actions,
    };
  }

  function tool_scrollToElement(args) {
    if (!args.selector) return { error: 'selector required' };
    var el = document.querySelector(args.selector);
    if (!el) return { error: 'Element not found: ' + args.selector };
    el.scrollIntoView({ behavior: args.smooth !== false ? 'smooth' : 'instant', block: args.block || 'start' });
    if (args.focus !== false) el.focus({ preventScroll: true });
    return { scrolled: true, selector: args.selector, tagName: el.tagName.toLowerCase(), id: el.id || null };
  }

  function tool_getViewport() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      documentHeight: document.documentElement.scrollHeight,
      documentWidth: document.documentElement.scrollWidth,
    };
  }

  function tool_triggerNotification(args) {
    if (!args.message) return { error: 'message required' };
    fireEvent('p31-notification', { message: args.message, type: args.type || 'info' });
    return { notified: true, message: args.message, type: args.type || 'info' };
  }

  function tool_getBrand() {
    return { brand: readAttr(getRoot(), 'data-brand', '') };
  }

  // ---- Tool definitions ----
  var toolDefs = [
    // Mutating tools (no readOnlyHint)
    { name: 'setSpoonLevel', description: 'Set the cognitive spoon level (0–5) on the page. Mutates data-spoons attribute.', inputSchema: { type: 'object', properties: { level: { type: 'number', minimum: 0, maximum: 5, description: 'Spoon level 0–5' } }, required: ['level'], additionalProperties: false }, handler: tool_setSpoonLevel },
    { name: 'setStatus', description: 'Set the StatusBadge status and label text.', inputSchema: { type: 'object', properties: { status: { type: 'string', description: 'Status key' }, label: { type: 'string', description: 'Display label' } }, additionalProperties: false }, handler: tool_setStatus },
    { name: 'navigate', description: 'Navigate to a URL or open in a new tab.', inputSchema: { type: 'object', properties: { href: { type: 'string', description: 'Target URL' }, external: { type: 'boolean', description: 'Open in new tab (default: false)' } }, required: ['href'], additionalProperties: false }, handler: tool_navigate },
    { name: 'toggleDrawer', description: 'Open, close, or toggle a drawer component.', inputSchema: { type: 'object', properties: { state: { type: 'boolean', description: 'true=open, false=close, omit=toggle' }, target: { type: 'string', description: 'CSS selector for the drawer (default: first [data-a2ui-component="Drawer"])' } }, additionalProperties: false }, handler: tool_toggleDrawer },

    // Query tools (readOnlyHint: true)
    { name: 'getSpoonLevel', description: 'Read the current spoon level (0–5).', readOnlyHint: true, inputSchema: { type: 'object', properties: {}, additionalProperties: false }, handler: tool_getSpoonLevel },
    { name: 'getTheme', description: 'Read the current theme name.', readOnlyHint: true, inputSchema: { type: 'object', properties: {}, additionalProperties: false }, handler: tool_getTheme },
    { name: 'getMode', description: 'Read the current mode (play, calm, etc.).', readOnlyHint: true, inputSchema: { type: 'object', properties: {}, additionalProperties: false }, handler: tool_getMode },
    { name: 'getStatus', description: 'Read the StatusBadge status and label.', readOnlyHint: true, inputSchema: { type: 'object', properties: {}, additionalProperties: false }, handler: tool_getStatus },
    { name: 'scanUI', description: 'List all A2UI components on the page with their props and actions.', readOnlyHint: true, inputSchema: { type: 'object', properties: {}, additionalProperties: false }, handler: tool_scanUI },
    { name: 'tokenList', description: 'List all --p31-* design token CSS variables.', readOnlyHint: true, inputSchema: { type: 'object', properties: {}, additionalProperties: false }, handler: tool_tokenList },
    { name: 'getLoveBalance', description: 'Read the LOVE balance from the page state.', readOnlyHint: true, inputSchema: { type: 'object', properties: {}, additionalProperties: false }, handler: tool_getLoveBalance },
    { name: 'getTrustTier', description: 'Read the current trust tier (bronze/silver/gold).', readOnlyHint: true, inputSchema: { type: 'object', properties: {}, additionalProperties: false }, handler: tool_getTrustTier },
    { name: 'getState', description: 'Get a snapshot of the full page state (spoons, theme, mode, brand, trust, love, URL).', readOnlyHint: true, inputSchema: { type: 'object', properties: {}, additionalProperties: false }, handler: tool_getState },
    { name: 'getActiveComponent', description: 'Get the currently focused A2UI component.', readOnlyHint: true, inputSchema: { type: 'object', properties: {}, additionalProperties: false }, handler: tool_getActiveComponent },
    { name: 'getAllComponents', description: 'List all unique A2UI component types on the page.', readOnlyHint: true, inputSchema: { type: 'object', properties: {}, additionalProperties: false }, handler: tool_getAllComponents },
    { name: 'getAccentColor', description: 'Read the current accent color values.', readOnlyHint: true, inputSchema: { type: 'object', properties: {}, additionalProperties: false }, handler: tool_getAccentColor },
    { name: 'getContrast', description: 'Get the background and text color.', readOnlyHint: true, inputSchema: { type: 'object', properties: {}, additionalProperties: false }, handler: tool_getContrast },
    { name: 'getMotion', description: 'Get motion state (enabled/disabled) derived from spoon level.', readOnlyHint: true, inputSchema: { type: 'object', properties: {}, additionalProperties: false }, handler: tool_getMotion },
    { name: 'getPageMeta', description: 'Read page metadata (title, description, OG tags, brand).', readOnlyHint: true, inputSchema: { type: 'object', properties: {}, additionalProperties: false }, handler: tool_getPageMeta },
    { name: 'getComponentProps', description: 'Get props and actions of a specific A2UI component by id or name.', readOnlyHint: true, inputSchema: { type: 'object', properties: { id: { type: 'string', description: 'Element ID' }, name: { type: 'string', description: 'A2UI component name' } }, additionalProperties: false }, handler: tool_getComponentProps },
    { name: 'scrollToElement', description: 'Scroll to and optionally focus an element by selector.', readOnlyHint: true, inputSchema: { type: 'object', properties: { selector: { type: 'string', description: 'CSS selector' }, smooth: { type: 'boolean', description: 'Use smooth scrolling (default: true)' }, block: { type: 'string', enum: ['start', 'center', 'end', 'nearest'], description: 'Vertical alignment' }, focus: { type: 'boolean', description: 'Focus the element after scroll (default: true)' } }, required: ['selector'], additionalProperties: false }, handler: tool_scrollToElement },
    { name: 'getViewport', description: 'Get the current viewport dimensions and scroll position.', readOnlyHint: true, inputSchema: { type: 'object', properties: {}, additionalProperties: false }, handler: tool_getViewport },
    { name: 'triggerNotification', description: 'Trigger a page notification/toast event.', readOnlyHint: true, inputSchema: { type: 'object', properties: { message: { type: 'string', description: 'Notification text' }, type: { type: 'string', enum: ['info', 'success', 'warn', 'error'], description: 'Notification type' } }, required: ['message'], additionalProperties: false }, handler: tool_triggerNotification },
    { name: 'getBrand', description: 'Read the brand identifier (e.g. willow, phos, p31ca).', readOnlyHint: true, inputSchema: { type: 'object', properties: {}, additionalProperties: false }, handler: tool_getBrand },
  ];

  function registerAll() {
    if (REGISTERED) return;
    REGISTERED = true;

    toolDefs.forEach(function(def) {
      var tool = {
        name: def.name,
        description: def.description,
        inputSchema: def.inputSchema,
        _meta: {
          toolName: def.name,
          version: '1.0.0',
          protocol: 'webmcp',
          source: 'p31-portal',
        },
      };
      if (def.readOnlyHint) tool.readOnlyHint = true;

      TOOLS[def.name] = def.handler;

      try {
        ctx.registerTool(tool).catch(function(err) {
          console.warn('[WebMCP] Failed to register ' + def.name + ':', err);
        });
      } catch(e) {
        // registerTool may throw in some contexts
      }
    });

    window.__p31MCPTools = TOOLS;
    window.__p31MCPExec = function(name, args) {
      var fn = TOOLS[name];
      if (!fn) return { error: 'Unknown tool: ' + name };
      try {
        var result = fn(args || {});
        return Promise.resolve(result);
      } catch(e) {
        return Promise.reject(e);
      }
    };
    if (window.__p31MCPReady) window.__p31MCPReady(true);
    fireEvent('p31-webmcp-ready', { toolCount: toolDefs.length });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerAll);
  } else {
    registerAll();
  }
})();
