// Astro builds jsal.io into dist/, which Cloudflare serves (wrangler.jsonc): the pages from src/pages/, and every
// file in site/ (the apps' CSS and JS, images, fonts, data) copied as it is.
import { defineConfig } from "astro/config";
import csp from "./.github/build/csp.mjs";

export default defineConfig({
  site: "https://jsal.io",
  publicDir: "./site",
  outDir: "./dist",
  // Every page is a folder with an index.html (/privacy/ is privacy/index.html)
  build: { format: "directory" },
  trailingSlash: "ignore",
  // Pages keep their markup as written: no whitespace folding, so a built page reads like its source
  compressHTML: false,
  // The content security policy in dist/_headers, written from the built pages once they're all written
  integrations: [csp()],
});
