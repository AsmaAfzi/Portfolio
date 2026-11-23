import { NextResponse } from "next/server";
import { jsonError, mapGitHubError, requireSession } from "@/lib/api";
import { commitTheme } from "@/lib/github";
import { getTheme, mergeTheme, saveTheme } from "@/lib/theme";
import { readThemePayload } from "@/lib/request";
import { formatZodError, themeSchema } from "@/lib/schemas";
import { revalidatePath } from "next/cache";

export async function GET() {
  const theme = await getTheme();
  return NextResponse.json({ theme });
}

export async function PUT(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const payload = await readThemePayload(request);
  if (!payload) return jsonError("Theme payload is required.", 400);

  const parsed = themeSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonError(formatZodError(parsed.error), 400);
  }

  const theme = mergeTheme(parsed.data);

  try {
    const result = await commitTheme(theme);
    await saveTheme(theme);
    revalidatePath("/", "layout");
    revalidatePath("/");

    return NextResponse.json({
      ok: true,
      theme,
      updated: result.updated,
      commitUrl: result.commitUrl,
    });
  } catch (error) {
    return jsonError(mapGitHubError(error), 500);
  }
}
