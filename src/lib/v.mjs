// Cache numbers for the site's own files, worked out as each page builds: v('/shell.css') is
// '/shell.css?v=' + the first 8 hex characters of the file's SHA-256, line endings as LF. The same number
// .github/build/versions.py writes into the apps' module imports in site/, so check.py holds both to one rule.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// The public folder (astro.config.mjs), from the project folder the build runs in
const PUBLIC = path.resolve('site');

// A relative ref ("styles.css") is read from the page's own folder, dir ("/formatter/"), and goes out as written
export function v(ref, dir = '/') {
  const file = path.posix.join(dir, ref).replace(/^\//, '');
  const bytes = fs.readFileSync(path.join(PUBLIC, file)).toString('latin1').replace(/\r\n/g, '\n');
  return `${ref}?v=${crypto.createHash('sha256').update(bytes, 'latin1').digest('hex').slice(0, 8)}`;
}

// An app's import map, each module pointing at its current version. A vendor file keeps the ?v= it's written with
// (vendor files don't change, so they aren't hashed).
export function importmap(dir, refs) {
  const imports = {};
  for (const ref of refs) {
    const bare = ref.replace(/\?.*$/, '');
    imports[bare] = ref.includes('?') ? ref : v(ref, dir);
  }
  return '\n' + JSON.stringify({ imports }, null, 2) + '\n';
}
