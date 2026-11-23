# Portfolio

Next.js portfolio that displays your **public GitHub repositories** (read-only). Admin lets you hide repos from the site and edit layout/theme — nothing deletes repos on GitHub.

## Quick setup

```bash
npm install
cp .env.example .env.local
```

```env
GITHUB_OWNER=your-github-username
```

Optional: `GITHUB_TOKEN` for higher API rate limits (read-only is enough).

## Admin CMS

Sign in at `/admin/login`. Configure admin env vars to save settings to GitHub:

- `ADMIN_PASSWORD`, `CMS_SESSION_SECRET`
- `GITHUB_TOKEN` with **Contents: Read and write** on this portfolio repo
- `GITHUB_REPO`, `GITHUB_BRANCH`, `GITHUB_CONTENT_PREFIX`

| Page | What it does |
|------|----------------|
| `/admin/repos` | Show/hide repos on your site (does not touch GitHub) |
| `/admin/profile` | Intro, work experience, certifications (PDF upload), in-progress items |
| `/admin/appearance` | Homepage copy, grid columns, card toggles |
| `/admin/theme` | Colors, spacing, typography, radius |

Settings are saved to `content/site.json`, `content/profile.json`, and `content/theme.json` via GitHub commits.

```bash
npm run dev
```

Public site: [http://localhost:3000](http://localhost:3000)

## API

| Route | Auth | Purpose |
|-------|------|---------|
| `GET /api/repos` | Public | All GitHub repos |
| `GET /api/site` | Public | Site layout + hidden repo IDs |
| `PUT /api/site` | Admin | Save layout / visibility |
| `GET /api/theme` | Public | Theme tokens |
| `GET /api/profile` | Public | Profile content (intro, experience, certs) |
| `PUT /api/profile` | Admin | Save profile |
