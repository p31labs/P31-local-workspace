import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://docs.phosphorus31.org',
  integrations: [
    starlight({
      title: 'P31 Labs',
      description: 'Open-source assistive technology for neurodivergent individuals',
      social: {
        github: 'https://github.com/p31labs/p31',
      },
      customCss: ['./src/styles/custom.css'],
      head: [
        {
          tag: 'script',
          attrs: { type: 'application/ld+json' },
          content: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'P31 Labs',
            url: 'https://phosphorus31.org',
            description: 'Open-source assistive technology for neurodivergent individuals',
            sameAs: ['https://github.com/p31labs/p31'],
          }),
        },
        {
          tag: 'script',
          attrs: { type: 'application/ld+json' },
          content: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'P31 Labs Documentation',
            url: 'https://docs.phosphorus31.org',
          }),
        },
      ],
      sidebar: [
        {
          label: 'Getting Started',
          autogenerate: { directory: 'getting-started' },
        },
        {
          label: 'Architecture',
          autogenerate: { directory: 'architecture' },
        },
      ],
    }),
  ],
});
