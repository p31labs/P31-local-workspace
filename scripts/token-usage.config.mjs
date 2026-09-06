export default {
  scanDirs: ['packages/ui/src', 'apps'],
  excludeDirs: ['node_modules', 'dist', '__tests__', '.astro'],
  tokenSourceFile: 'packages/design-core/src/css/tokens.css',
  outputFile: '/tmp/token-usage-report.json',
};
