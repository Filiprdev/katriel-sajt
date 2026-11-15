// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Production domain.
  site: 'https://www.katrielaccessories.com',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  // English at /, Serbian (Latin) at /sr/.
  i18n: {
    locales: ['en', 'sr'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'en', locales: { en: 'en', sr: 'sr-Latn-RS' } },
    }),
  ],
});
