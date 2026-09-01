import { NextResponse } from "next/server";
import {
  jsonError,
  mapGitHubError,
  requireSession,
  revalidateProjectContent,
} from "@/lib/api";
import { commitProject, projectExistsOnGitHub } from "@/lib/github";
import type { Project } from "@/lib/project";
import { readProjectPayload } from "@/lib/request";
import { formatZodError, projectInputSchema } from "@/lib/schemas";
import { getProjects } from "@/lib/projects";
import { slugify } from "@/lib/slug";

export async function GET() {
  const projects = await getProjects();
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const payload = await readProjectPayload(request);
  const parsed = projectInputSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonError(formatZodError(parsed.error), 400);
  }

  const slug = slugify(parsed.data.title);
  if (!slug) return jsonError("Could not create a slug.", 400);

  try {
    if (await projectExistsOnGitHub(slug)) {
      return jsonError("A project with this title already exists.", 409);
    }

    const now = new Date().toISOString();
    const project: Project = {
      ...parsed.data,
      slug,
      createdAt: now,
      updatedAt: now,
    };

    const result = await commitProject(project);
    revalidateProjectContent(project.slug);

    return NextResponse.json({
      ok: true,
      project,
      updated: result.updated,
      commitUrl: result.commitUrl,
    });
  } catch (error) {
    return jsonError(mapGitHubError(error), 500);
  }
}
