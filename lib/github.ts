import { Octokit } from "octokit";
import { getEnv } from "@/lib/env";
import type { Project } from "@/lib/project";
import type { ThemeConfig } from "@/lib/theme";

type CommitResult = {
  updated: boolean;
  commitUrl: string | null;
  sha: string | null;
};

function getOctokit() {
  const env = getEnv();
  return new Octokit({ auth: env.githubToken });
}

function repoInfo() {
  const env = getEnv();
  return {
    owner: env.githubOwner,
    repo: env.githubRepo,
    branch: env.githubBranch,
    prefix: env.githubContentPrefix.replace(/\/$/, ""),
  };
}

function contentPath(relative: string) {
  const { prefix } = repoInfo();
  return prefix ? `${prefix}/${relative}` : relative;
}

export function projectPath(slug: string) {
  return contentPath(`content/projects/${slug}.json`);
}

export function themePath() {
  return contentPath("content/theme.json");
}

async function getFileSha(path: string) {
  const octokit = getOctokit();
  const { owner, repo, branch } = repoInfo();

  try {
    const existing = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });

    if (!Array.isArray(existing.data) && "sha" in existing.data) {
      return existing.data.sha;
    }
  } catch (error) {
    if (
      !(error && typeof error === "object" && "status" in error && error.status === 404)
    ) {
      throw error;
    }
  }

  return null;
}

async function commitFile(path: string, body: unknown, message: string): Promise<CommitResult> {
  const octokit = getOctokit();
  const { owner, repo, branch } = repoInfo();
  const sha = await getFileSha(path);
  const content = Buffer.from(`${JSON.stringify(body, null, 2)}\n`).toString("base64");

  const response = await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content,
    branch,
    sha: sha ?? undefined,
  });

  return {
    updated: Boolean(sha),
    commitUrl: response.data.commit.html_url ?? null,
    sha: response.data.content?.sha ?? null,
  };
}

export async function projectExistsOnGitHub(slug: string) {
  return (await getFileSha(projectPath(slug))) !== null;
}

export async function commitProject(project: Project) {
  return commitFile(
    projectPath(project.slug),
    project,
    `cms: save project ${project.title}`,
  );
}

export async function deleteProject(slug: string) {
  const octokit = getOctokit();
  const { owner, repo, branch } = repoInfo();
  const path = projectPath(slug);
  const sha = await getFileSha(path);

  if (!sha) {
    throw Object.assign(new Error("Project not found on GitHub."), { status: 404 });
  }

  const response = await octokit.rest.repos.deleteFile({
    owner,
    repo,
    path,
    message: `cms: delete project ${slug}`,
    sha,
    branch,
  });

  return {
    commitUrl: response.data.commit.html_url ?? null,
  };
}

export async function commitTheme(theme: ThemeConfig) {
  return commitFile(themePath(), theme, "cms: update theme");
}
