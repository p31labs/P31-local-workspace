export interface ZephyrComponent {
  name: string;
  path: string;
  description: string;
  tags: string[];
  category: string;
  tokens: string[];
  mcp?: {
    tool: string;
    type: string;
    range?: [number, number];
    target?: string;
  };
}
