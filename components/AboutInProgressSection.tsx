import { InProgressSection } from "@/components/InProgressSection";
import { IntroSection } from "@/components/IntroSection";
import type { Profile } from "@/lib/profile";
import type { GitHubRepo } from "@/lib/github-repos";
import type { SiteConfig } from "@/lib/site";

type AboutInProgressSectionProps = {
  intro: string;
  profile: Profile;
  repos: GitHubRepo[];
  site: SiteConfig;
};

export function AboutInProgressSection({
  intro,
  profile,
  repos,
  site,
}: AboutInProgressSectionProps) {
  const hasIntro = intro.trim().length > 0;
  const hasInProgress =
    profile.inProgressProjects.length > 0 ||
    profile.certifications.some((cert) => cert.status === "in-progress") ||
    profile.inProgressRepoIds.length > 0;

  if (!hasIntro && !hasInProgress) return null;

  if (hasIntro && hasInProgress) {
    return (
      <section className="about-in-progress-row">
        <IntroSection intro={intro} />
        <InProgressSection profile={profile} repos={repos} site={site} />
      </section>
    );
  }

  if (hasIntro) return <IntroSection intro={intro} />;
  return <InProgressSection profile={profile} repos={repos} site={site} />;
}
