import { FolderGit2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { HorizontalScroller } from "@/components/ui/HorizontalScroller";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { AboutInProgressSection } from "@/components/AboutInProgressSection";
import { CertificationsSection } from "@/components/CertificationsSection";
import { ExperienceSection } from "@/components/ExperienceSection";
import { StickySiteHeader, type HeaderSection } from "@/components/StickySiteHeader";
import { ToolsSection } from "@/components/ToolsSection";
import { ProjectCard } from "@/components/ProjectCard";
import { getDisplayedRepos, getReposWithDescriptions } from "@/lib/display";
import { getRepoLanguages } from "@/lib/github-repos";
import { getDetectedTech, mergeTech } from "@/lib/repo-tech";
import { getCompletedCertifications, getProfile } from "@/lib/profile";
import { getSiteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [site, profile] = await Promise.all([getSiteConfig(), getProfile()]);
  let repos: Awaited<ReturnType<typeof getDisplayedRepos>> = [];
  let allRepos: Awaited<ReturnType<typeof getReposWithDescriptions>> = [];
  let languages: Awaited<ReturnType<typeof getRepoLanguages>> = {};
  let detectedTech: Awaited<ReturnType<typeof getDetectedTech>> = {};
  let error = "";

  try {
    [repos, allRepos] = await Promise.all([getDisplayedRepos(), getReposWithDescriptions()]);
    [languages, detectedTech] = await Promise.all([
      site.layout.showLanguage ? getRepoLanguages(repos) : {},
      getDetectedTech(repos),
    ]);
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not load repositories.";
  }

  const projectsTitle = <SectionTitle icon={FolderGit2}>Projects</SectionTitle>;
  const completedCertifications = getCompletedCertifications(profile);

  const showAbout =
    profile.intro.trim().length > 0 ||
    profile.inProgressProjects.length > 0 ||
    profile.certifications.some((cert) => cert.status === "in-progress") ||
    profile.inProgressRepoIds.length > 0;
  const sections: HeaderSection[] = [
    { id: "about", label: "About", show: showAbout },
    { id: "tools", label: "Tools", show: profile.tools.some((category) => category.items.length > 0) },
    { id: "experience", label: "Experience", show: profile.experience.length > 0 },
    { id: "certifications", label: "Certifications", show: completedCertifications.length > 0 },
    { id: "projects", label: "Projects", show: true },
  ]
    .filter((section) => section.show)
    .map(({ id, label }) => ({ id, label }));

  const githubOwner = process.env.GITHUB_OWNER?.trim();
  const links = {
    ...site.home.links,
    github: site.home.links?.github || (githubOwner ? `https://github.com/${githubOwner}` : undefined),
  };

  return (
    <>
    <div className="scroll-progress" aria-hidden="true" />
    <main className="site site-home">
      <StickySiteHeader
        eyebrow={site.home.eyebrow}
        title={site.home.title}
        description={site.home.description}
        role={site.home.role}
        location={site.home.location}
        availability={site.home.availability}
        links={links}
        sections={sections}
      />

      {showAbout ? (
        <div id="about" className="section-anchor">
          <AboutInProgressSection intro={profile.intro} profile={profile} repos={allRepos} site={site} />
        </div>
      ) : null}
      <ToolsSection tools={profile.tools} />
      <ExperienceSection experience={profile.experience} />
      <CertificationsSection
        certifications={completedCertifications}
        gridColumns={site.layout.gridColumns}
      />

      <section className="profile-section" id="projects">
        {error ? (
          <>
            {projectsTitle}
            <Card className="empty">
              <p>{error}</p>
              <p>
                Set <code>GITHUB_OWNER</code> in <code>.env.local</code> to your GitHub username.
              </p>
            </Card>
          </>
        ) : repos.length === 0 ? (
          <>
            {projectsTitle}
            <Card className="empty">
              <p>No repositories to display. Unhide repos in the admin, or check GITHUB_OWNER.</p>
            </Card>
          </>
        ) : (
          <HorizontalScroller
            heading={projectsTitle}
            label="projects"
            perView={site.layout.gridColumns}
          >
            {repos.map((repo) => (
              <li key={repo.id}>
                <ProjectCard
                  repo={repo}
                  languages={languages[repo.id]}
                  tech={mergeTech(site.repoTech?.[repo.name] ?? [], detectedTech[repo.id] ?? [])}
                  showLanguage={site.layout.showLanguage}
                  showTopics={site.layout.showTopics}
                  showStars={site.layout.showStars}
                />
              </li>
            ))}
          </HorizontalScroller>
        )}
      </section>
    </main>
    </>
  );
}
