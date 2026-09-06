// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// FormulaDisplay: renders chemical formulas with HTML <sub>
//
// WCD-50: Unicode subscript characters (₀₁₂…₉) may not
// render on all fonts/devices. This component converts
// them to HTML <sub> elements for universal display.
// ═══════════════════════════════════════════════════════

import type { ReactNode } from 'react';

const SUB_TO_DIGIT: Record<string, string> = {};
for (let i = 0; i <= 9; i++) {
  SUB_TO_DIGIT[String.fromCodePoint(0x2080 + i)] = String(i);
}

export function FormulaDisplay({ formula, className }: { formula: string; className?: string }): ReactNode {
  const parts: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < formula.length) {
    let text = '';
    while (i < formula.length && !SUB_TO_DIGIT[formula[i]!]) {
      text += formula[i];
      i++;
    }
    if (text) parts.push(<span key={key++}>{text}</span>);

    let sub = '';
    while (i < formula.length && SUB_TO_DIGIT[formula[i]!]) {
      sub += SUB_TO_DIGIT[formula[i]!];
      i++;
    }
    if (sub) parts.push(<sub key={key++} className="text-[0.8em] leading-none">{sub}</sub>);
  }

  return <span className={className}>{parts}</span>;
}
