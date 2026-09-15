import { describe, it, expect } from 'vitest';
import skillsData from './generated/skills.json';

const SKILLS = skillsData as Record<string, { title: string; body: string; has_evals: boolean }>;

describe('Skills manifest', () => {
  it('contains p31-standards', () => {
    expect(SKILLS['p31-standards']).toBeDefined();
  });

  it('has non-empty body', () => {
    const skill = SKILLS['p31-standards'];
    expect(skill?.body.length).toBeGreaterThan(100);
  });

  it('body contains audit rules', () => {
    expect(SKILLS['p31-standards'].body).toContain('No hardcoded');
    expect(SKILLS['p31-standards'].body).toContain('No inline styles');
    expect(SKILLS['p31-standards'].body).toContain('Contract compliance');
  });

  it('has_evals is true', () => {
    expect(SKILLS['p31-standards'].has_evals).toBe(true);
  });

  it('title is non-empty', () => {
    expect(SKILLS['p31-standards'].title.length).toBeGreaterThan(0);
  });

  it('list_skills shape matches expected', () => {
    const skills = Object.entries(SKILLS).map(([name, skill]) => ({
      name,
      title: skill.title,
      has_evals: skill.has_evals,
    }));
    expect(skills.length).toBeGreaterThan(0);
    expect(skills[0]).toHaveProperty('name');
    expect(skills[0]).toHaveProperty('title');
    expect(skills[0]).toHaveProperty('has_evals');
  });

  it('get_skill returns body for existing skill', () => {
    const skillName = 'p31-standards';
    const skill = SKILLS[skillName];
    expect(skill).toBeDefined();
    expect(skill.body).toContain('FAILURE MODE');
  });

  it('get_skill returns error for missing skill', () => {
    const skill = SKILLS['nonexistent-skill'];
    expect(skill).toBeUndefined();
  });
});
