// Cache numbers for the site's own files, worked out as each page builds: v('/shell.css') is
// '/shell.css?v=' + the first 8 hex characters of the file's SHA-256, line endings as LF. The same number
// .github/build/versions.py writes into the pages still in site/, so check.py holds both to one rule.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// The public folder (astro.config.mjs), from the project folder the build runs in
const PUBLIC = path.resolve('site');

export function v(ref) {
  const bytes = fs.readFileSync(path.join(PUBLIC, ref.replace(/^\//, ''))).toString('latin1').replace(/\r\n/g, '\n');
  return `${ref}?v=${crypto.createHash('sha256').update(bytes, 'latin1').digest('hex').slice(0, 8)}`;
}
