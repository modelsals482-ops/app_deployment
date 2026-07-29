import { defineConfig } from 'astro/config';

// Static output (default) — builds to dist/, served exactly like the current site.
// Keep the vercel.json (headers/CSP/redirects) from app_deployment when you deploy this.
export default defineConfig({
  site: 'https://alsflow.cz',
  build: { assets: '_astro' },
});
