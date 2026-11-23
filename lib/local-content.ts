/**
 * Local content writes work in `next dev` so you see changes immediately.
 * On Vercel the filesystem is read-only (`/var/task`); GitHub commits are the source of truth.
 */
export function canWriteLocalContent() {
  return !process.env.VERCEL;
}
