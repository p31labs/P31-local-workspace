// @p31/shared — ESLint 9 flat config. Warnings = report; no warnings-as-errors in CI.
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  {
    linterOptions: { reportUnusedDisableDirectives: 'off' },
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    // Demo / scratch — not part of the published API surface
    files: ['src/integration-example.ts', 'src/**/*.stories.*'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  { ignores: ['dist', 'node_modules', '**/*.d.ts', '**/*.config.*'] },
];
