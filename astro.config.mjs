import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Static output. Vercel serves ./dist, and the serverless functions in /api are
// picked up from the project root independently of this build.
export default defineConfig({
  site: 'https://alsflow.cz',
  output: 'static',
  // vercel.json sets `cleanUrls: true`, so URLs are extensionless with no trailing
  // slash (/cenik). 'never' makes the generated sitemap and canonicals agree with that.
  trailingSlash: 'never',
  build: {
    format: 'file',      // /cenik.html rather than /cenik/index.html, matching the current site
    assets: '_astro',
    // 'auto' inlines small stylesheets, which would copy global.css into all 13 pages
    // and defeat the point of extracting it. 'never' emits shared hashed files that
    // vercel.json caches as immutable, so the CSS is fetched once for the whole site.
    inlineStylesheets: 'never',
  },
  integrations: [
    sitemap({
      // dekujeme is a post-submit confirmation and 404 is an error page; both are
      // noindex, so listing them would ask Google to index pages we tell it to skip.
      filter: (page) => !/\/(dekujeme|404)$/.test(page.replace(/\.html$/, '')),
      // Emit the extensionless URLs the site actually serves under cleanUrls,
      // so the sitemap agrees with the canonicals instead of listing /cenik.html.
      serialize(item) {
        item.url = item.url.replace(/index\.html$/, '').replace(/\.html$/, '').replace(/\/+$/, '');
        if (!item.url) item.url = 'https://alsflow.cz';
        return item;
      },
    }),
  ],
});
