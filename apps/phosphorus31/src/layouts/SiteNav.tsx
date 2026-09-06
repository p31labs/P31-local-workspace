/**
 * @file SiteNav — phosphorus31-specific nav config.
 * Uses the shared @p31/ui/chrome SiteNav component with brand="phosphorus".
 */

import { SiteNav } from '@p31/ui/chrome';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/impact', label: 'Impact' },
  { href: '/products', label: 'Products' },
  { href: '/research', label: 'Research' },
  { href: '/get-involved', label: 'Get Involved' },
  { href: '/blog', label: 'Blog' },
  { href: '/care', label: 'Care' },
  { href: 'https://phos.p31ca.org', label: 'PHOS', external: true },
  { href: 'https://github.com/p31labs', label: 'GitHub', external: true },
];

export default function Phosphorus31Nav() {
  return <SiteNav navLinks={NAV_LINKS} brand="phosphorus" />;
}
