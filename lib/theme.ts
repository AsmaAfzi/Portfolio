import { readFile } from "fs/promises";
import path from "path";

export type ThemeConfig = {
  colors: {
    background: string;
    foreground: string;
    muted: string;
    card: string;
    cardBorder: string;
    accent: string;
    accentForeground: string;
  };
  radius: {
    card: string;
    button: string;
    image: string;
    pill: string;
  };
  spacing: {
    cardPadding: string;
    sectionGap: string;
    pageWidth: string;
  };
  typography: {
    eyebrowSize: string;
    titleSize: string;
  };
};

export const defaultTheme: ThemeConfig = {
  colors: {
    background: "#f4f4f1",
    foreground: "#171717",
    muted: "#5c5c5c",
    card: "#fafaf7",
    cardBorder: "#e8e8e3",
    accent: "#171717",
    accentForeground: "#fafaf7",
  },
  radius: {
    card: "1rem",
    button: "0.75rem",
    image: "0.75rem",
    pill: "9999px",
  },
  spacing: {
    cardPadding: "1.5rem",
    sectionGap: "1.5rem",
    pageWidth: "72rem",
  },
  typography: {
    eyebrowSize: "0.75rem",
    titleSize: "2rem",
  },
};

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

    return {
      colors: { ...defaultTheme.colors, ...parsed.colors },
      radius: { ...defaultTheme.radius, ...parsed.radius },
      spacing: { ...defaultTheme.spacing, ...parsed.spacing },
      typography: { ...defaultTheme.typography, ...parsed.typography },
    };
  } catch {
    return defaultTheme;
  }
}

export function themeToCssVars(theme: ThemeConfig): Record<string, string> {
  return {
    "--background": theme.colors.background,
    "--foreground": theme.colors.foreground,
    "--muted": theme.colors.muted,
    "--card-bg": theme.colors.card,
    "--card-border": theme.colors.cardBorder,
    "--accent": theme.colors.accent,
    "--accent-foreground": theme.colors.accentForeground,
    "--card-radius": theme.radius.card,
    "--button-radius": theme.radius.button,
    "--image-radius": theme.radius.image,
    "--pill-radius": theme.radius.pill,
    "--card-padding": theme.spacing.cardPadding,
    "--section-gap": theme.spacing.sectionGap,
    "--page-width": theme.spacing.pageWidth,
    "--eyebrow-size": theme.typography.eyebrowSize,
    "--title-size": theme.typography.titleSize,
  };
}
