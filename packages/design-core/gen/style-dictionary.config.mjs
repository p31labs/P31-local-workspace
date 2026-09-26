import StyleDictionary from 'style-dictionary';

const config = {
  source: ['tokens/tokens.json'],
  // Quantum Material stance: token sources carry oklch()/color-mix() values.
  // Style Dictionary's color/css transform passes unknown color formats
  // through unchanged, so regeneration preserves OKLCH. scripts/token-audit.mjs
  // guards the committed outputs either way.
  platforms: {
    css_vars: {
      transformGroup: 'css',
      buildPath: 'src/css/',
      files: [
        {
          destination: 'all.css',
          format: 'css/variables',
          filter: (token) =>
            token.$type === 'color' ||
            token.$type === 'dimension' ||
            token.$type === 'fontFamily' ||
            token.$type === 'fontSize' ||
            token.$type === 'fontWeight' ||
            token.$type === 'lineHeight',
        },
      ],
    },
    css_component_styles: {
      transformGroup: 'css',
      buildPath: 'src/css/',
      files: [
        {
          destination: 'container.css',
          format: 'css/variables',
          filter: (token) => token.group === 'component',
        },
      ],
    },
    js_mcp: {
      transformGroup: 'web',
      buildPath: 'mcp/gen/',
      files: [
        {
          destination: 'tokens-data.mjs',
          format: 'javascript/esm',
        },
      ],
    },
    dtcg: {
      buildPath: 'mcp/gen/',
      files: [
        {
          destination: 'tokens-dtc.json',
          format: 'json',
        },
      ],
    },
  },
};

export default config;
