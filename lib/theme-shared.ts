export type ThemeConfig = {
  colors: {
    background: string;
    backgroundAlt: string;
    backgroundText: string;
    foreground: string;
    muted: string;
    card: string;
    cardBorder: string;
    accent: string;
    accentForeground: string;
    secondary: string;
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
  effects: {
    lavaBlur: string;
    lavaIntensity: string;
    lavaSpeed: string;
  };
};

export const defaultTheme: ThemeConfig = {
  colors: {
    background: "#01332b",
    backgroundAlt: "#251b28",
    backgroundText: "#eef1f0",
    foreground: "#251b28",
    muted: "#5f5a67",
    card: "#ffffff",
    cardBorder: "#e4e4f0",
    accent: "#8abfb2",
    accentForeground: "#01332b",
    secondary: "#c4c4db",
  },
  radius: {
    card: "1.15rem",
    button: "0.75rem",
    image: "0.85rem",
    pill: "9999px",
  },
  spacing: {
    cardPadding: "1.6rem",
    sectionGap: "1.6rem",
    pageWidth: "72rem",
  },
  typography: {
    eyebrowSize: "0.75rem",
    titleSize: "2.1rem",
  },
  effects: {
    lavaBlur: "20",
    lavaIntensity: "60",
    lavaSpeed: "1",
  },
};

type PartialTheme = { [K in keyof ThemeConfig]?: Partial<ThemeConfig[K]> };

export function mergeTheme(partial: PartialTheme): ThemeConfig {
  return {
    colors: { ...defaultTheme.colors, ...partial.colors },
    radius: { ...defaultTheme.radius, ...partial.radius },
    spacing: { ...defaultTheme.spacing, ...partial.spacing },
    typography: { ...defaultTheme.typography, ...partial.typography },
    effects: { ...defaultTheme.effects, ...partial.effects },
  };
}

export function themeToCssVars(theme: ThemeConfig): Record<string, string> {
  return {
    "--background": theme.colors.background,
    "--background-alt": theme.colors.backgroundAlt,
    "--background-text": theme.colors.backgroundText,
    "--foreground": theme.colors.foreground,
    "--muted": theme.colors.muted,
    "--card-bg": theme.colors.card,
    "--card-border": theme.colors.cardBorder,
    "--accent": theme.colors.accent,
    "--accent-foreground": theme.colors.accentForeground,
    "--secondary": theme.colors.secondary,
    "--card-radius": theme.radius.card,
    "--button-radius": theme.radius.button,
    "--image-radius": theme.radius.image,
    "--pill-radius": theme.radius.pill,
    "--card-padding": theme.spacing.cardPadding,
    "--section-gap": theme.spacing.sectionGap,
    "--page-width": theme.spacing.pageWidth,
    "--eyebrow-size": theme.typography.eyebrowSize,
    "--title-size": theme.typography.titleSize,
    "--lava-blur": theme.effects.lavaBlur,
    "--lava-intensity": theme.effects.lavaIntensity,
    "--lava-speed": theme.effects.lavaSpeed,
  };
}
