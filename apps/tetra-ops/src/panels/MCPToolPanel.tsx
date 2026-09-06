import { useState, useEffect, useCallback } from 'react';

interface MCPTool {
  name: string;
  description: string;
  inputSchema: { type: string; properties: Record<string, unknown>; required?: string[] };
}

interface ToolResult {
  tool: string;
  status: 'idle' | 'calling' | 'success' | 'error';
  result?: string;
  error?: string;
}

const MCP_URL = 'https://p31-design-mcp.trimtab-signal.workers.dev';

const BUILDER_LINKS = [
  { id: 'website', label: 'Website Builder', url: 'https://builder.p31ca.org', emoji: '🌐', desc: 'Generate tokenized, annotated websites from natural language' },
  { id: 'app', label: 'App Builder', url: 'https://app.p31ca.org', emoji: '📱', desc: 'Generate full-stack apps with WebContainer WASM' },
  { id: 'game', label: 'Game Builder', url: 'https://game.p31ca.org', emoji: '🎮', desc: 'Generate games with Plinth MCP-native engine' },
];

const TOOL_CATEGORIES: Record<string, string> = {
  token_resolve: 'tokens', component_schema: 'components', component_usage: 'components',
  generate_component: 'components', component_search: 'components',
  token_list: 'tokens', layout_generate: 'layout',
  list_icons: 'icons', get_icon: 'icons', icon_search: 'icons', icon_preview: 'icons',
  propose_component: 'ai', propose_icon: 'ai', propose_token: 'ai',
  validate_component: 'validate', audit_tokens: 'validate', audit_icons: 'validate',
  get_template_spec: 'templates', template_preview: 'templates',
  scan_ui: 'webmcp', toggleDrawer: 'webmcp', navigate: 'webmcp', setSpoonLevel: 'webmcp',
};

export function MCPToolPanel() {
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [filter, setFilter] = useState('');
  const [category, setCategory] = useState('all');
  const [results, setResults] = useState<Record<string, ToolResult>>({});
  const [invoking, setInvoking] = useState<string | null>(null);

  useEffect(() => {
    fetch(MCP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {}, _meta: { protocolVersion: '2026-07-28' } }),
    })
    .then(r => r.json())
    .then(d => { if (d.result?.tools) setTools(d.result.tools); })
    .catch(() => {});
  }, []);

  const callTool = useCallback(async (name: string) => {
    if (invoking) return;
    setInvoking(name);
    setResults(r => ({ ...r, [name]: { tool: name, status: 'calling' } }));
    try {
      const res = await fetch(MCP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method: 'tools/call', params: { name, arguments: {} }, _meta: { protocolVersion: '2026-07-28' } }),
      });
      const data = await res.json();
      if (data.error) {
        setResults(r => ({ ...r, [name]: { tool: name, status: 'error', error: data.error.message } }));
      } else {
        const resultStr = JSON.stringify(data.result).slice(0, 200);
        setResults(r => ({ ...r, [name]: { tool: name, status: 'success', result: resultStr } }));
      }
    } catch (e: any) {
      setResults(r => ({ ...r, [name]: { tool: name, status: 'error', error: e.message } }));
    }
    setInvoking(null);
  }, [invoking]);

  const cats = ['all', ...new Set(tools.map(t => TOOL_CATEGORIES[t.name] || 'other'))];
  const filtered = tools.filter(t => {
    if (category !== 'all' && (TOOL_CATEGORIES[t.name] || 'other') !== category) return false;
    if (filter && !t.name.toLowerCase().includes(filter.toLowerCase()) && !t.description.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 8, maxHeight: '70vh', overflow: 'auto' }} data-mcp-tool="mcpToolPanel" data-mcp-target="mcp-tools">
      {/* Builder Quick Links */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 10, borderRadius: 8, background: 'rgba(0,240,255,0.04)', border: '1px solid rgba(0,240,255,0.12)' }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--p31-accent-cyan, #00F0FF)', marginBottom: 4 }}>Builders</div>
        {BUILDER_LINKS.map(b => (
          <a key={b.id} href={b.url} target="_blank" rel="noopener noreferrer"
            data-mcp-tool="builderLink" data-mcp-type="action" data-mcp-target={`builder-${b.id}`}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textDecoration: 'none', fontSize: 12, transition: 'all 0.15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--p31-accent-cyan)'; e.currentTarget.style.background = 'rgba(0,240,255,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}>
            <span style={{ fontSize: 16 }}>{b.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: 'var(--p31-text-primary)' }}>{b.label}</div>
              <div style={{ fontSize: 10, color: 'var(--p31-text-tertiary)' }}>{b.desc}</div>
            </div>
            <span style={{ color: 'var(--p31-accent-cyan)', fontSize: 14 }}>↗</span>
          </a>
        ))}
      </div>

      {/* Tool Search */}
      <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search tools..." data-mcp-tool="toolSearch" data-mcp-type="input" data-mcp-target="tool-search"
        style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)', color: 'var(--p31-text-primary)', fontSize: 12, fontFamily: 'var(--p31-font-mono, monospace)', outline: 'none', boxSizing: 'border-box' }} />

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {cats.map(c => (
          <button key={c} onClick={() => setCategory(c)} data-mcp-tool="categoryFilter" data-mcp-type="control" data-mcp-target={`cat-${c}`} data-mcp-state={category === c ? 'active' : 'inactive'}
            style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid ' + (category === c ? 'var(--p31-accent-cyan)' : 'rgba(255,255,255,0.08)'), background: category === c ? 'rgba(0,240,255,0.1)' : 'transparent', color: category === c ? 'var(--p31-accent-cyan)' : 'var(--p31-text-tertiary)', fontSize: 10, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {c} ({c === 'all' ? tools.length : tools.filter(t => (TOOL_CATEGORIES[t.name] || 'other') === c).length})
          </button>
        ))}
      </div>

      {/* Tool List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {filtered.map(t => {
          const res = results[t.name];
          return (
            <div key={t.name} data-mcp-tool="toolItem" data-mcp-target={`tool-${t.name}`} data-mcp-state={res?.status || 'idle'}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid ' + (res?.status === 'error' ? 'rgba(251,113,133,0.3)' : res?.status === 'success' ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.04)'), fontSize: 11 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--p31-accent-cyan)', fontFamily: 'var(--p31-font-mono, monospace)', fontSize: 11 }}>{t.name}</div>
                <div style={{ color: 'var(--p31-text-tertiary)', fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.description}</div>
                {res?.status === 'success' && <div style={{ color: 'var(--p31-accent-green)', fontSize: 9, marginTop: 2 }}>✓ {res.result}</div>}
                {res?.status === 'error' && <div style={{ color: 'var(--p31-accent-red)', fontSize: 9, marginTop: 2 }}>✗ {res.error}</div>}
              </div>
              <button onClick={() => callTool(t.name)} disabled={invoking === t.name} data-mcp-tool="invokeTool" data-mcp-type="action" data-mcp-target={`invoke-${t.name}`}
                style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid rgba(0,240,255,0.2)', background: invoking === t.name ? 'rgba(0,240,255,0.05)' : 'rgba(0,240,255,0.08)', color: 'var(--p31-accent-cyan)', fontSize: 10, cursor: 'pointer', whiteSpace: 'nowrap', opacity: invoking === t.name ? 0.5 : 1 }}>
                {invoking === t.name ? '...' : 'Invoke'}
              </button>
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: 'var(--p31-text-tertiary)', fontSize: 11 }}>No tools match your filter.</div>}
      </div>

      <div style={{ fontSize: 9, color: 'var(--p31-text-tertiary)', textAlign: 'center', padding: 4 }}>
        {tools.length} tools · {filtered.length} shown · MCP 2026-07-28
      </div>
    </div>
  );
}
