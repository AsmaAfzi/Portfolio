import { getReadmeSummaries } from "@/lib/case-study";
import { getGitHubRepos, type GitHubRepo } from "@/lib/github-repos";
import { getSiteConfig, isRepoVisible } from "@/lib/site";

export type DescribedRepo = GitHubRepo & {
  /** The GitHub description, or one generated from the README when GitHub has none. */
  autoDescription: string | null;
};

/** Portfolio override first, then the GitHub description, then a README summary. */
async function withDescriptions(
  repos: GitHubRepo[],
  overrides: Record<string, string> | undefined,
): Promise<DescribedRepo[]> {
  const summaries = await getReadmeSummaries(repos.filter((repo) => !repo.description?.trim()));
  return repos.map((repo) => {
    const autoDescription = repo.description?.trim() || summaries[repo.id] || null;
    return {
      ...repo,
      description: overrides?.[repo.name]?.trim() || autoDescription,
      autoDescription,
    };
  });
}

export async function getDisplayedRepos() {
  const [repos, site] = await Promise.all([getGitHubRepos(), getSiteConfig()]);
  return withDescriptions(
    repos.filter((repo) => isRepoVisible(repo.id, site)),
    site.repoDescriptions,
  );
}

export async function getAllReposWithVisibility() {
  const [repos, site] = await Promise.all([getGitHubRepos(), getSiteConfig()]);
  const described = await withDescriptions(repos, site.repoDescriptions);
  return described.map((repo) => ({ ...repo, visible: isRepoVisible(repo.id, site) }));
}

/** All public repos with portfolio descriptions applied. */
export async function getReposWithDescriptions() {
  const [repos, site] = await Promise.all([getGitHubRepos(), getSiteConfig()]);
  return withDescriptions(repos, site.repoDescriptions);
}
