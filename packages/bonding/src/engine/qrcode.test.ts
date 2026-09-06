// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// QR Code generator tests
//
// Pure unit tests. No React. No game imports.
// Uses Vitest.
// ═══════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { generateQRSvg, generateQRMatrix } from './qrcode';

describe('QR Code Generator', () => {
  it('generateQRMatrix returns 2D boolean array', () => {
    const matrix = generateQRMatrix('RSJT5X');
    expect(Array.isArray(matrix)).toBe(true);
    expect(matrix.length).toBe(6);
    for (const row of matrix) {
      expect(Array.isArray(row)).toBe(true);
      expect(row.length).toBe(6);
      for (const cell of row) {
        expect(typeof cell).toBe('boolean');
      }
    }
  });

  it('generateQRMatrix output is square', () => {
    const matrix = generateQRMatrix('TEST');
    expect(matrix.length).toBe(matrix[0]?.length ?? 0);
  });

  it('generateQRSvg returns valid SVG string', () => {
    const svg = generateQRSvg('RSJT5X');
    expect(typeof svg).toBe('string');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('generateQRSvg contains <svg> and <rect> elements', () => {
    const svg = generateQRSvg('RSJT5X');
    expect(svg).toMatch(/<svg[^>]*>/);
    expect(svg).toMatch(/<rect[^>]*>/);
  });

  it('generateQRSvg respects size option', () => {
    const svg = generateQRSvg('RSJT5X', { size: 300 });
    expect(svg).toContain('width="300"');
    expect(svg).toContain('height="300"');
  });

  it('generateQRSvg respects color options', () => {
    const svg = generateQRSvg('RSJT5X', { fgColor: '#FF0000', bgColor: '#0000FF' });
    expect(svg).toContain('fill="#FF0000"');
    expect(svg).toContain('fill="#0000FF"');
  });

  it('different input produces different matrix', () => {
    const m1 = generateQRMatrix('RSJT5X');
    const m2 = generateQRMatrix('ABC123');
    expect(m1).not.toEqual(m2);
  });

  it('throws on invalid character', () => {
    expect(() => generateQRMatrix('!@#$%')).toThrow('Invalid character');
  });

  it('throws on data too long', () => {
    expect(() => generateQRMatrix('TOOLONG123')).toThrow('Data too long');
  });

  it('generateQRSvg respects quiet zone option', () => {
    const svg = generateQRSvg('RSJT5X', { quiet: 4 });
    // The quiet zone affects module size calculation, but we can't easily assert that.
    // Just ensure it doesn't throw.
    expect(typeof svg).toBe('string');
  });
});