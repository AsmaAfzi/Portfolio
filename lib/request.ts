import { parseTechInput } from "@/lib/schemas";

export async function readJsonBody<T>(request: Request): Promise<T | null> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return null;
  return (await request.json()) as T;
}

export async function readProjectPayload(request: Request) {
  const json = await readJsonBody<Record<string, unknown>>(request);
  if (json) {
    const links =
      json.links && typeof json.links === "object"
        ? (json.links as { live?: string; github?: string })
        : {};

    return {
      title: String(json.title ?? ""),
      description: String(json.description ?? ""),
      tech: parseTechInput(json.tech),
      links: {
        live: typeof json.liveUrl === "string" ? json.liveUrl : links.live,
        github: typeof json.githubUrl === "string" ? json.githubUrl : links.github,
      },
      image:
        typeof json.imageUrl === "string"
          ? json.imageUrl
          : typeof json.image === "string"
            ? json.image
            : undefined,
      featured: Boolean(json.featured),
    };
  }

  const form = await request.formData();
  return {
    title: String(form.get("title") ?? ""),
    description: String(form.get("description") ?? ""),
    tech: parseTechInput(form.get("tech")),
    links: {
      live: String(form.get("liveUrl") ?? "").trim() || undefined,
      github: String(form.get("githubUrl") ?? "").trim() || undefined,
    },
    image: String(form.get("imageUrl") ?? "").trim() || undefined,
    featured: form.get("featured") === "on" || form.get("featured") === "true",
  };
}

export async function readThemePayload(request: Request) {
  const json = await readJsonBody<unknown>(request);
  if (json) return json;

  const form = await request.formData();
  const themeRaw = form.get("theme");
  if (typeof themeRaw === "string" && themeRaw.trim()) {
    return JSON.parse(themeRaw) as unknown;
  }

  return null;
}
