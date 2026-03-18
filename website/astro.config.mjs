// @ts-check

import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import { description, displayName, homepage } from '../package.json' with { type: 'json' };

// https://astro.build/config
export default defineConfig({
  site: homepage,
  integrations: [
    starlight({
      title: `🪵 ${displayName}`,
      description,
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/teneplaysofficial/zylog' },
        { icon: 'npm', label: 'NPM', href: 'https://www.npmjs.com/package/zylog' },
      ],
      editLink: {
        baseUrl: 'https://github.com/teneplaysofficial/zylog/edit/main/website',
      },
      lastUpdated: true,
      sidebar: [
        { label: 'Introduction', link: '/' },
        { label: 'Examples', link: '/examples' },
        {
          label: 'API Reference',
          items: [
            { label: 'Overview', link: '/reference' },
            { label: 'Zylog', link: '/reference/zylog' },
            { label: 'constructor', link: '/reference/constructor' },
            {
              label: 'Configuration',
              collapsed: true,
              autogenerate: { directory: 'reference/config' },
            },
            {
              label: 'Logging Methods',
              collapsed: true,
              autogenerate: { directory: 'reference/logging' },
            },
            {
              label: 'Stream Management',
              collapsed: true,
              autogenerate: { directory: 'reference/streams' },
            },
            {
              label: 'Utilities & Context',
              collapsed: true,
              autogenerate: { directory: 'reference/utils' },
            },
          ],
        },
      ],
    }),
  ],
});
