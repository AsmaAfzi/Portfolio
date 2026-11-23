import { NextResponse } from "next/server";
import { getGitHubRepos } from "@/lib/github-repos";

export async function GET() {
  try {
    const repos = await getGitHubRepos();
    return NextResponse.json({ repos });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load repos.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
