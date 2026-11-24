# Portfolio

A personal portfolio with a small Git-backed CMS, built from scratch to learn how content management systems and web design work under the hood.

## Problem

I wanted a portfolio I could update without touching code, and I wanted to understand what a CMS actually does (content modelling, an admin UI, auth, storage and publishing) instead of hiding it behind a hosted product.

It was just as much a web design exercise: theming, layout, typography and motion on a site that still reads cleanly.

## What I built

A Next.js site that pulls my public GitHub repos, plus a custom admin that edits everything else.

- Content lives as JSON in this repo (`content/*.json`), so Git is the database and every edit has history
- Password-protected admin with signed session cookies and a rate-limited login
- Saves commit straight to GitHub through its API, and Vercel redeploys the site on each commit
- Theme editor (colour wheel, radius, spacing, type scale) that drives CSS variables across the site
- Repo cards with detected tech stack, language breakdown and case studies parsed from each README
- Zod validation on every write, plus security headers, unit tests and CI

## Key challenge

Making a read-only host editable. Vercel's filesystem can't be written at runtime, so the admin commits JSON to GitHub and the site picks it up on the next deploy.

A misconfigured content path once sent every save to a folder the site never read: the admin reported success, but nothing changed. I fixed the path and added a check that fails loudly instead.

## What I'd do differently

- Publish instantly with on-demand revalidation instead of waiting for a redeploy
- Add drafts and previews so changes can be checked before they go live
- Design the content model first, before building the admin UI around it
- Compare the approach against a headless CMS such as Sanity or Payload

## Impact

- Learned the core pieces of a CMS: content model, admin UI, auth, storage, validation and publishing
- Practised web design end to end: design tokens, theming, responsive layout and motion
- I can now update my portfolio from a browser, with every change versioned in Git

## Running locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

```env
GITHUB_OWNER=your-github-username
```

Optional: `GITHUB_TOKEN` for higher API rate limits (read-only is enough to display repos).

Public site: [http://localhost:3000](http://localhost:3000)

## Admin pages

Sign in at `/admin/login`. These env vars let the admin save settings to GitHub:

- `ADMIN_PASSWORD`, `CMS_SESSION_SECRET`
- `GITHUB_TOKEN` with **Contents: Read and write** on this portfolio repo
- `GITHUB_REPO`, `GITHUB_BRANCH`
- `GITHUB_CONTENT_PREFIX`: leave empty when the app sits at the repo root

| Page | What it does |
|------|----------------|
| `/admin/repos` | Show/hide repos, edit descriptions and extra tech (does not touch GitHub) |
| `/admin/profile` | Intro, work experience, certifications (PDF upload), in-progress items |
| `/admin/appearance` | Homepage copy, grid columns, card toggles |
| `/admin/theme` | Colors, spacing, typography, radius |

Settings are saved to `content/site.json`, `content/profile.json` and `content/theme.json` via GitHub commits.

## API

| Route | Auth | Purpose |
|-------|------|---------|
| `GET /api/repos` | Public | All GitHub repos |
| `GET /api/site` | Public | Site layout + hidden repo IDs |
| `PUT /api/site` | Admin | Save layout / visibility |
| `GET /api/theme` | Public | Theme tokens |
| `GET /api/profile` | Public | Profile content (intro, experience, certs) |
| `PUT /api/profile` | Admin | Save profile |
