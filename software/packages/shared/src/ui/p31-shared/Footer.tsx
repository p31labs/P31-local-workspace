import * as React from 'react';
import { cn } from './utils';

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}

export interface FooterProps extends React.HTMLAttributes<HTMLElement> {
  sections?: FooterSection[];
  variant?: 'hub' | 'org';
  /** Organization legal line */
  legal?: string;
  /** Secondary legal line like EIN */
  legalSecondary?: string;
}

export const Footer: React.FC<FooterProps> = ({
  className,
  sections = [],
  variant = 'hub',
  legal = 'P31 Labs, Inc.',
  legalSecondary = 'EIN 42-1888158',
  ...props
}) => {
  const isHub = variant === 'hub';
  return (
    <footer
      className={cn(
        'w-full border-t py-10',
        isHub ? 'bg-hub-void border-hub-cloud/10 text-hub-cloud' : 'bg-org-void border-org-cloud/10 text-org-ink',
        className
      )}
      {...props}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {sections.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-3">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className={cn(
                        'text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/50 rounded',
                        isHub ? 'text-hub-muted hover:text-hub-cloud' : 'text-org-muted hover:text-org-ink'
                      )}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className={cn('mt-10 border-t pt-6 text-xs', isHub ? 'border-hub-cloud/10 text-hub-muted' : 'border-org-cloud/10 text-org-muted')}>
          <p>{legal}</p>
          {legalSecondary && <p className="mt-1">{legalSecondary}</p>}
        </div>
      </div>
    </footer>
  );
};
Footer.displayName = 'Footer';
