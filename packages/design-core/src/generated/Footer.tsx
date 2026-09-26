/**
 * @file Footer — Site footer with configurable columns, branding, and legal text.
 * Auto-generated from components.yml.
 */

import type { ReactNode } from 'react';

export interface FooterProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Footer({ children, className, style }: FooterProps) {
  return <div className={className} style={style}>{children}</div>;
}

export default Footer;
