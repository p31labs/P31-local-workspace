/**
 * @file CanonFooter — p31ca wrapper around the shared canonical Footer.
 *
 * Maps p31ca's own Resources/Community columns onto the ecosystem's single data-
 * driven @p31/ui/chrome <Footer> so every marketing surface renders the SAME
 * canon footer design with site-specific links.
 */

import { Footer, type FooterColumn, type FooterLink } from '@p31/ui/chrome';

const BLURB = 'ownable stack for cognitively diverse families. Open source, open research, open future.';

const RESOURCES: FooterColumn = {
  title: 'Resources',
  links: [
    { label: 'Research', href: '/research' },
    { label: 'Arcade', href: '/arcade' },
    { label: 'Blog', href: '/blog' },
    { label: 'Zenodo', href: 'https://zenodo.org/search?q=%22P31+Labs%22', external: true },
  ],
};

const COMMUNITY: FooterColumn = {
  title: 'Community',
  links: [
    { label: 'GitHub', href: 'https://github.com/p31labs/p31ca', external: true },
    { label: 'Discord', href: 'https://discord.gg/p31labs', external: true },
    { label: 'LOVE Machine', href: '/love' },
    { label: 'About', href: '/about' },
    { label: 'Lab', href: '/system' },
  ],
};

const LINKS: FooterLink[] = [
  { label: 'Technical hub', href: 'https://p31ca.org/', external: true },
  { label: 'GitHub', href: 'https://github.com/p31labs', external: true },
  { label: 'Discord', href: 'https://discord.gg/uYW5rTCuZ', external: true },
  { label: 'willyj1587@gmail.com', href: 'mailto:willyj1587@gmail.com' },
];

export default function CanonFooter() {
  return <Footer blurb={BLURB} links={LINKS} products={RESOURCES} organization={COMMUNITY} />;
}
