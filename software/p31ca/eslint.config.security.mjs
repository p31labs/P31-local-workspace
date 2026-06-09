// ESLint security-focused config — P31 Labs
// Targets: src/**/*.ts, workers/**/*.ts
// Run via: npm run security:lint
// Separate from any existing .eslintrc to avoid conflicts with Astro's config.

import security from "eslint-plugin-security";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  {
    files: ["src/**/*.ts", "workers/**/*.ts", "scripts/**/*.mjs"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
    },
    plugins: {
      security,
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      // ── eslint-plugin-security (P1 in CI — warn, promote to error after triage) ──
      "security/detect-eval-with-expression": "warn",
      "security/detect-non-literal-regexp": "warn",
      "security/detect-non-literal-fs-filename": "warn",
      "security/detect-object-injection": "warn",       // many false positives; triage before promoting
      "security/detect-possible-timing-attacks": "warn",
      "security/detect-pseudoRandomBytes": "error",     // crypto.pseudoRandomBytes is broken — P0
      "security/detect-buffer-noassert": "error",       // buffer.readUInt8(x, noAssert=true) — P0
      "security/detect-unsafe-regex": "warn",
      "security/detect-disable-mustache-escape": "warn",
      "security/detect-no-csrf-before-method-override": "warn",
      "security/detect-new-buffer": "error",            // new Buffer() deprecated and unsafe — P0

      // ── TypeScript safety (warn in security mode; these catch common auth bugs) ──
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unsafe-assignment": "off", // too noisy without tsconfig project
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",

      // ── Node/CF crypto hygiene ──
      // Flag Math.random() usage (use crypto.getRandomValues for tokens/challenges).
      // IMPORTANT: do not restrict the entire `Math` global — that false-positives on Math.min/Math.max/etc.
      "no-restricted-properties": [
        "warn",
        {
          object: "Math",
          property: "random",
          message:
            "Math.random() is not cryptographically secure. Use crypto.getRandomValues() (WebCrypto) for tokens/challenges.",
        },
      ],
    },
  },
  {
    // Relax some rules for build/verify scripts — not deployed code
    files: ["scripts/**/*.mjs"],
    rules: {
      "security/detect-non-literal-fs-filename": "off",
      "security/detect-object-injection": "off",
      "no-restricted-globals": "off",
      "no-restricted-properties": "off",
    },
  },
  {
    // Ignore generated + dist
    ignores: [
      "dist/**",
      "build/**",
      "node_modules/**",
      "public/**",          // static HTML — not TypeScript
      "**/*.d.ts",
    ],
  },
];
