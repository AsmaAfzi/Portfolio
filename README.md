This is a [Next.js](https://nextjs.org) portfolio with a GitHub-API CMS.

Project and theme data live in `content/`. The admin UI commits JSON to GitHub via Octokit; Vercel redeploys from those commits.

## Setup

```bash
npm install
cp .env.example .env.local
```

Fill `.env.local`:

- `ADMIN_PASSWORD` — gates the CMS
- `CMS_SESSION_SECRET` — signs the session cookie (use a long random string)
- `GITHUB_TOKEN` — PAT with Contents read/write
- `GITHUB_OWNER` / `GITHUB_REPO` — this repository
- `GITHUB_BRANCH` — usually `main`
- `GITHUB_CONTENT_PREFIX` — leave empty if this app is the repo root; set to `portfolio` if the Next app lives in that folder
- `CLOUDINARY_*` — optional, for image uploads in the CMS

```bash
npm run dev
```

Public site: [http://localhost:3000](http://localhost:3000)  
CMS: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

## CMS routes

- `/admin/projects` — list projects
- `/admin/projects/new` — create
- `/admin/projects/[slug]/edit` — edit or delete
- `/admin/theme` — edit `content/theme.json`

## API

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/projects` | Public | List projects |
| POST | `/api/projects` | Admin | Create project |
| GET | `/api/projects/[slug]` | Public | Get one project |
| PUT | `/api/projects/[slug]` | Admin | Update project |
| DELETE | `/api/projects/[slug]` | Admin | Delete project |
| GET | `/api/theme` | Public | Get theme |
| PUT | `/api/theme` | Admin | Update theme |
| POST | `/api/upload` | Admin | Upload image to Cloudinary |
| POST | `/api/auth/login` | Public | Sign in |
| POST | `/api/auth/logout` | Public | Sign out |

Images: upload via the CMS form (Cloudinary) or paste a CDN URL.
