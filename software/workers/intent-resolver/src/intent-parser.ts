import { generateInterfaceFromIntent } from '@p31/interface-generator';

export interface ParsedIntent {
  summary: string;
  spoons: number;
  passport: any;
  description: any;
}

// Use the UIG's intent generator (it takes a prompt, not a pre-built viewData).
export async function parseIntent(prompt: string, passport: any, spoons: number): Promise<ParsedIntent> {
  const description = generateInterfaceFromIntent({ prompt, spoons, role: 'participant' });

  const summary =
    (description.widgets ?? [])
      .filter((w: any) => w.type === 'text-block')
      .map((w: any) => w.title)
      .join(' ') || prompt.slice(0, 120);

  return { summary, spoons, passport, description };
}
