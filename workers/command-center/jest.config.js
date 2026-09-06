/**
 * Jest Configuration for EPCP Test Suite
 */
module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  testMatch: [
    '**/tests/**/*.test.js',
  ],
  verbose: true,
  testPathIgnorePatterns: [
    '/node_modules/',
  ],
};
