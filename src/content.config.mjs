// The site's content collections. The changelog is data the build checks: each entry its date, the part of the site
// it's about, one sentence (links in Markdown: [Privacy](/privacy/)) and, for an entry that should lead its section
// in the home page's Updates, a short line. A bad entry stops the build with the reason.
import fs from 'node:fs';
import path from 'node:path';
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { SECTIONS } from './lib/changelog.mjs';

const realDate = (s) => !isNaN(new Date(s + 'T00:00:00Z')) && new Date(s + 'T00:00:00Z').toISOString().startsWith(s);

const changelog = defineCollection({
  // One file, newest first, one entry per line. Each entry's id is its line in the file ("changelog → 0002" in an
  // error is line 2), which also keeps the order
  loader: () => JSON.parse(fs.readFileSync(path.resolve('src/content/changelog.json'), 'utf8'))
    .map((entry, i) => ({ id: String(i + 2).padStart(4, '0'), ...entry })),
  // Strict, so a misspelt field stops the build too (the id is the loader's)
  schema: z.object({
    id: z.string(),
    date: z.string().refine(realDate, 'a date as YYYY-MM-DD'),
    tag: z.enum(SECTIONS.map((s) => s.name)),
    // Updates fits about 40 characters on one row at 1024px; longer is a note in the build log, not an error
    short: z.string().min(1).optional(),
    text: z.string().min(1).refine((s) => !/[<>]/.test(s), 'no HTML: write links in Markdown, words in square brackets then the address in round ones'),
  }).strict(),
});

export const collections = { changelog };
