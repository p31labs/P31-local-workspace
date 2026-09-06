import { describe, it, expect } from 'vitest';
import { transformTokensToFigmaVariables, resolveValue, toFigmaType } from '../../../../cli/tokens/figma-sync.mjs';

describe('figma-sync', () => {
  it('transforms tokens.yml structure to Figma Variables JSON', () => {
    const tokens = {
      primitive: {
        color: {
          cyan: { $value: '#00F0FF' },
          magenta: { $value: '#FF00A0' },
        },
        radius: {
          sm: { $value: '8px' },
          md: { $value: '16px' },
        },
        font: {
          inter: { $value: 'Inter' },
        },
        size: {
          sm: { $value: '12px' },
          md: { $value: '16px' },
          lg: { $value: '24px' },
        },
      },
      semantic: {
        color: {
          background: { $value: '{primitive.color.cyan}' },
          text: { $value: '{primitive.color.magenta}' },
        },
      },
    };

    const result = transformTokensToFigmaVariables(tokens);

    expect(result.name).toBe('P31 Sovereign Design System');
    expect(result.variables).toBeDefined();

    const cyanVar = result.variables['primitive/color/cyan'];
    expect(cyanVar).toBeDefined();
    expect(cyanVar.value).toBe('#00F0FF');
    expect(cyanVar.type).toBe('COLOR');

    expect(result.variables['primitive/color/magenta']).toBeDefined();
    expect(result.variables['primitive/radius/sm']).toBeDefined();
    expect(result.variables['primitive/radius/md']).toBeDefined();
    expect(result.variables['primitive/font/inter']).toBeDefined();
    expect(result.variables['primitive/size/sm']).toBeDefined();
    expect(result.variables['primitive/size/md']).toBeDefined();
    expect(result.variables['primitive/size/lg']).toBeDefined();
  });

  it('resolves token references', () => {
    const tokens = {
      primitive: {
        color: {
          cyan: { $value: '#00F0FF' },
        },
      },
      semantic: {
        color: {
          background: { $value: '{primitive.color.cyan}' },
        },
      },
    };

    const result = transformTokensToFigmaVariables(tokens);

    const bgVar = result.variables['semantic/color/background'];
    expect(bgVar).toBeDefined();
    expect(bgVar.value).toBe('#00F0FF');
    expect(bgVar.type).toBe('COLOR');
  });

  it('types hex as COLOR, size as FLOAT, font as STRING', () => {
    expect(toFigmaType('#00F0FF')).toBe('COLOR');
    expect(toFigmaType('rgb(0,0,0)')).toBe('COLOR');
    expect(toFigmaType('16px')).toBe('FLOAT');
    expect(toFigmaType('1.5rem')).toBe('FLOAT');
    expect(toFigmaType('Inter')).toBe('STRING');
  });
});
