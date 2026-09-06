import { z } from 'zod';

export const MCPAttributeSchema = z.object({
  'data-mcp-tool': z.string(),
  'data-mcp-state': z.string().optional(),
  'data-mcp-target': z.string().optional(),
  'data-mcp-type': z.enum(['control', 'action', 'state']).optional(),
  'data-mcp-range': z.string().optional(),
  'data-mcp-current': z.union([z.string(), z.number()]).optional(),
  'data-mcp-href': z.string().optional(),
  'data-mcp-external': z.string().regex(/^(true|false)$/).optional(),
});

export type MCPAnnotation = z.infer<typeof MCPAttributeSchema> & {
  selector: string;
  tagName: string;
  childCount: number;
  isDisabled: boolean;
  warnings: string[];
};
