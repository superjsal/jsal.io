// Astro builds jsal.io into dist/, which Cloudflare serves (wrangler.jsonc). Pages move into src/pages/ one at a
// time; until then site/ is copied into dist/ unchanged, so every page that hasn't moved is served exactly as before.
import { defineConfig } from "astro/config";
import csp from "./.github/build/csp.mjs";

export default defineConfig({
  site: "https://jsal.io",
  publicDir: "./site",
  outDir: "./dist",
  // Every page is a folder with an index.html, as now (/privacy/ is privacy/index.html)
  build: { format: "directory" },
  trailingSlash: "ignore",
  // Pages keep their markup as written: no whitespace folding, so a moved page can be compared with the old file
  compressHTML: false,
  // The content security policy in dist/_headers, written from the built pages once they're all written
  integrations: [csp()],
});
