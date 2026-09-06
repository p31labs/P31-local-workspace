#!/usr/bin/env node

import { readFileSync } from 'fs';

const MCP_TOOLS = [
  'toggleDrawer', 'navigate', 'setSpoonLevel', 'scan_ui',
  'clickElement', 'setInputValue', 'scrollToElement',
  'token_list', 'component_schema', 'icon_list',
  'propose_component', 'propose_icon', 'propose_token',
].map(t => t.toLowerCase());

const INTERACTIVE_TAGS = ['button', 'input', 'select', 'a'];

const EXCLUDE_PATTERNS = [
  /\/node_modules\//,
  /\/dist\//,
  /\/__tests__\//,
  /\/test\//,
  /\.test\./,
  /\.spec\./,
  /\/tests\//,
];

const TARGET_PATTERNS = [
  /\.tsx$/,
  /\.jsx$/,
  /\.astro$/,
  /\.html$/,
];

function isExcluded(filePath) {
  return EXCLUDE_PATTERNS.some(p => p.test(filePath));
}

function isTargetFile(filePath) {
  return TARGET_PATTERNS.some(p => p.test(filePath));
}

function isInScope(filePath) {
  return (
    filePath.startsWith('apps/') ||
    filePath.startsWith('packages/ui/')
  );
}

function extractLineAndColumn(content, index) {
  const before = content.slice(0, index);
  const line = (before.match(/\n/g) || []).length + 1;
  const lastNewline = before.lastIndexOf('\n');
  const column = index - lastNewline;
  return { line, column };
}

function extractMcpToolNames(content) {
  const names = [];
  const regex = /data-mcp-tool="([^"]*)"/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    names.push({ name: match[1], index: match.index });
  }
  return names;
}

function checkToolDefinition(toolName) {
  const lower = toolName.toLowerCase();
  return MCP_TOOLS.includes(lower);
}

function findInteractiveElements(content) {
  const elements = [];
  const tagRegex = /<(\/)?(button|input|select|a)(?![a-zA-Z0-9])[\s>]/gi;
  let match;
  while ((match = tagRegex.exec(content)) !== null) {
    if (match[1] === '/') continue;
    const tagStart = match.index;
    const tagName = match[2].toLowerCase();
    const fullTag = content.slice(tagStart, content.indexOf('>', tagStart) + 1);
    if (tagName === 'a' && !/href\s*=/i.test(fullTag)) continue;
    const hasMcpTool = /data-mcp-tool\s*=/i.test(fullTag);
    const hasMcpType = /data-mcp-type\s*=/i.test(fullTag);
    if (!hasMcpTool || !hasMcpType) {
      elements.push({
        tagName,
        index: tagStart,
        hasMcpTool,
        hasMcpType,
      });
    }
  }
  return elements;
}

export const name = 'mcp-contracts';

export function check(filePath, content) {
  if (!isTargetFile(filePath) || isExcluded(filePath)) return [];

  const violations = [];

  const toolAnnotations = extractMcpToolNames(content);
  for (const { name: toolName, index } of toolAnnotations) {
    if (!checkToolDefinition(toolName)) {
      const pos = extractLineAndColumn(content, index);
      violations.push({
        rule: name,
        file: filePath,
        line: pos.line,
        column: pos.column,
        message: `Unknown MCP tool name \`${toolName}\` — no matching server-side handler found. Known tools: ${MCP_TOOLS.map(t => `\`${t}\``).join(', ')}`,
        severity: 'error',
      });
    }
  }

  if (isInScope(filePath)) {
    const missing = findInteractiveElements(content);
    for (const el of missing) {
      const pos = extractLineAndColumn(content, el.index);
      const missingAttrs = [];
      if (!el.hasMcpTool) missingAttrs.push('data-mcp-tool');
      if (!el.hasMcpType) missingAttrs.push('data-mcp-type');
      violations.push({
        rule: name,
        file: filePath,
        line: pos.line,
        column: pos.column,
        message: `<${el.tagName}> is missing MCP contract annotations: ${missingAttrs.join(', ')}. Interactive elements in \`apps/\` and \`packages/ui/\` must have both \`data-mcp-tool\` and \`data-mcp-type\`.`,
        severity: 'warning',
      });
    }
  }

  return violations;
}
