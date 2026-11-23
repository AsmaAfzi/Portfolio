import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { canWriteLocalContent } from "@/lib/local-content";

export type SiteLinks = {
  github?: string;
  linkedin?: string;
  email?: string;
  resume?: string;
};

export type SiteConfig = {
  home: {
    eyebrow: string;
    title: string;
    description: string;
    role?: string;
    location?: string;
    availability?: string;
    links?: SiteLinks;
  };
  layout: {
    gridColumns: 1 | 2 | 3;
    showStars: boolean;
    showLanguage: boolean;
    showTopics: boolean;
  };
  hiddenRepoIds: number[];
  /** One-line blurbs keyed by GitHub repo name (overrides empty GitHub descriptions). */
  repoDescriptions?: Record<string, string>;
  /** Tech stack chips keyed by GitHub repo name (frameworks/tools GitHub can't detect). */
  repoTech?: Record<string, string[]>;
};

export const defaultSite: SiteConfig = {
  home: {
    eyebrow: "Portfolio",
    title: "Repositories",
    description: "Selected projects from GitHub.",
  },
  layout: {
    gridColumns: 1,
    showStars: true,
    showLanguage: true,
    showTopics: true,
  },
  hiddenRepoIds: [],
  repoDescriptions: {},
  repoTech: {},
};

function isSiteConfig(value: unknown): value is SiteConfig {
  if (!value || typeof value !== "object") return false;
  const site = value as SiteConfig;
  return (
    typeof site.home?.title === "string" &&
    Array.isArray(site.hiddenRepoIds)
  );
}

export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const raw = await readFile(
      path.join(process.cwd(), "content", "site.json"),
      "utf8",
    );
    const parsed: unknown = JSON.parse(raw);
    if (!isSiteConfig(parsed)) return defaultSite;

    return {
      home: { ...defaultSite.home, ...parsed.home },
      layout: { ...defaultSite.layout, ...parsed.layout },
      hiddenRepoIds: parsed.hiddenRepoIds,
      repoDescriptions:
        parsed.repoDescriptions && typeof parsed.repoDescriptions === "object"
          ? parsed.repoDescriptions
          : {},
      repoTech: parsed.repoTech && typeof parsed.repoTech === "object" ? parsed.repoTech : {},
    };
  } catch {
    return defaultSite;
  }
}

export function isRepoVisible(repoId: number, site: SiteConfig) {
  return !site.hiddenRepoIds.includes(repoId);
}

export async function saveSiteConfig(site: SiteConfig) {
  if (!canWriteLocalContent()) return;

  const dir = path.join(process.cwd(), "content");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "site.json"), `${JSON.stringify(site, null, 2)}\n`, "utf8");
}
