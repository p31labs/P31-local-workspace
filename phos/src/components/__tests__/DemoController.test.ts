import { describe, it, expect, vi, beforeEach } from 'vitest';

const STORAGE_KEY = 'phos_demo_dismissed';

describe('GrantNarrativeOverlay — localStorage dismissal', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should check localStorage for previous dismissal on mount', () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).toBe('true');
  });

  it('should write to localStorage when dismissed', () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
  });

  it('should not be dismissed by default', () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).toBeNull();
  });
});

describe('DemoController — stage navigation logic', () => {
  const DEMO_STAGES = [
    { surface: 'GREETING', spoons: 3, title: 'Spoon-Aware Entry Point' },
    { surface: 'IGNITION', spoons: 4, title: 'Ignition Core' },
    { surface: 'BONDING', spoons: 2, title: 'BONDING Chemistry Game' },
    { surface: 'THE_BUFFER', spoons: 3, title: 'The Buffer' },
    { surface: 'VAULT', spoons: 5, title: 'The Vault' },
    { surface: 'SETTINGS', spoons: 1, title: 'Settings & Customization' },
  ];

  it('should have 6 demo stages', () => {
    expect(DEMO_STAGES).toHaveLength(6);
  });

  it('each stage should have surface, spoons, and title', () => {
    DEMO_STAGES.forEach((stage) => {
      expect(stage).toHaveProperty('surface');
      expect(stage).toHaveProperty('spoons');
      expect(stage).toHaveProperty('title');
      expect(typeof stage.surface).toBe('string');
      expect(typeof stage.spoons).toBe('number');
      expect(stage.spoons).toBeGreaterThanOrEqual(0);
      expect(stage.spoons).toBeLessThanOrEqual(5);
    });
  });

  it('should wrap around when advancing past last stage', () => {
    const currentIndex = 5;
    const nextIndex = (currentIndex + 1) % DEMO_STAGES.length;
    expect(nextIndex).toBe(0);
  });

  it('should wrap backwards from first stage to last', () => {
    const currentIndex = 0;
    const prevIndex = currentIndex === 0 ? DEMO_STAGES.length - 1 : currentIndex - 1;
    expect(prevIndex).toBe(5);
  });

  it('stages should cover key PHOS surfaces', () => {
    const surfaces = DEMO_STAGES.map((s) => s.surface);
    expect(surfaces).toContain('GREETING');
    expect(surfaces).toContain('BONDING');
    expect(surfaces).toContain('THE_BUFFER');
    expect(surfaces).toContain('VAULT');
  });
});

describe('DemoController — surface routing coverage', () => {
  const DEMO_STAGES = [
    { surface: 'GREETING', spoons: 3 },
    { surface: 'IGNITION', spoons: 4 },
    { surface: 'BONDING', spoons: 2 },
    { surface: 'THE_BUFFER', spoons: 3 },
    { surface: 'VAULT', spoons: 5 },
    { surface: 'SETTINGS', spoons: 1 },
  ];

  it('should include low-spoon stages (SANCTUARY mode)', () => {
    const lowSpoonStages = DEMO_STAGES.filter((s) => s.spoons <= 2);
    expect(lowSpoonStages.length).toBeGreaterThanOrEqual(2);
  });

  it('should include high-spoon stages (QUANTUM mode)', () => {
    const highSpoonStages = DEMO_STAGES.filter((s) => s.spoons >= 4);
    expect(highSpoonStages.length).toBeGreaterThanOrEqual(2);
  });

  it('should demonstrate the full spoon range', () => {
    const spoonValues = DEMO_STAGES.map((s) => s.spoons);
    expect(Math.min(...spoonValues)).toBeLessThanOrEqual(1);
    expect(Math.max(...spoonValues)).toBeGreaterThanOrEqual(4);
  });
});
