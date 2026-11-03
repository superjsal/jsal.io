// The content security policy: which scripts, styles, images and connections a page may use. Inline scripts are
// allowed by their SHA-256 hash, so the policy is written from the built pages themselves, at the end of every build
// (astro.config.mjs runs this): it fills the block between the "csp:start" and "csp:end" comments in dist/_headers,
// so the policy Cloudflare sends always matches the pages it serves. Edit the policy here, never in _headers.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SUPABASE = 'kvdzluvhwxkrbatgskio.supabase.co';   // the team Playbook's database (/ic/)
// Google Analytics: gtag.js, and where it sends hits (it tries www.google.com/g/collect before google-analytics.com)
const GA = 'https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://www.google.com';
// Cloudflare ignores a line in _headers over 2,000 characters
const MAX_LINE = 2000;

// Line endings as LF, as the files are served from the repo
const sha = (text) => `'sha256-${crypto.createHash('sha256').update(text.replace(/\r\n/g, '\n'), 'utf8').digest('base64')}'`;

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.html') ? [path.join(dir, e.name)] : []));

/** The hash of every inline script that runs (JSON-LD is data, so it needs none) across the built pages, and of the
 *  speculation rules nav.js adds (each a fixed string assigned to a speculationrules script's textContent). */
export function inlineHashes(dir) {
  const seen = new Set();
  for (const file of walk(dir).sort()) {
    for (const m of fs.readFileSync(file, 'utf8').matchAll(/<script(?<a>[^>]*)>(?<b>.*?)<\/script>/gs)) {
      if (m.groups.a.includes('src=') || m.groups.a.includes('application/ld+json')) continue;
      seen.add(sha(m.groups.b));
    }
  }
  const nav = fs.readFileSync(path.join(dir, 'nav.js'), 'utf8');
  for (const m of nav.matchAll(/rules\.textContent = '(\{"prerender".*?\})';/g)) seen.add(sha(m[1]));
  return [...seen].sort();
}

function policy(hashes, unsafeEval = false) {
  const script = ["'self'", ...hashes, 'https://www.googletagmanager.com', 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/'];
  if (unsafeEval) script.push("'unsafe-eval'");
  return [
    "default-src 'self'",
    `script-src ${script.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${GA} https://${SUPABASE} https://cdn.discordapp.com`,
    "font-src 'self'",
    `connect-src 'self' ${GA} https://${SUPABASE} wss://${SUPABASE}`,
    "worker-src 'self' blob:",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join('; ');
}

export function block(dir) {
  const hashes = inlineHashes(dir);
  return [
    '# csp:start (written from the built pages\' inline scripts at the end of each build)',
    '/*',
    `  Content-Security-Policy: ${policy(hashes)}`,
    '# The Image Resizer\'s HEIC converter builds code as it runs, which only that page allows',
    '/image-resizer/*',
    '  ! Content-Security-Policy',
    `  Content-Security-Policy: ${policy(hashes, true)}`,
    '# csp:end',
  ].join('\n');
}

/** Fills the block in dir/_headers; throws when the block's markers are missing or a line is too long. */
export function write(dir) {
  const file = path.join(dir, '_headers');
  const text = fs.readFileSync(file, 'utf8');
  const marks = /# csp:start.*?# csp:end/s;
  if (!marks.test(text)) throw new Error('_headers has no csp:start/csp:end block for the content security policy');
  const out = block(dir);
  const longest = Math.max(...out.split('\n').map((l) => l.length));
  if (longest > MAX_LINE) throw new Error(`the content security policy is ${longest} characters long; Cloudflare ignores lines over ${MAX_LINE}`);
  fs.writeFileSync(file, text.replace(marks, out));
  return { scripts: inlineHashes(dir).length, longest };
}

/** The Astro integration: runs write() on the build output once every page is written. */
export default function csp() {
  return {
    name: 'jsal-csp',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const { scripts, longest } = write(fileURLToPath(dir));
        logger.info(`content security policy written (${scripts} inline scripts; longest line ${longest} of ${MAX_LINE} characters)`);
      },
    },
  };
}
