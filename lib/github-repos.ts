export type GitHubRepo = {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
  stargazersCount: number;
  fork: boolean;
  updatedAt: string;
  defaultBranch: string;
};

export function getDisplayConfig() {
  const owner = process.env.GITHUB_OWNER?.trim();
  if (!owner) {
    throw new Error("Missing GITHUB_OWNER. Set your GitHub username in .env.local.");
  }

  return {
    owner,
    token: process.env.GITHUB_TOKEN?.trim(),
  };
}

export type RepoLanguage = { name: string; percent: number };

/** Language breakdown per repo, largest first. Missing entries mean the lookup failed. */
export async function getRepoLanguages(
  repos: Pick<GitHubRepo, "id" | "fullName">[],
): Promise<Record<number, RepoLanguage[]>> {
  const { token } = getDisplayConfig();
  const entries = await Promise.all(
    repos.map(async (repo) => {
      try {
        const response = await fetch(`https://api.github.com/repos/${repo.fullName}/languages`, {
          headers: {
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          next: { revalidate: 3600 },
        });
        if (!response.ok) return null;
        const bytes = (await response.json()) as Record<string, number>;
        const total = Object.values(bytes).reduce((sum, value) => sum + value, 0);
        if (total === 0) return [repo.id, []] as const;
        const languages = Object.entries(bytes)
          .map(([name, value]) => ({ name, percent: (value / total) * 100 }))
          .sort((a, b) => b.percent - a.percent);
        return [repo.id, languages] as const;
      } catch {
        return null;
      }
    }),
  );
  return Object.fromEntries(entries.filter((entry) => entry !== null));
}

export async function getGitHubRepos(): Promise<GitHubRepo[]> {
  const { owner, token } = getDisplayConfig();

  const response = await fetch(
    `https://api.github.com/users/${owner}/repos?sort=updated&per_page=100&type=owner`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      next: { revalidate: 3600 },
    },
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`GitHub user "${owner}" was not found.`);
    }
    if (response.status === 403) {
      throw new Error("GitHub API rate limit reached. Add GITHUB_TOKEN to .env.local.");
    }
    throw new Error("Could not load repositories from GitHub.");
  }

  const data = (await response.json()) as Array<{
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    homepage: string | null;
    language: string | null;
    topics?: string[];
    stargazers_count: number;
    fork: boolean;
    updated_at: string;
    default_branch?: string;
  }>;

  return data
    .filter((repo) => !repo.fork)
    .map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      htmlUrl: repo.html_url,
      homepage: repo.homepage || null,
      language: repo.language,
      topics: repo.topics ?? [],
      stargazersCount: repo.stargazers_count,
      fork: repo.fork,
      updatedAt: repo.updated_at,
      defaultBranch: repo.default_branch || "main",
    }));
}
