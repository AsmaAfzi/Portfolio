import type { GitHubRepo } from "@/lib/github-repos";

export type CaseStudyKey = "problem" | "built" | "challenge" | "differently" | "impact";

export type CaseStudyBlock = { type: "p"; text: string } | { type: "list"; items: string[] };

export type CaseStudySection = {
  key: CaseStudyKey;
  label: string;
  blocks: CaseStudyBlock[];
};

export const CASE_STUDY_LABELS: Record<CaseStudyKey, string> = {
  problem: "Problem",
  built: "What I built",
  challenge: "Key challenge",
  differently: "What I'd do differently",
  impact: "Impact",
};

const ORDER: CaseStudyKey[] = ["problem", "built", "challenge", "differently", "impact"];

// Heading names people actually use, most specific first. Titles are
// normalised (lowercase, no emoji or punctuation) before matching.
const SYNONYMS: Record<CaseStudyKey, RegExp[]> = {
  problem: [/^(the )?problem( statement)?$/, /^use cases?$/, /^motivation$/, /^background$/, /^(the )?challenge we solve$/],
  built: [/^what i built$/, /^(the )?solution$/, /^how it works$/],
  challenge: [/^key challenges?$/, /^(technical )?challenges?$/, /^obstacles$/, /^hurdles$/],
  differently: [
    /^what i( would|d) do differently$/,
    /^lessons learn(ed|t)$/,
    /^future (enhancements|improvements|work|scope)$/,
    /^improvements$/,
    /^next steps$/,
    /^roadmap$/,
    /^limitations$/,
  ],
  impact: [/^impact$/, /^results?$/, /^outcomes?$/, /^achievements$/, /^(model )?evaluation$/, /^performance$/, /^metrics$/],
};

// Used for "What I built" when a README has no explicit solution section:
// an overview paragraph plus the feature list.
const OVERVIEW = [/^(project )?overview$/, /^what is\b/, /^about( the project)?$/, /^introduction$/];
const FEATURES = [/^(key )?features$/, /^highlights$/];

// Inline "Problem: ..." / "**Impact:** ..." labels, which only count when the
// label is one of these exact names.
const LABEL_NAMES = new Set([
  "problem",
  "the problem",
  "what i built",
  "solution",
  "key challenge",
  "key challenges",
  "challenge",
  "what id do differently",
  "what i would do differently",
  "impact",
  "results",
]);

const MAX_PARAGRAPHS = 2;
const MAX_ITEMS = 6;
const MAX_TEXT = 260;

type Segment = { title: string; level: number; lines: string[] };

function normalizeTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/'/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanInline(text: string) {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/(^|\s)\*(\S.*?)\*(?=\s|$|[.,;:!?])/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\p{Extended_Pictographic}\uFE0F?\s*/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string) {
  if (text.length <= MAX_TEXT) return text;
  const cut = text.slice(0, MAX_TEXT);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.\s-]+$/, "")}…`;
}

function toSegments(markdown: string): Segment[] {
  const segments: Segment[] = [{ title: "", level: 0, lines: [] }];
  let inFence = false;

  for (const raw of markdown.replace(/\r\n?/g, "\n").replace(/<!--[\s\S]*?-->/g, "").split("\n")) {
    if (/^\s*(```|~~~)/.test(raw)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const heading = raw.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
    if (heading) {
      segments.push({ title: cleanInline(heading[2]), level: heading[1].length, lines: [] });
      continue;
    }

    // Matches "Problem: …", "**Problem:** …" and "**Problem**: …".
    const label = raw.match(
      /^\s*(?:\*\*|__)?([A-Za-z][A-Za-z'’ ]{2,40}?)(?:(?:\*\*|__)\s*:|:\s*(?:\*\*|__)?)\s*(.*)$/,
    );
    if (label && LABEL_NAMES.has(normalizeTitle(label[1]))) {
      // Inline labels sit below any heading, so they end at the next label or heading.
      segments.push({ title: label[1], level: 7, lines: label[2] ? [label[2]] : [] });
      continue;
    }

    segments[segments.length - 1].lines.push(raw);
  }
  return segments;
}

const KNOWN_TITLES = [...Object.values(SYNONYMS).flat(), ...OVERVIEW, ...FEATURES];

function isKnownTitle(title: string) {
  const normalized = normalizeTitle(title);
  return KNOWN_TITLES.some((pattern) => pattern.test(normalized));
}

// A heading's body includes its subsections (e.g. "Features" > "### Backend"),
// but not ones that are case-study sections of their own, which happens in
// READMEs that use "#" for every section after the title.
function bodyOf(segments: Segment[], index: number) {
  const { level } = segments[index];
  const lines = [...segments[index].lines];
  for (
    let i = index + 1;
    i < segments.length && segments[i].level > level && level < 7 && !isKnownTitle(segments[i].title);
    i++
  ) {
    lines.push(...segments[i].lines);
  }
  return lines;
}

function toBlocks(lines: string[]): CaseStudyBlock[] {
  const blocks: CaseStudyBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] | null = null;

  const flushParagraph = () => {
    const text = cleanInline(paragraph.join(" "));
    if (text) blocks.push({ type: "p", text: truncate(text) });
    paragraph = [];
  };
  const flushList = () => {
    if (list && list.length > 0) blocks.push({ type: "list", items: list });
    list = null;
  };

  // Lists under an inline label are often indented, so "nested" is relative
  // to the shallowest bullet rather than the left margin.
  const indents = lines
    .map((line) => line.match(/^(\s*)(?:[-*+]|\d+[.)])\s+/)?.[1].length)
    .filter((indent): indent is number => indent !== undefined);
  const baseIndent = indents.length > 0 ? Math.min(...indents) : 0;

  for (const line of lines) {
    const trimmed = line.trim();
    // Tables, badges, images and raw HTML don't read well as prose.
    if (!trimmed || /^(\||\[!\[|!\[|<)/.test(trimmed) || /^[-=*_]{3,}$/.test(trimmed)) {
      flushParagraph();
      if (!trimmed) flushList();
      continue;
    }
    const item = line.match(/^(\s*)(?:[-*+]|\d+[.)])\s+(.*)$/);
    if (item) {
      flushParagraph();
      // Nested bullets are detail; the top level carries the story.
      if (item[1].length >= baseIndent + 2) continue;
      const text = cleanInline(item[2].replace(/^\[[ xX]\]\s*/, ""));
      if (text) (list ??= []).push(truncate(text));
      continue;
    }
    flushList();
    paragraph.push(trimmed);
  }
  flushParagraph();
  flushList();

  const limited: CaseStudyBlock[] = [];
  let paragraphs = 0;
  for (const block of blocks) {
    if (block.type === "p") {
      if (paragraphs++ >= MAX_PARAGRAPHS) continue;
      limited.push(block);
    } else {
      limited.push({ type: "list", items: block.items.slice(0, MAX_ITEMS) });
    }
  }
  return limited;
}

function findSegment(segments: Segment[], patterns: RegExp[], used: Set<number>) {
  for (const pattern of patterns) {
    const index = segments.findIndex(
      (segment, i) => i > 0 && !used.has(i) && pattern.test(normalizeTitle(segment.title)),
    );
    if (index !== -1) return index;
  }
  return -1;
}

/** Pulls a Problem / Built / Challenge / Differently / Impact case study out of a README. */
export function parseCaseStudy(markdown: string): CaseStudySection[] {
  const segments = toSegments(markdown);
  const used = new Set<number>();
  const found = new Map<CaseStudyKey, CaseStudyBlock[]>();

  // Inline labels and exact headings are the author's own wording, so they win.
  for (const key of ORDER) {
    const index = findSegment(segments, SYNONYMS[key], used);
    if (index === -1) continue;
    const blocks = toBlocks(bodyOf(segments, index));
    if (blocks.length === 0) continue;
    used.add(index);
    found.set(key, blocks);
  }

  if (!found.has("built")) {
    const overview = findSegment(segments, OVERVIEW, used);
    const features = findSegment(segments, FEATURES, used);
    const intro =
      overview === -1 ? [] : toBlocks(bodyOf(segments, overview)).filter((b) => b.type === "p").slice(0, 1);
    const list =
      features === -1 ? [] : toBlocks(bodyOf(segments, features)).filter((b) => b.type === "list").slice(0, 1);
    if (intro.length + list.length > 0) found.set("built", [...intro, ...list]);
  }

  return ORDER.filter((key) => found.has(key)).map((key) => ({
    key,
    label: CASE_STUDY_LABELS[key],
    blocks: found.get(key)!,
  }));
}

// raw.githubusercontent.com paths are case-sensitive; these cover nearly every repo.
const README_NAMES = ["README.md", "readme.md", "Readme.md"];

async function fetchReadme(repo: GitHubRepo) {
  for (const name of README_NAMES) {
    const response = await fetch(
      `https://raw.githubusercontent.com/${repo.fullName}/${encodeURIComponent(repo.defaultBranch)}/${name}`,
      { next: { revalidate: 3600 } },
    );
    if (response.ok) return response.text();
  }
  return null;
}

/** Case studies parsed from each repo's README. Repos without usable sections are left out. */
export async function getCaseStudies(repos: GitHubRepo[]): Promise<Record<number, CaseStudySection[]>> {
  const entries = await Promise.all(
    repos.map(async (repo) => {
      try {
        const readme = await fetchReadme(repo);
        const sections = readme ? parseCaseStudy(readme) : [];
        return sections.length > 0 ? ([repo.id, sections] as const) : null;
      } catch {
        return null;
      }
    }),
  );
  return Object.fromEntries(entries.filter((entry) => entry !== null));
}
