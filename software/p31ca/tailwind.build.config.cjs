/** Tailwind config for building p31-tw.css (replaces CDN on static public pages). */
module.exports = {
  content: ["./public/**/*.html"],
  darkMode: ["class", '[data-p31-appearance="hub"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Atkinson Hyperlegible"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      colors: {
        void: "var(--p31-void)",
        surface: "var(--p31-surface)",
        surface2: "var(--p31-surface2)",
        coral: "var(--p31-coral)",
        teal: "var(--p31-teal)",
        cyan: "var(--p31-cyan)",
        cloud: "var(--p31-cloud)",
        butter: "var(--p31-butter)",
        lavender: "var(--p31-lavender)",
        phosphorus: "var(--p31-phosphorus)",
        paper: "var(--p31-paper)",
        ink: "var(--p31-ink)",
        muted: "var(--p31-muted)",
        phosphor: "var(--p31-phosphor)",
        tone: {
          teal:       { 0:"var(--p31-tone-teal-0)",       1:"var(--p31-tone-teal-1)",       2:"var(--p31-tone-teal-2)",       3:"var(--p31-tone-teal-3)",       4:"var(--p31-tone-teal-4)",       5:"var(--p31-tone-teal-5)" },
          coral:      { 0:"var(--p31-tone-coral-0)",      1:"var(--p31-tone-coral-1)",      2:"var(--p31-tone-coral-2)",      3:"var(--p31-tone-coral-3)",      4:"var(--p31-tone-coral-4)",      5:"var(--p31-tone-coral-5)" },
          phosphorus: { 0:"var(--p31-tone-phosphorus-0)", 1:"var(--p31-tone-phosphorus-1)", 2:"var(--p31-tone-phosphorus-2)", 3:"var(--p31-tone-phosphorus-3)", 4:"var(--p31-tone-phosphorus-4)", 5:"var(--p31-tone-phosphorus-5)" },
          butter:     { 0:"var(--p31-tone-butter-0)",     1:"var(--p31-tone-butter-1)",     2:"var(--p31-tone-butter-2)",     3:"var(--p31-tone-butter-3)",     4:"var(--p31-tone-butter-4)",     5:"var(--p31-tone-butter-5)" },
          lavender:   { 0:"var(--p31-tone-lavender-0)",   1:"var(--p31-tone-lavender-1)",   2:"var(--p31-tone-lavender-2)",   3:"var(--p31-tone-lavender-3)",   4:"var(--p31-tone-lavender-4)",   5:"var(--p31-tone-lavender-5)" },
        },
        elev: {
          0:"var(--p31-elev-0-tone)", 1:"var(--p31-elev-1-tone)", 2:"var(--p31-elev-2-tone)",
          3:"var(--p31-elev-3-tone)", 4:"var(--p31-elev-4-tone)", 5:"var(--p31-elev-5-tone)",
        },
      },
      boxShadow: {
        0:"var(--p31-elev-0-shadow)", 1:"var(--p31-elev-1-shadow)", 2:"var(--p31-elev-2-shadow)",
        3:"var(--p31-elev-3-shadow)", 4:"var(--p31-elev-4-shadow)", 5:"var(--p31-elev-5-shadow)",
      },
      borderRadius: {
        xs:"var(--p31-shape-xs)", sm:"var(--p31-shape-sm)", md:"var(--p31-shape-md)",
        lg:"var(--p31-shape-lg)", xl:"var(--p31-shape-xl)", "2xl":"var(--p31-shape-2xl)",
        full:"var(--p31-shape-full)", asymmetric:"var(--p31-shape-asymmetric)",
      },
    },
  },
  plugins: [],
};
