import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isValidSessionToken, SESSION_COOKIE } from "@/lib/auth";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!isValidSessionToken(token)) {
    return { ok: false as const, response: jsonError("Unauthorized.", 401) };
  }
  return { ok: true as const };
}

export function mapGitHubError(error: unknown) {
  if (error && typeof error === "object" && "status" in error) {
    const status = Number(error.status);
    if (status === 401) return "GitHub token is invalid or expired.";
    if (status === 403) return "GitHub token lacks permission for this repo.";
    if (status === 404) return "Repository, branch, or file was not found on GitHub.";
    if (status === 422) return "GitHub rejected the commit. Check branch protection rules.";
    if (status === 429) return "GitHub rate limit reached. Try again shortly.";
  }

  if (error instanceof Error) return error.message;
  return "GitHub request failed.";
}

export function revalidateProjectContent(slug?: string) {
  revalidatePath("/");
  if (slug) revalidatePath(`/projects/${slug}`);
}
