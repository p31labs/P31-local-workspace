/**
 * @file GameCard — Game selection card for arcade/play sections.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface GameCardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function GameCard({ children, className, style }: GameCardProps) {
  return <div className={className} style={style}>{children}</div>;
}

export default GameCard;
