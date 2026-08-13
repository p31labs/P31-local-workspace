import { useState, useEffect } from 'react';

interface Tool {
  name: string;
  description: string;
}

interface McpExplorerProps {
  open: boolean;
  onClose: () => void;
}

const TOOL_GROUPS: Record<string, Tool[]> = {
  'Ship Tools': [
    { name: 'ship_set_spoons', description: 'Set spoon level (0-5)' },
    { name: 'ship_toggle_view', description: 'Toggle dome / Bucky view' },
    { name: 'ship_toggle_larmor', description: 'Toggle Larmor pulse animation' },
    { name: 'ship_send_transmission', description: 'Send a care transmission' },
    { name: 'ship_get_coherence', description: 'Read current coherence value' },
  ],
};

export default function McpExplorer({ open, onClose }: McpExplorerProps) {
  const [activeGroup, setActiveGroup] = useState<string>('Ship Tools');

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const tools = TOOL_GROUPS[activeGroup] || [];

  return (
    <div className="mcp-overlay" onClick={onClose}>
      <div className="mcp-panel" onClick={(e) => e.stopPropagation()}>
        <div className="mcp-header">
          <h3 className="mcp-title">MCP Explorer</h3>
          <button className="mcp-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="mcp-body">
          <nav className="mcp-groups" aria-label="Tool groups">
            {Object.keys(TOOL_GROUPS).map((group) => (
              <button
                key={group}
                className={`mcp-group-btn${activeGroup === group ? ' active' : ''}`}
                onClick={() => setActiveGroup(group)}
              >
                {group}
              </button>
            ))}
          </nav>
          <ul className="mcp-list" role="list">
            {tools.map((tool) => (
              <li key={tool.name} className="mcp-tool">
                <code className="mcp-tool-name">{tool.name}</code>
                <p className="mcp-tool-desc">{tool.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
