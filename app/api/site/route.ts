import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { jsonError, mapGitHubError, requireSession } from "@/lib/api";
import { commitSite } from "@/lib/github";
import { defaultSite, getSiteConfig, saveSiteConfig } from "@/lib/site";
import { formatZodError, siteSchema } from "@/lib/schemas";

export async function GET() {
  const site = await getSiteConfig();
  return NextResponse.json({ site });
}

export async function PUT(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const payload: unknown = await request.json();
  const parsed = siteSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonError(formatZodError(parsed.error), 400);
  }

  const site = {
    home: { ...defaultSite.home, ...parsed.data.home },
    layout: { ...defaultSite.layout, ...parsed.data.layout },
    hiddenRepoIds: parsed.data.hiddenRepoIds,
    repoDescriptions: parsed.data.repoDescriptions ?? {},
    repoTech: parsed.data.repoTech ?? {},
  };

  try {
    const result = await commitSite(site);
    await saveSiteConfig(site);
    revalidatePath("/", "layout");
    revalidatePath("/");

    return NextResponse.json({
      ok: true,
      site,
      updated: result.updated,
      commitUrl: result.commitUrl,
    });
  } catch (error) {
    return jsonError(mapGitHubError(error), 500);
  }
}
