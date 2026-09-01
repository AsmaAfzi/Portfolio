import { readdir, readFile } from "fs/promises";
import path from "path";
import type { Project } from "./project";

const projectsDir = path.join(process.cwd(), "content", "projects");

function isProject(value: unknown): value is Project {
  if (!value || typeof value !== "object") return false;
  const project = value as Project;
  return (
    typeof project.slug === "string" &&
    typeof project.title === "string" &&
    typeof project.description === "string" &&
    Array.isArray(project.tech)
  );
}

export async function getProjects(): Promise<Project[]> {
  let files: string[] = [];

  try {
    files = await readdir(projectsDir);
  } catch {
    return [];
  }

  const projects = await Promise.all(
    files
      .filter((file) => file.endsWith(".json"))
      .map(async (file) => {
        const raw = await readFile(path.join(projectsDir, file), "utf8");
        const parsed: unknown = JSON.parse(raw);
        return isProject(parsed) ? parsed : null;
      }),
  );

  return projects
    .filter((project): project is Project => project !== null)
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
}

export async function getProject(slug: string) {
  const projects = await getProjects();
  return projects.find((project) => project.slug === slug) ?? null;
}
