import { SiteNav } from '@p31/ui/chrome';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
];

export default function BashNav() {
  return <SiteNav navLinks={NAV_LINKS} />;
}
