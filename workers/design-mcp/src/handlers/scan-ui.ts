export interface MCPAnnotation {
  selector: string;
  tagName: string;
  attributes: Record<string, string>;
  childCount: number;
  isDisabled: boolean;
  warnings: string[];
}

export function scanUI(html: string): MCPAnnotation[] {
  const annotations: MCPAnnotation[] = [];

  const tagRegex = /<([a-zA-Z][a-zA-Z0-9]*)[^>]*data-mcp-tool="([^"]*)"[^>]*>/g;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(html)) !== null) {
    const tagName = match[1];
    const tool = match[2];
    const fullTag = match[0];

    const attrs: Record<string, string> = {};
    const attrRegex = /data-mcp-([a-zA-Z-]+)="([^"]*)"/g;
    let attrMatch: RegExpExecArray | null;
    while ((attrMatch = attrRegex.exec(fullTag)) !== null) {
      attrs[`data-mcp-${attrMatch[1]}`] = attrMatch[2];
    }

    annotations.push({
      selector: `${tagName.toLowerCase()}[data-mcp-tool="${tool}"]`,
      tagName: tagName.toLowerCase(),
      attributes: attrs,
      childCount: 0,
      isDisabled: false,
      warnings: [],
    });
  }

  return annotations;
}
