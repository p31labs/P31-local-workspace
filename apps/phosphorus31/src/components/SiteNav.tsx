import { SiteNav } from '@p31ca/ui/chrome';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/impact', label: 'Impact' },
  { href: '/products', label: 'Products' },
  { href: '/research', label: 'Research' },
  { href: '/get-involved', label: 'Get Involved' },
  { href: '/blog', label: 'Blog' },
];

export default function Phosphorus31Nav() {
  return <SiteNav navLinks={NAV_LINKS} />;
}
