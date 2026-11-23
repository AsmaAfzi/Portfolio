import { Hourglass } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import type { GitHubRepo } from "@/lib/github-repos";
import type { Profile } from "@/lib/profile";
import { getInProgressCertifications } from "@/lib/profile";
import type { SiteConfig } from "@/lib/site";

type InProgressSectionProps = {
  profile: Profile;
  repos: GitHubRepo[];
  site: SiteConfig;
};

export function InProgressSection({ profile, repos, site }: InProgressSectionProps) {
  const inProgressCerts = getInProgressCertifications(profile);
  const projects = profile.inProgressProjects;
  const inProgressRepos = repos.filter((repo) => profile.inProgressRepoIds.includes(repo.id));

  if (inProgressCerts.length === 0 && projects.length === 0 && inProgressRepos.length === 0) {
    return null;
  }

  return (
    <Card as="article" className="about-in-progress-panel">
      <SectionTitle icon={Hourglass}>In Progress</SectionTitle>
      <ul className="in-progress-list">
        {inProgressRepos.map((repo) => (
          <li key={repo.id} className="in-progress-item">
            <span className="badge">Repository</span>
            <h3>
              <a href={repo.htmlUrl} target="_blank" rel="noreferrer">
                {repo.name}
              </a>
            </h3>
            <p>{repo.description ?? "No description."}</p>
            {site.layout.showLanguage || site.layout.showTopics ? (
              <ul className="tech-list">
                {site.layout.showLanguage && repo.language ? <li>{repo.language}</li> : null}
                {site.layout.showTopics
                  ? repo.topics.map((topic) => <li key={topic}>{topic}</li>)
                  : null}
              </ul>
            ) : null}
            <p className="project-links">
              <a href={repo.htmlUrl} target="_blank" rel="noreferrer">
                View on GitHub
              </a>
              {repo.homepage ? (
                <a href={repo.homepage} target="_blank" rel="noreferrer">
                  Live demo
                </a>
              ) : null}
            </p>
          </li>
        ))}
        {projects.map((project) => (
          <li key={project.id} className="in-progress-item">
            <span className="badge">Project</span>
            <h3>{project.title}</h3>
            <p>{project.description}</p>
            {project.link ? (
              <p className="project-links">
                <a href={project.link} target="_blank" rel="noreferrer">
                  View progress
                </a>
              </p>
            ) : null}
          </li>
        ))}
        {inProgressCerts.map((cert) => (
          <li key={cert.id} className="in-progress-item">
            <span className="badge">Certification</span>
            <h3>{cert.title}</h3>
            <p className="cert-meta">{cert.issuer}</p>
            {cert.description ? <p>{cert.description}</p> : null}
            {cert.link ? (
              <p className="project-links">
                <a href={cert.link} target="_blank" rel="noreferrer">
                  Learn more
                </a>
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}
