import React from 'react';
import type { ReactNode, CSSProperties } from 'react';

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface FooterProps {
  columns?: FooterColumn[];
  brandLabel?: string;
  brandIcon?: ReactNode;
  tagline?: string;
  copyright?: string;
  legalText?: string;
  className?: string;
  style?: CSSProperties;
}

const DEFAULT_COLUMNS = [
  {
    title: 'System',
    links: [
      { label: 'Tokens', href: '/tokens' },
      { label: 'Components', href: '/components' },
      { label: 'Recipes', href: '/recipes' },
      { label: 'Icons', href: '/icons' },
    ],
  },
  {
    title: 'Explore',
    links: [
      { label: 'Glass Lab', href: '/glass' },
      { label: 'Brands', href: '/brands' },
      { label: 'Playground', href: '/playground' },
      { label: 'Accessibility', href: '/a11y' },
    ],
  },
];

/**
 * Site footer with configurable columns, branding, and legal text.
 * Router-agnostic: accepts Link components or href strings.
 */
export function Footer({
  columns = [],
  brandLabel = 'P31',
  brandIcon,
  tagline = 'Sovereign, neuroinclusive interface foundation.',
  copyright,
  legalText = 'MIT · built on DTCG tokens',
  className = '',
  style,
}: FooterProps) {
  const currentYear = new Date().getFullYear();
  const effectiveColumns = columns.length > 0 ? columns : [
    {
      title: 'System',
      links: [
        { label: 'Tokens', href: '/tokens' },
        { label: 'Components', href: '/components' },
        { label: 'Recipes', href: '/recipes' },
        { label: 'Icons', href: '/icons' },
      ],
    },
    {
      title: 'Explore',
      links: [
        { label: 'Glass Lab', href: '/glass' },
        { label: 'Brands', href: '/brands' },
        { label: 'Playground', href: '/playground' },
        { label: 'Accessibility', href: '/a11y' },
      ],
    },
  ];

  return (
    <footer className={`site-footer ${className}`.trim()} style={style}>
      <div className="site-footer-grid">
        <div className="site-footer-brand">
          <div className="site-footer-mark">
            {brandIcon || <span className="brand-icon" aria-hidden="true">P31</span>}
            <span>{brandLabel}</span>
          </div>
          <p className="site-footer-tag">{tagline}</p>
        </div>
        {effectiveColumns.map((col) => (
          <nav key={col.title} className="site-footer-col" aria-label={col.title}>
            <h3>{col.title}</h3>
            {col.links.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </nav>
        ))}
      </div>
      <div className="site-footer-legal">
        <span>© {copyright ?? new Date().getFullYear()} P31 Labs</span>
        <span className="font-mono">{legalText}</span>
      </div>
    </footer>
  );
}

export default Footer;