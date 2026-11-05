# jsal.io voice

How jsal.io writes, everywhere it speaks: the tools, their About sections, the changelog, LinkedIn and email. The
looks are in `.claude/rules/design-rules.md` and the logo in `.github/brand/README.md`; this is the words. `.github/` isn't served,
so this is for people writing for the site, not visitors.

**In one line:** plain-spoken and exact, playful at the edges. Say what a thing does and who it's for, in the words a
client would use.

## Principles

1. **What it does, for whom, first.** Lead with the job and the person, then the detail.
   "Resize one image or a whole batch to an exact size, fast."
2. **Exact, not impressive.** Real numbers and real names instead of adjectives: "14 platforms, from WordPress to
   Webflow", "JPG, PNG, WebP and HEIC in". No superlatives, no "powerful".
3. **Honest about limits.** Say what a tool won't do and what stays private: "Nothing is uploaded." A platform that
   needs code gets the "Needs code" tag, not a softer word.
4. **Say it once.** Each thing is said in one place on a page (the About sections' rule), so nothing reads as filler.
5. **Playful at the edges, never in the way.** The gamer's touches live in achievements, the Backpack and Off the
   clock. Labels, instructions and warnings stay plain.

## Say this, not that

| Say | Not | Why |
|---|---|---|
| jsal.io, or John Salvador | JSAL, Jsal, JSAL.io | The four capitals are a well-known YouTuber's name |
| Image Resizer | JScale | JScale is an internal code name only |
| Clean Paste | the formatter | `/formatter/` is the folder, not the name |
| Platform Playbook, or the team Playbook | IC | `/ic/` is the folder |
| Off the clock (the menu, Updates, the changelog, links), Mostly Warcraft (only the page's own headline) | the play page | One place, one name wherever it's linked |
| Keep old links working when pages move | 301 redirect management | The words a client would use |
| Free, in your browser, nothing uploaded | client-side, serverless, zero-upload | Say what it means for them |
| Find the CMS that fits | find the perfect solution | |
| A link that names where it goes | click here, read more | Clean Paste's own check flags "click here" links |
| Click (desktop), Tap (touch screens) | Click, everywhere | `data-touch` swaps the word on touch screens |

**Words to leave out:** solution, seamless, powerful, leverage, unlock, cutting-edge, revolutionary, simply, just
(as in "just paste it"), and "AI-powered" for anything that isn't.

## Mechanics

- **British spelling,** as the site writes it: colour, centre.
- **Sentence case** for headings, buttons and labels: "How to use it", "Compare these side by side".
- **Curly quotes and apostrophes:** ’ “ ”.
- **Contractions are fine:** "doesn't", "You’re here".
- **"You" for the visitor, "I" and "me" for John:** "Email me", "SEO steps by platform, for my team".
- **Numbers as digits,** with real units: "1200 × 628", "about 3 seconds".
- **Dates** as "1 November 2026".
- **Buttons say what happens,** verb first: "Compare these side by side".

## Tone by place

| Place | Tone | Example from the site |
|---|---|---|
| Buttons and labels | The shortest exact words. No jokes | "Compare these side by side" |
| The line under a tool's title | Who it's for, by the job in hand, never a job title: anyone can use the tools | "For anyone pasting from Word or Google Docs into WordPress, Shopify, Wix or any CMS." |
| About sections | A bold tagline, then how to use it, then two or three FAQs | "Exact sizes for one image or a batch, with a crop you control, and nothing ever leaves your device." |
| Warnings | What happened and what it means, with no apology and no blame | "May look blurry" |
| Changelog | One sentence on what changed, from the visitor's side (rules below) | "The mouse wheel scrolls the page again over the settings column." |
| Achievements, the Backpack, Off the clock | Where the playfulness goes | "Night owl", "Pixel pusher", "Lost adventurer" |
| LinkedIn and social | First person, one idea a post, one link | The first-person bio in the brand README |
| Email | First name, short, the signature lockup | |

## The changelog

It's for visitors, not a record of every commit, so it stays short enough to read.

1. **Only what a visitor would notice.** Internal fixes, tuning and refactors don't get a line of their own; at most
   one "Small fixes: …" line a day for each part of the site (each tag) gathers the ones worth naming.
2. **One sentence, about 25 words at most.** Say what changed, not why or how it was built.
3. **One feature, one line, per day.** A follow-up on the same day (a fix to something just shipped, a second pass)
   edits that day's line instead of adding another.

## Before and after

Each "after" is the site's own copy.

| Before | After |
|---|---|
| Client-side batch image processing with zero server uploads. | Resize one image or a whole batch to an exact size, fast. Nothing is uploaded. |
| Leverage our powerful CMS comparison engine to find the perfect solution. | Which website builder or CMS fits you? Take a short quiz or compare 14 platforms, from WordPress to Webflow. |
| 301 redirect management | Keep old links working when pages move. |
| Advanced HTML sanitisation for rich-text content. | Checks your post before it goes live (stray H1s, bold lines that should be headings, draft and “click here” links) and copies it for any editor, as HTML or as WordPress blocks. |
