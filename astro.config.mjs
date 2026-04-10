// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

import sentry from '@sentry/astro';

// https://astro.build/config
export default defineConfig({
  site: 'https://pixelperfection.dev',
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [sitemap(), sentry({
    project: 'pixelperfection-landing-page',
    org: "pixel-perfection",
    authToken: process.env.SENTRY_AUTH_TOKEN,
  }),
]
});