// llms.txt: a plain-text guide to the site for AI tools (llmstxt.org). The CMS Picker's platforms come from its
// published data, so the list stays right when a platform joins or leaves.
import fs from 'node:fs';
import path from 'node:path';

// A few words after a name the reader may not know
const NOTE = { sanity: 'a headless CMS' };
const named = (p) => (NOTE[p.id] ? `${p.name} (${NOTE[p.id]})` : p.name);
const list = (names) => `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;

export function GET() {
  const data = JSON.parse(fs.readFileSync(path.resolve('site/cms-picker/data.json'), 'utf8'));
  const platforms = data.platforms.filter((p) => p.profile);
  const pages = platforms.map((p, i) => (i ? `/${p.id}/` : `https://jsal.io/cms-picker/${p.id}/`)).join(', ');
  return new Response(`# jsal.io

> Personal site of John Salvador, a web developer who works in technical SEO and builds small, free web tools that run in the browser (nothing is uploaded; Redirect Import's optional live check is the one thing that leaves it).

## Tools

- [Image Resizer](https://jsal.io/image-resizer/): Resize, crop and convert one image or a whole batch. Presets for 1200 × 628 (blog posts and social share images) and 640 × 420 (smaller feature images), custom sizes, or keep the original size and only convert. Accepts JPG, PNG, WebP and HEIC; saves JPG, PNG or WebP to downloads, a ZIP or a chosen folder.
- [Clean Paste](https://jsal.io/formatter/): Paste content from Word, Google Docs, a web page or HTML code and get clean, minimal HTML. Checks headings and links (drafts, Word bookmarks, vague link text), and copies as formatted text, HTML, plain text or WordPress block markup.
- [Redirect Import](https://jsal.io/redirects/): Paste or drop a spreadsheet of old and new page addresses (CSV or Excel) and get the redirect import file for Shopify, Wix, Squarespace, Webflow, Framer, HubSpot, BigCommerce, Duda, Ghost, WordPress (Redirection, Rank Math, Yoast SEO Premium), Netlify, Vercel, Apache or Nginx, or a CSV with any header row and separator. Removes domains and tracking tags, encodes accented letters, shortens redirect chains, and flags what would break an import: spaces, characters copied from Word, missing addresses, the same old address sent to two places, loops and each platform's limits. The sheet stays editable beside the file. Once the new site is live, an optional live check visits each old address and says whether it lands on its new page (the old addresses are sent to jsal.io's checker for that, and not stored).
- [CMS Picker](https://jsal.io/cms-picker/): Helps a business choose a CMS. Find your fit: up to eight questions (what you're making, what kind of business, who builds and updates it, who looks after hosting, what you need from day one such as bookings, paid members, selling, a blog or a second language, how much design control, whether you're moving from another platform, and monthly budget) give the best matches, why each fits, what sets them apart, what a platform you're leaving lets you take with you, and first steps on each. A profile of each of ${platforms.length} platforms (${list(platforms.map(named))}): what type it is, who it suits, when it is less suited, its main features, its built-in AI tools, who handles hosting and updates, and what you can export. Then a side-by-side comparison in three parts: what it costs to start (price bands from each platform's pricing page), features (a blog, paid members, an online store, multiple languages, forms, fully custom design) and SEO (search titles and descriptions, URLs, 301 redirects, your own structured data, noindex and controlling AI crawlers). Each answer is marked as checked against the platform's own docs or not yet verified. General guidance.
- CMS Picker platform pages (${pages}): one page per platform answering its SEO questions (search titles and descriptions, URLs, 301 redirects, structured data, noindex, AI crawlers), each with the menu path to the setting and a link to the platform's own help page, plus a short profile and what's built in.

## About

- [Home](https://jsal.io/): Who John is and the tools.
- [Off the clock](https://jsal.io/play/): Mostly Warcraft: what John is playing, his game UI, ways to say hi, and the site's achievements.
- [jsal.ui](https://jsal.io/jsal-ui/): John's free WoW Forever addon: daily games for the guild, talent and training planners, a flight bar and easy helpers. Code: https://github.com/superjsal/jsal-ui
- [Privacy](https://jsal.io/privacy/): Files never leave the browser; basic Google Analytics usage stats, only with consent in Europe.
- Contact: dev@jsal.io
- Code: https://github.com/superjsal

## Optional

- Platform Playbook (https://jsal.io/ic/) is a private, sign-in-only tool for John's team: SEO implementation answers and how-to steps per website platform (Shopify, WordPress, Wix and others). Its content is not public.
`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
