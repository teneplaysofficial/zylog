// @ts-check

import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'http://zylog.vercel.app',
  integrations: [
    starlight({
      title: 'Zylog',
      description: 'A simple and powerful logger for Node.js',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/teneplaysofficial/zylog' },
        {
          icon: 'npm',
          label: 'NPM',
          href: 'https://www.npmjs.com/package/zylog',
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/teneplaysofficial/zylog/edit/main/website/',
      },
      lastUpdated: true,
    }),
  ],
});
