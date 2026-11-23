import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { defaultTheme, mergeTheme, type ThemeConfig } from "@/lib/theme-shared";

export { defaultTheme, mergeTheme, themeToCssVars } from "@/lib/theme-shared";
export type { ThemeConfig } from "@/lib/theme-shared";

function isThemeConfig(value: unknown): value is ThemeConfig {
  if (!value || typeof value !== "object") return false;
  const theme = value as ThemeConfig;
  return (
    typeof theme.colors?.card === "string" &&
    typeof theme.radius?.card === "string" &&
    typeof theme.spacing?.cardPadding === "string"
  );
}

export async function getTheme(): Promise<ThemeConfig> {
  try {
    const raw = await readFile(
      path.join(process.cwd(), "content", "theme.json"),
      "utf8",
    );
    const parsed: unknown = JSON.parse(raw);
    if (!isThemeConfig(parsed)) return defaultTheme;
    return mergeTheme(parsed);
  } catch {
    return defaultTheme;
  }
}

export async function saveTheme(theme: ThemeConfig) {
  const dir = path.join(process.cwd(), "content");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "theme.json"), `${JSON.stringify(theme, null, 2)}\n`, "utf8");
}
