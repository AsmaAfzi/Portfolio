import { getGitHubRepos } from "@/lib/github-repos";
import { getSiteConfig, isRepoVisible } from "@/lib/site";

function withSiteDescription<T extends { name: string; description: string | null }>(
  repo: T,
  descriptions: Record<string, string> | undefined,
): T {
  const override = descriptions?.[repo.name]?.trim();
  if (!override) return repo;
  return { ...repo, description: override };
}

export async function getDisplayedRepos() {
  const [repos, site] = await Promise.all([getGitHubRepos(), getSiteConfig()]);
  return repos
    .filter((repo) => isRepoVisible(repo.id, site))
    .map((repo) => withSiteDescription(repo, site.repoDescriptions));
}

export async function getAllReposWithVisibility() {
  const [repos, site] = await Promise.all([getGitHubRepos(), getSiteConfig()]);
  return repos.map((repo) => ({
    ...withSiteDescription(repo, site.repoDescriptions),
    visible: isRepoVisible(repo.id, site),
  }));
}

/** All public repos with portfolio one-line description overrides applied. */
export async function getReposWithDescriptions() {
  const [repos, site] = await Promise.all([getGitHubRepos(), getSiteConfig()]);
  return repos.map((repo) => withSiteDescription(repo, site.repoDescriptions));
}
