export interface CreationQuote {
  spoons_saved: number;
  care_value: number;
  time_returned_minutes: number;
  love_amount: number;
  usdc_amount: number;
  recommended_unit: 'love' | 'usdc';
}

// Estimate the Creation Quote from a capability plan.
// Value is denominated in BOTH units up front; the user picks at settlement.
export async function createQuote(
  plan: { tools: string[] },
  passport: any,
  spoons: number,
  preference: string,
): Promise<CreationQuote> {
  const toolCount = plan.tools?.length ?? 0;

  // Spoons saved scales with plan complexity (capped at 5).
  const spoons_saved = Math.min(5, Math.max(0, Math.ceil(toolCount * 0.5)));

  // Care value = spoons_saved * 0.075 (LOVE units).
  const care_value = spoons_saved * 0.075;

  // Time returned = ~5 min per tool.
  const time_returned_minutes = toolCount * 5;

  // LOVE amount is 1:1 with care_value.
  const love_amount = care_value;

  // USDC amount = premium ($0.05) per tool, premium-high ($0.25) for LLM/jitterbug.
  const usdc_amount = plan.tools.reduce((acc: number, tool: string) => {
    return acc + (tool.includes('llm') || tool.includes('jitterbug') ? 0.25 : 0.05);
  }, 0);

  // Auto: route care-network / low-baseline users to LOVE (non-extractive).
  const recommended_unit: 'love' | 'usdc' =
    preference === 'auto'
      ? passport?.baselineSpoons != null && passport.baselineSpoons < 3
        ? 'love'
        : 'usdc'
      : (preference as 'love' | 'usdc');

  return { spoons_saved, care_value, time_returned_minutes, love_amount, usdc_amount, recommended_unit };
}
