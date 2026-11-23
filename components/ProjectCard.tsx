import { ArrowUpRight, BookOpen, Code2, Globe, Star, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { CaseStudySection } from "@/lib/case-study";
import type { GitHubRepo, RepoLanguage } from "@/lib/github-repos";
import { languageColor } from "@/lib/language-colors";
import { mergeTech } from "@/lib/repo-tech";

type ProjectCardProps = {
  repo: GitHubRepo;
  languages?: RepoLanguage[];
  tech: string[];
  showLanguage: boolean;
  showTopics: boolean;
  showStars: boolean;
  caseStudy?: CaseStudySection[];
};

// Languages under this share are folded into "Other" so the legend stays short.
const MIN_LANGUAGE_PERCENT = 3;
const MAX_LANGUAGES = 4;
// Keeps one busy repo from stretching every card in the row.
const MAX_CHIPS = 8;

function summarizeLanguages(languages: RepoLanguage[]) {
  const main = languages.filter((lang) => lang.percent >= MIN_LANGUAGE_PERCENT).slice(0, MAX_LANGUAGES);
  const rest = 100 - main.reduce((sum, lang) => sum + lang.percent, 0);
  return rest >= 0.5 ? [...main, { name: "Other", percent: rest }] : main;
}

export function ProjectCard({
  repo,
  languages,
  tech,
  showLanguage,
  showTopics,
  showStars,
  caseStudy = [],
}: ProjectCardProps) {
  const title = repo.name.replace(/[-_]+/g, " ");
  const detailsId = `case-study-${repo.id}`;
  const hasDetails = caseStudy.length > 0;
  const languageList = showLanguage
    ? summarizeLanguages(
        languages && languages.length > 0
          ? languages
          : repo.language
            ? [{ name: repo.language, percent: 100 }]
            : [],
      )
    : [];
  const allChips = mergeTech(tech, showTopics ? repo.topics : []);
  const chips = allChips.slice(0, MAX_CHIPS);
  const hiddenChips = allChips.slice(MAX_CHIPS);

  const card = (
    <Card as="article" className="project-card">
      <div className="project-card-text">
        <h3>
          <a href={repo.htmlUrl} target="_blank" rel="noreferrer">
            {title}
          </a>
        </h3>
        <p>{repo.description ?? "No description."}</p>
      </div>

      {chips.length > 0 ? (
        <div className="project-stack">
          <p className="project-label">Built with</p>
          <ul className="tech-list">
            {chips.map((item) => (
              <li key={item}>{item}</li>
            ))}
            {hiddenChips.length > 0 ? (
              <li className="tech-more" title={hiddenChips.join(", ")}>
                +{hiddenChips.length} more
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {languageList.length > 0 ? (
        <div className="project-languages">
          <p className="project-label">Languages</p>
          <div className="language-bar" aria-hidden="true">
            {languageList.map((lang) => (
              <span
                key={lang.name}
                style={{ width: `${lang.percent}%`, background: languageColor(lang.name) }}
              />
            ))}
          </div>
          <ul className="language-legend" aria-label="Languages">
            {languageList.map((lang) => (
              <li key={lang.name}>
                <span
                  className="language-dot"
                  style={{ background: languageColor(lang.name) }}
                  aria-hidden="true"
                />
                {lang.name}
                <span className="language-percent">{Math.round(lang.percent)}%</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="project-card-footer">
        <a href={repo.htmlUrl} target="_blank" rel="noreferrer" className="project-action">
          <Code2 size={15} aria-hidden="true" />
          Code
          <ArrowUpRight size={14} aria-hidden="true" />
        </a>
        {repo.homepage ? (
          <a href={repo.homepage} target="_blank" rel="noreferrer" className="project-action">
            <Globe size={15} aria-hidden="true" />
            Live demo
            <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        ) : null}
        {showStars && repo.stargazersCount > 0 ? (
          <span className="project-stars">
            <Star size={14} aria-hidden="true" />
            {repo.stargazersCount}
          </span>
        ) : null}
        {hasDetails ? (
          <button
            type="button"
            className="project-action project-details-toggle"
            data-details-toggle=""
            aria-expanded="false"
            aria-controls={detailsId}
          >
            <BookOpen size={15} aria-hidden="true" />
            Case study
          </button>
        ) : null}
      </div>
    </Card>
  );

  if (!hasDetails) return card;

  // HorizontalScroller opens the panel on hover or via the toggle, on
  // whichever side of the card has room in the visible row. The window clips
  // the panel so it can slide out from behind the card's edge.
  return (
    <div className="project-slot" data-expandable="">
      {card}
      <div className="project-details-window">
        <aside className="project-details" id={detailsId} aria-label={`${title} case study`}>
          <div className="project-details-head">
            <p className="project-label">Case study</p>
            <button
              type="button"
              className="project-details-close"
              data-details-close=""
              aria-label="Close case study"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          <div className="project-details-body">
            {caseStudy.map((section) => (
              <section key={section.key} className="project-details-section">
                <h4>{section.label}</h4>
                {section.blocks.map((block, index) =>
                  block.type === "p" ? (
                    <p key={index}>{block.text}</p>
                  ) : (
                    <ul key={index}>
                      {block.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ),
                )}
              </section>
            ))}
          </div>
          <a
            href={`${repo.htmlUrl}#readme`}
            target="_blank"
            rel="noreferrer"
            className="project-details-more"
          >
            Full README
            <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </aside>
      </div>
    </div>
  );
}
