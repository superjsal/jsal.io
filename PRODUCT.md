# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **First: strangers with a job in hand**, arriving from search on one tool's page: choosing a website platform,
  cleaning a post pasted from Word or Google Docs, resizing images to exact sizes, moving a site and keeping its old
  links working. They haven't heard of jsal.io, decide in seconds whether to trust it, and mostly work on desktop.
- **John's team**, who use the tools every day, often docked in a narrow window beside another site (the Image
  Resizer at about 500 × 1330), and the team-only Platform Playbook.
- **Employers and clients** who look at the site as John's work.

## Product Purpose

jsal.io is John Salvador's personal site: a home page and free browser tools for people who build and move
websites. The CMS Picker is the main tool (a quiz and a comparison of 14 platforms, with SEO and AI search as its
specialty); Clean Paste, the Image Resizer and Redirect Import each do one job. Success is a visitor finishing their
job and trusting the answer. It is not a growth project: no email capture, no accounts for the public tools.

## Positioning

Each tool does one job exactly, in the browser, with nothing uploaded, and says plainly what it can't do. The CMS
Picker's verdicts come from the platforms' own documentation, never from client lists.

## Operating Context

- Tools open with the work area on the first screen; the About section sits below.
- The home page is the way in to the tools, with Updates and a way to email John.
- Off the clock (`/play/`) and the jsal.ui page are the gaming side, kept apart from the tools.
- Visitors arrive on a tool's page far more often than on the home page.

## Capabilities and Constraints

- Astro, one shared layout, each app's CSS and JS shipped as plain files; hosted on Cloudflare.
- Every text and background pair is at least 4.5:1; axe runs on every page in light and dark before each push.
- Browsers that matter: Brave, Chrome and Edge, Firefox; iPhones for the phone layouts.
- A strict content security policy: self-hosted fonts, no third-party scripts beyond analytics.
- The tools stay professional: no game styling on them. The playful side lives in achievements and Off the clock.

## Brand Commitments

- The names "jsal.io" and "John Salvador"; never a standalone "JSAL".
- The logo: a lowercase j on a slate tile with a gold gem for its dot, and gold as the accent (John, 19 November
  2026: the one thing that must survive a redesign untouched).
- The dark colour scheme stays as it is (John, 19 November 2026).
- The voice in `.github/docs/voice.md`: plain-spoken and exact, playful at the edges, British spelling.

## Evidence on Hand

- The live tools and their real output; the CMS Picker's published data for 14 platforms, with sources.
- The changelog (`src/content/changelog.json`).
- Six licensed stock photos used by the Image Resizer's pictures.
- No testimonials, client names, usage numbers or press: none may be invented.

## Product Principles

1. The job comes first: a tool's page is the tool.
2. Exact, not impressive: real numbers and names, limits said plainly.
3. Nothing in a picture invites a click that does nothing.
4. The tools are judged by strangers, so they look professional; play stays at the edges.
5. Say each thing once.

## Accessibility & Inclusion

WCAG 2.2 AA. Colour never carries meaning alone (a caution and an error differ by shape); every animation has a
reduced-motion fallback; touch targets are 44px on touch screens.
