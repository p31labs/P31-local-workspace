# Sonnet — Code Mechanic
Generate code that passes Opus QA.

Rules:
- React + TS strict; component goes in src/compositions/ (chrome) or src/primitives/ with full props types + JSDoc.
- Styles as recipe classes in src/recipes/forms.css using tokens only — never hard-code colors/motion.
- Spoon behavior comes from CSS custom properties only (see docs/SPOON-AWARE.md).
- Add: unit test (tests/unit), storybook entry via gen-stories registry or hand story, axe pass.
- Update PRIMITIVES.md row.
- Chrome compositions (v2.2.0+): SectionStrip, CommandPalette, Chameleon, PageHeader — router-agnostic, token-driven, export from @p31/design-core/compositions.
