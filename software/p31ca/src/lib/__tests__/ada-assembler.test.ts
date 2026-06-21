import { describe, it, expect } from 'vitest';
import { assembleADADocument } from '../ada-assembler';

describe('assembleADADocument — happy path', () => {
  it('renders a complete document from full passport + logs', () => {
    const doc = assembleADADocument({
      passport: { fields: {
        pii: { givenName: 'Will', familyName: 'Johnson' },
        med: {
          diagnoses: ['AuDHD', 'ASD'],
          medications: ['Ritalin'],
          calcium: '9.8',
          pth: '42',
          vitaminD: '28',
        },
        cog: {
          neurotype: 'AuDHD',
          sensorySensitivity: 8,
          executiveFunctionPatterns: 'Time-blind; task-switching cost',
        },
        comm: { modality_order: 'text > voice > sign' },
      }},
      visitationLogs: [
        { date: '2026-06-19', duration: 45, supervisor: 'Brenda', deviations: 'Late' },
        { date: '2026-06-21', duration: 60, supervisor: 'C.J.', deviations: '' },
      ],
    });

    expect(doc).toContain('Will');
    expect(doc).toContain('AuDHD');
    expect(doc).toContain('9.8');
    expect(doc).toContain('Brenda');
    expect(doc).toContain('Late');
    expect(doc).toContain('ADA Title II');
    expect(doc).toContain('expedited hearing');
    expect(doc.length).toBeGreaterThan(300);
  });
});

describe('assembleADADocument — fallback behavior', () => {
  it('uses [Name] when pii.givenName is missing', () => {
    const doc = assembleADADocument({
      passport: { fields: {} },
      visitationLogs: [],
    });
    expect(doc).toContain('[Name]');
  });

  it('defaults neurotype to AuDHD when missing', () => {
    const doc = assembleADADocument({
      passport: { fields: { cog: {} } },
      visitationLogs: [],
    });
    expect(doc).toContain('AuDHD');
  });

  it('defaults sensorySensitivity to 0 when missing', () => {
    const doc = assembleADADocument({
      passport: { fields: { cog: {} } },
      visitationLogs: [],
    });
    const lines = doc.split('\n').filter(l => l.includes('Sensory sensitivity'));
    expect(lines[0]).toContain('0');
  });

  it('uses "Not specified" for missing executiveFunctionPatterns', () => {
    const doc = assembleADADocument({
      passport: { fields: { cog: { executiveFunctionPatterns: undefined as any } } },
      visitationLogs: [],
    });
    expect(doc).toContain('Not specified');
  });

  it('shows "No visitation logs recorded yet." when logs array is empty', () => {
    const doc = assembleADADocument({
      passport: { fields: {} },
      visitationLogs: [],
    });
    expect(doc).toContain('No visitation logs recorded yet');
    expect(doc).not.toContain('|------|');
  });

  it('renders "Not specified" for empty diagnoses and medications', () => {
    const doc = assembleADADocument({
      passport: { fields: { med: { diagnoses: [], medications: [] } } },
      visitationLogs: [],
    });
    expect(doc).toContain('Not specified');
  });

  it('renders N/A for completely missing med block', () => {
    const doc = assembleADADocument({
      passport: { fields: { med: {} } },
      visitationLogs: [],
    });
    expect(doc).toContain('N/A');
  });
});

describe('assembleADADocument — markdown structure', () => {
  it('starts with the H1 title', () => {
    const doc = assembleADADocument({
      passport: { fields: {} },
      visitationLogs: [],
    });
    expect(doc.trim().startsWith('# ADA Accommodation Request')).toBe(true);
  });

  it('contains all 5 numbered sections', () => {
    const doc = assembleADADocument({
      passport: { fields: {} },
      visitationLogs: [],
    });
    expect(doc).toMatch(/\n## 1\./);
    expect(doc).toMatch(/\n## 2\./);
    expect(doc).toMatch(/\n## 3\./);
    expect(doc).toMatch(/\n## 4\./);
    expect(doc).toMatch(/\n## 5\./);
  });

  it('ends with the assembler version footer', () => {
    const doc = assembleADADocument({
      passport: { fields: {} },
      visitationLogs: [],
    });
    expect(doc).toContain('P31 Tetrahedron ADA Assembler v1.0');
  });

  it('produces a valid markdown table when logs are present', () => {
    const doc = assembleADADocument({
      passport: { fields: {} },
      visitationLogs: [
        { date: '2026-06-10', duration: 90, supervisor: 'X', deviations: 'Event' },
      ],
    });
    const lines = doc.split('\n');
    const headerIdx = lines.findIndex((l) => l.startsWith('| Date |'));
    expect(headerIdx).toBeGreaterThan(-1);
    expect(lines[headerIdx + 1]).toContain('------');
    expect(lines[headerIdx + 2]).toContain('| 2026-06-10 |');
  });
});
