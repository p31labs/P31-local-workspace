/**
 * @file CompanionCard — Child-friendly glass card for willow companion portal, with warm rounded styling.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface CompanionCardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function CompanionCard({ children, className, style }: CompanionCardProps) {
  return <div className={className} style={style}>{children}</div>;
}

export default CompanionCard;
