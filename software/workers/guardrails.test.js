const { calculateActionRisk, STATIC_RISK_MAP } = require('./guardrails');

describe('guardrails — circular dependency resolution', () => {
  const spoonsValues = [0, 1, 2, 3, 5, 10];

  Object.keys(STATIC_RISK_MAP).forEach((severity) => {
    it(`actionRiskScore for "${severity}" is stable across spoon values`, () => {
      const scores = spoonsValues.map((spoons) => {
        const action = { severity, spoons };
        return calculateActionRisk(action).actionRiskScore;
      });
      const unique = [...new Set(scores)];
      expect(unique.length).toBe(1);
    });
  });

  it('returns correct scores matching STATIC_RISK_MAP', () => {
    for (const [severity, expected] of Object.entries(STATIC_RISK_MAP)) {
      const result = calculateActionRisk({ severity });
      expect(result.actionRiskScore).toBe(expected);
    }
  });

  it('actionRiskScore is independent of spoons', () => {
    const noSpoons = calculateActionRisk({ severity: 'critical' });
    const withSpoons = calculateActionRisk({ severity: 'critical', spoons: 0 });
    expect(noSpoons.actionRiskScore).toBe(withSpoons.actionRiskScore);
  });
});
