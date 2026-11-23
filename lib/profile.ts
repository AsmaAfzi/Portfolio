import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export type InProgressProject = {
  id: string;
  title: string;
  description: string;
  link?: string;
};

export type Certification = {
  id: string;
  title: string;
  issuer: string;
  date?: string;
  description?: string;
  pdfUrl?: string;
  status: "completed" | "in-progress";
  link?: string;
};

export type Experience = {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate?: string | null;
  description: string;
  highlights?: string[];
};

export type ToolCategory = {
  id: string;
  name: string;
  items: string[];
};

export type Profile = {
  intro: string;
  tools: ToolCategory[];
  experience: Experience[];
  certifications: Certification[];
  inProgressProjects: InProgressProject[];
  inProgressRepoIds: number[];
};

export const defaultProfile: Profile = {
  intro:
    "Write a short introduction about yourself — your background, what you do, and what you're passionate about.",
  tools: [],
  experience: [],
  certifications: [],
  inProgressProjects: [],
  inProgressRepoIds: [],
};

function isProfile(value: unknown): value is Profile {
  if (!value || typeof value !== "object") return false;
  const profile = value as Profile;
  return (
    typeof profile.intro === "string" &&
    Array.isArray(profile.experience) &&
    Array.isArray(profile.certifications) &&
    Array.isArray(profile.inProgressProjects)
  );
}

export async function getProfile(): Promise<Profile> {
  try {
    const raw = await readFile(
      path.join(process.cwd(), "content", "profile.json"),
      "utf8",
    );
    const parsed: unknown = JSON.parse(raw);
    if (!isProfile(parsed)) return defaultProfile;

    return {
      intro: parsed.intro,
      tools: Array.isArray(parsed.tools) ? parsed.tools : [],
      experience: parsed.experience,
      certifications: parsed.certifications,
      inProgressProjects: parsed.inProgressProjects,
      inProgressRepoIds: Array.isArray(parsed.inProgressRepoIds) ? parsed.inProgressRepoIds : [],
    };
  } catch {
    return defaultProfile;
  }
}

export async function saveProfile(profile: Profile) {
  const dir = path.join(process.cwd(), "content");
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(dir, "profile.json"),
    `${JSON.stringify(profile, null, 2)}\n`,
    "utf8",
  );
}

export function getInProgressCertifications(profile: Profile) {
  return profile.certifications.filter((cert) => cert.status === "in-progress");
}

export function getCompletedCertifications(profile: Profile) {
  return profile.certifications.filter((cert) => cert.status === "completed");
}
