import { getTheme, themeToCssVars } from "@/lib/theme";

export async function ThemeStyles() {
  const theme = await getTheme();
  const vars = themeToCssVars(theme);

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `:root { ${Object.entries(vars)
          .map(([key, value]) => `${key}: ${value};`)
          .join(" ")} }`,
      }}
    />
  );
}
