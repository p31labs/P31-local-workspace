import { SiteNav } from '@p31/ui/chrome';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
];

export default function TemplateNav() {
  return <SiteNav navLinks={NAV_LINKS} />;
}
