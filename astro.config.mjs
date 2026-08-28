import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import { fileURLToPath } from 'node:url';
import { loadLanding, activeSlug } from './packages/config/load.mjs';

const slug = activeSlug();
const landing = loadLanding(slug);

// site нужен Astro для абсолютных URL в canonical/og/sitemap.
// Один домен на ветку — берём его только из конфига, никогда из хардкода.
const site = landing.origin || 'https://example.invalid';

const alias = (p) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  integrations: [tailwind({ applyBaseStyles: false })],
  vite: {
    resolve: {
      alias: {
        '@ui': alias('./packages/ui'),
        '@fonar': alias('./packages/fonar'),
        '@insight': alias('./packages/insight'),
        '@media': alias('./packages/media'),
        '@quiz': alias('./packages/quiz'),
        '@explain': alias('./packages/explain'),
        '@seo': alias('./packages/seo'),
        '@analytics': alias('./packages/analytics'),
        '@legal': alias('./packages/legal'),
        '@config': alias('./packages/config'),
        '@templates': alias('./templates'),
        '@landing': alias(`./landings/${slug}`),
      },
    },
  },
  publicDir: `./landings/${slug}/public`,
});
