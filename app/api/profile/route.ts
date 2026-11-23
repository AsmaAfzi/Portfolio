import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { jsonError, mapGitHubError, requireSession } from "@/lib/api";
import { commitProfile } from "@/lib/github";
import { defaultProfile, getProfile, saveProfile } from "@/lib/profile";
import { formatZodError, profileSchema } from "@/lib/schemas";

export async function GET() {
  const profile = await getProfile();
  return NextResponse.json({ profile });
}

export async function PUT(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const payload: unknown = await request.json();
  const parsed = profileSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonError(formatZodError(parsed.error), 400);
  }

  const profile = {
    intro: parsed.data.intro,
    tools: parsed.data.tools,
    experience: parsed.data.experience,
    certifications: parsed.data.certifications,
    inProgressProjects: parsed.data.inProgressProjects,
    inProgressRepoIds: parsed.data.inProgressRepoIds,
  };

  try {
    const result = await commitProfile(profile);
    await saveProfile(profile);
    revalidatePath("/", "layout");
    revalidatePath("/");

    return NextResponse.json({
      ok: true,
      profile,
      updated: result.updated,
      commitUrl: result.commitUrl,
    });
  } catch (error) {
    return jsonError(mapGitHubError(error), 500);
  }
}
