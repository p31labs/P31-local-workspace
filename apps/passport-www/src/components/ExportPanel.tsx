import { useState } from 'react';
import { usePassportStore } from '../hooks/usePassportStore';

export function ExportPanel() {
  const { exportJSON, exportMD } = usePassportStore();
  const [format, setFormat] = useState<'json' | 'md'>('json');
  const [copied, setCopied] = useState(false);
  const content = format === 'json' ? exportJSON() : exportMD();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="export-panel" data-mcp-tool="exportPanel" data-mcp-state={format}>
      <h3>Export</h3>
      <div className="export-tabs" data-mcp-tool="exportFormatGroup" data-mcp-target="export-tabs">
        <button
          className={`export-tab ${format === 'json' ? 'active' : ''}`}
          onClick={() => setFormat('json')}
          data-mcp-tool="setExportFormat"
          data-mcp-type="control"
          data-mcp-target="export-format-json"
          data-mcp-state={format === 'json' ? 'active' : 'inactive'}
        >
          JSON
        </button>
        <button
          className={`export-tab ${format === 'md' ? 'active' : ''}`}
          onClick={() => setFormat('md')}
          data-mcp-tool="setExportFormat"
          data-mcp-type="control"
          data-mcp-target="export-format-md"
          data-mcp-state={format === 'md' ? 'active' : 'inactive'}
        >
          Markdown
        </button>
      </div>
      <pre className="export-pre" data-mcp-tool="exportContent" data-mcp-target="export-content">{content}</pre>
      <button
        className="btn-copy"
        onClick={handleCopy}
        data-mcp-tool="copyExport"
        data-mcp-type="action"
        data-mcp-target="copy-export"
        data-mcp-state={copied ? 'copied' : 'idle'}
      >
        {copied ? 'Copied!' : 'Copy to clipboard'}
      </button>
    </div>
  );
}