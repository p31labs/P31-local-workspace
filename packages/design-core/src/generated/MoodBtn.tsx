/**
 * @file MoodBtn — Mood selection button for the willow companion mood grid.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface MoodBtnProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function MoodBtn({ children, className, style }: MoodBtnProps) {
  return <div className={className} style={style}>{children}</div>;
}

export default MoodBtn;
