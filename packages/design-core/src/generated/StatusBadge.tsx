/**
 * @file StatusBadge — Status indicator badge with Live/Beta/Research variants.
 * Auto-generated from components.yml.
 *
 * @a2ui-component StatusBadge
 * @a2ui-props status "live" | "beta" | "research" - Variant
 * @a2ui-props children string - Optional label override
 * @a2ui-example {"component":"StatusBadge","status":"live"}
 */

export interface StatusBadgeProps {
  status?: 'live' | 'beta' | 'research';
  children?: string;
  className?: string;
  style?: React.CSSProperties;
}

const STATUS_CONFIG = {
  live: { label: 'Live', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  beta: { label: 'Beta', color: 'bg-gold/20 text-gold border-gold/30' },
  research: { label: 'Research', color: 'bg-violet/20 text-violet border-violet/30' },
};

export function StatusBadge({ status = 'live', children, className, style }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const label = children || config.label;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${config.color} ${className || ''}`} style={style}>
      {label}
    </span>
  );
}

export default StatusBadge;
