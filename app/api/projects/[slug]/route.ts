import { NextResponse } from "next/server";
import {
  jsonError,
  mapGitHubError,
  requireSession,
  revalidateProjectContent,
} from "@/lib/api";
import { commitProject, deleteProject } from "@/lib/github";
import { getProject } from "@/lib/projects";
import type { Project } from "@/lib/project";
import { readProjectPayload } from "@/lib/request";
import { formatZodError, projectInputSchema } from "@/lib/schemas";
import { slugify } from "@/lib/slug";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const project = await getProject(slug);
  if (!project) return jsonError("Project not found.", 404);
  return NextResponse.json({ project });
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { slug } = await context.params;
  const existing = await getProject(slug);
  if (!existing) return jsonError("Project not found.", 404);

  const payload = await readProjectPayload(request);
  const parsed = projectInputSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonError(formatZodError(parsed.error), 400);
  }

  const nextSlug = slugify(parsed.data.title);
  if (!nextSlug) return jsonError("Could not create a slug.", 400);

  const now = new Date().toISOString();
  const project: Project = {
    ...parsed.data,
    slug: nextSlug,
    createdAt: existing.createdAt,
    updatedAt: now,
  };

  try {
    if (nextSlug !== slug) {
      await deleteProject(slug);
    }

    const result = await commitProject(project);
    revalidateProjectContent(slug);
    revalidateProjectContent(project.slug);

    return NextResponse.json({
      ok: true,
      project,
      renamed: nextSlug !== slug,
      updated: result.updated,
      commitUrl: result.commitUrl,
    });
  } catch (error) {
    return jsonError(mapGitHubError(error), 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { slug } = await context.params;

  try {
    const result = await deleteProject(slug);
    revalidateProjectContent(slug);

    return NextResponse.json({
      ok: true,
      slug,
      commitUrl: result.commitUrl,
    });
  } catch (error) {
    const status =
      error && typeof error === "object" && "status" in error && error.status === 404
        ? 404
        : 500;
    return jsonError(mapGitHubError(error), status);
  }
}
