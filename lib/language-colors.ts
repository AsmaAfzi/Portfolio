// GitHub's linguist colours for the languages most likely to show up.
const LANGUAGE_COLORS: Record<string, string> = {
  Python: "#3572A5",
  "Jupyter Notebook": "#DA5B0B",
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  HTML: "#e34c26",
  CSS: "#663399",
  SCSS: "#c6538c",
  Shell: "#89e051",
  PowerShell: "#012456",
  Dockerfile: "#384d54",
  HCL: "#844FBA",
  Java: "#b07219",
  Kotlin: "#A97BFF",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Go: "#00ADD8",
  Rust: "#dea584",
  PHP: "#4F5D95",
  Ruby: "#701516",
  Dart: "#00B4AB",
  Swift: "#F05138",
  Solidity: "#AA6746",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  R: "#198CE7",
  SQL: "#e38c00",
  PLpgSQL: "#336790",
  Makefile: "#427819",
  Procfile: "#3B2F63",
};

export function languageColor(name: string) {
  return LANGUAGE_COLORS[name] ?? "#9a94a8";
}
