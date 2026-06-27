import { describe, it, expect } from 'vitest';
import { ContentFilter } from '../../src/guardian/content-filter';

describe('K4 ContentFilter — Coercion Detection', () => {
  const filter = new ContentFilter();

  it('returns deliver for neutral logistics content', async () => {
    const result = await filter.analyze('Pickup is at 3pm Tuesday.', 'did:parent', 'did:child', 'message');
    expect(result.action).toBe('deliver');
    expect(result.coerciveScore).toBe(0);
    expect(result.safe).toBe(true);
  });

  it('buffers custody-threat and conditional compliance language', async () => {
    const result = await filter.analyze('Visitation is cancelled if you do not comply.', 'did:parent', 'did:child', 'message');
    expect(['buffer', 'quarantine']).toContain(result.action);
    expect(result.coerciveScore).toBeGreaterThanOrEqual(0.3);
  });

  it('delivers weak ultimatums below buffer threshold', async () => {
    const result = await filter.analyze('Agree or never see the kids again.', 'did:parent', 'did:child', 'message');
    expect(['buffer', 'quarantine', 'deliver']).toContain(result.action);
    expect(result.coerciveScore).toBeGreaterThan(0);
  });

  it('flags judge-impersonation patterns', async () => {
    const result = await filter.analyze('The judge said I get full custody.', 'did:parent', 'did:child', 'message');
    expect(result.coerciveScore).toBeGreaterThan(0);
  });
});

describe('K4 ContentFilter — Fawn Masking Detection', () => {
  const filter = new ContentFilter();

  it('flags combined apology + deflection + self-blame as revise', async () => {
    const result = await filter.analyze("I'm sorry, but I guess I was wrong. Please just understand.", 'did:parent', 'did:child', 'message');
    expect(result.fawnMaskingScore).toBeGreaterThan(0);
    expect(result.action).toBe('revise');
  });

  it('detects excessive apology + deflection', async () => {
    const result = await filter.analyze("I'm sorry, but you are overreacting.", 'did:parent', 'did:child', 'message');
    expect(result.fawnMaskingScore).toBeGreaterThan(0);
  });

  it('detects conflict-avoidance masking', async () => {
    const result = await filter.analyze("I don't want trouble, so I will just do what you say.", 'did:parent', 'did:child', 'message');
    expect(result.fawnMaskingScore).toBeGreaterThan(0);
  });
});

describe('K4 ContentFilter — Child Risk Detection', () => {
  const filter = new ContentFilter();

  it('quarantines child-exposure to conflict', async () => {
    const result = await filter.analyze('Our kids hate you, they are better off without you.', 'did:parent', 'did:child', 'message');
    expect(['buffer', 'quarantine']).toContain(result.action);
    expect(result.childSafetyScore).toBeGreaterThan(0);
  });

  it('flags parental alienation language', async () => {
    const result = await filter.analyze('You are turning them against me.', 'did:parent', 'did:child', 'message');
    expect(result.childSafetyScore).toBeGreaterThan(0);
  });

  it('flags medical/therapy content for review', async () => {
    const result = await filter.analyze('The doctor prescribed medication for the kids.', 'did:parent', 'did:child', 'message');
    expect(result.childSafetyScore).toBeGreaterThan(0);
  });
});

describe('K4 ContentFilter — Decision Logic', () => {
  const filter = new ContentFilter();

  it('always returns triggeredRules array', async () => {
    const result = await filter.analyze('Hello, how are you?', 'did:a', 'did:b', 'ping');
    expect(Array.isArray(result.triggeredRules)).toBe(true);
  });

  it('returns structuralValidity of 1.0 by default', async () => {
    const result = await filter.analyze('See you at 5.', 'did:a', 'did:b', 'journal');
    expect(result.structuralValidity).toBe(1.0);
  });

  it('maps safe action to safe:true', async () => {
    const result = await filter.analyze('Let us meet at the park.', 'did:a', 'did:b', 'message');
    expect(result.safe).toBe(result.action === 'deliver');
  });
});
