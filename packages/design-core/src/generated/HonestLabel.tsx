/**
 * @file HonestLabel — Disclaimer badge for contested-science content.
 * Auto-generated from components.yml.
 *
 * @a2ui-component HonestLabel
 * @a2ui-props children string - Label text
 * @a2ui-example {"component":"HonestLabel","children":"Contested science — see notes"}
 */

export interface HonestLabelProps {
  children: string;
  className?: string;
  style?: React.CSSProperties;
}

export function HonestLabel({ children, className, style }: HonestLabelProps) {
  const cls = `inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono bg-white/5 border border-white/10 text-text-tertiary ${className || ''}`;
  return <span className={cls} style={style}>{children}</span>;
}

export default HonestLabel;
