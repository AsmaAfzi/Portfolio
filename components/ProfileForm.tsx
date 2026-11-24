"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PdfUpload } from "@/components/PdfUpload";
import type { GitHubRepo } from "@/lib/github-repos";
import type { Certification, Experience, InProgressProject, Profile, ToolCategory } from "@/lib/profile";

type ProfileFormProps = {
  initialProfile: Profile;
  repos: GitHubRepo[];
};

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`;
}

export function ProfileForm({ initialProfile, repos }: ProfileFormProps) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setSuccess("");

    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...profile,
        tools: profile.tools.filter(
          (category) => category.name.trim() && category.items.length > 0,
        ),
      }),
    });
    const data = (await response.json()) as { error?: string };

    setPending(false);

    if (!response.ok) {
      setError(data.error ?? "Could not save profile.");
      return;
    }

    setSuccess("Profile saved. Your live site updates once Vercel finishes redeploying (about a minute).");
    router.refresh();
  }

  function updateExperience(index: number, entry: Experience) {
    setProfile((current) => ({
      ...current,
      experience: current.experience.map((item, i) => (i === index ? entry : item)),
    }));
  }

  function updateCertification(index: number, entry: Certification) {
    setProfile((current) => ({
      ...current,
      certifications: current.certifications.map((item, i) => (i === index ? entry : item)),
    }));
  }

  function updateInProgress(index: number, entry: InProgressProject) {
    setProfile((current) => ({
      ...current,
      inProgressProjects: current.inProgressProjects.map((item, i) =>
        i === index ? entry : item,
      ),
    }));
  }

  function updateToolCategory(index: number, entry: ToolCategory) {
    setProfile((current) => ({
      ...current,
      tools: current.tools.map((item, i) => (i === index ? entry : item)),
    }));
  }

  function toggleInProgressRepo(repoId: number, checked: boolean) {
    setProfile((current) => ({
      ...current,
      inProgressRepoIds: checked
        ? [...current.inProgressRepoIds, repoId]
        : current.inProgressRepoIds.filter((id) => id !== repoId),
    }));
  }

  return (
    <form className="cms-form" onSubmit={onSubmit}>
      <fieldset className="theme-group">
        <legend>Introduction</legend>
        <label className="cms-field">
          <span>About me</span>
          <textarea
            rows={6}
            value={profile.intro}
            onChange={(event) =>
              setProfile((current) => ({ ...current, intro: event.target.value }))
            }
            placeholder="Write a few paragraphs about yourself. Separate paragraphs with a blank line."
          />
        </label>
      </fieldset>

      <fieldset className="theme-group">
        <legend>In progress</legend>
        <p className="repo-curator-note">
          Shown beside About Me on your site. Pick GitHub repos, or add custom projects below.
        </p>
        {repos.length > 0 ? (
          <ul className="admin-list">
            {repos.map((repo) => {
              const checked = profile.inProgressRepoIds.includes(repo.id);
              return (
                <li key={repo.id}>
                  <div className="admin-list-item repo-curator-row">
                    <div>
                      <h2>{repo.name}</h2>
                      <p>{repo.description ?? "No description"}</p>
                    </div>
                    <label className="cms-check">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => toggleInProgressRepo(repo.id, event.target.checked)}
                      />
                      <span>{checked ? "In progress" : "Not in progress"}</span>
                    </label>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="repo-curator-note">
            Set <code>GITHUB_OWNER</code> in <code>.env.local</code> to pick repositories.
          </p>
        )}
      </fieldset>

      <fieldset className="theme-group">
        <legend>In-progress projects</legend>
        <p className="repo-curator-note">Add custom projects you are currently building.</p>
        {profile.inProgressProjects.map((project, index) => (
          <div key={project.id} className="profile-editor-block">
            <label className="cms-field">
              <span>Title</span>
              <input
                value={project.title}
                onChange={(event) =>
                  updateInProgress(index, { ...project, title: event.target.value })
                }
              />
            </label>
            <label className="cms-field">
              <span>Description</span>
              <textarea
                rows={2}
                value={project.description}
                onChange={(event) =>
                  updateInProgress(index, { ...project, description: event.target.value })
                }
              />
            </label>
            <label className="cms-field">
              <span>Link (optional)</span>
              <input
                type="url"
                value={project.link ?? ""}
                onChange={(event) =>
                  updateInProgress(index, { ...project, link: event.target.value || undefined })
                }
              />
            </label>
            <button
              className="cms-button cms-button-ghost"
              type="button"
              onClick={() =>
                setProfile((current) => ({
                  ...current,
                  inProgressProjects: current.inProgressProjects.filter((_, i) => i !== index),
                }))
              }
            >
              Remove project
            </button>
          </div>
        ))}
        <button
          className="cms-button cms-button-ghost"
          type="button"
          onClick={() =>
            setProfile((current) => ({
              ...current,
              inProgressProjects: [
                ...current.inProgressProjects,
                {
                  id: createId("project"),
                  title: "",
                  description: "",
                },
              ],
            }))
          }
        >
          Add in-progress project
        </button>
      </fieldset>

      <fieldset className="theme-group">
        <legend>Tools & technologies</legend>
        <p className="repo-curator-note">
          Group your skills by category. Add one tool per line within each group.
        </p>
        {profile.tools.map((category, index) => (
          <div key={category.id} className="profile-editor-block">
            <label className="cms-field">
              <span>Category</span>
              <input
                value={category.name}
                onChange={(event) =>
                  updateToolCategory(index, { ...category, name: event.target.value })
                }
                placeholder="Languages"
              />
            </label>
            <label className="cms-field">
              <span>Tools (one per line)</span>
              <textarea
                rows={4}
                value={category.items.join("\n")}
                onChange={(event) =>
                  updateToolCategory(index, {
                    ...category,
                    items: event.target.value
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean),
                  })
                }
                placeholder={"TypeScript\nPython\nJavaScript"}
              />
            </label>
            <button
              className="cms-button cms-button-ghost"
              type="button"
              onClick={() =>
                setProfile((current) => ({
                  ...current,
                  tools: current.tools.filter((_, i) => i !== index),
                }))
              }
            >
              Remove category
            </button>
          </div>
        ))}
        <button
          className="cms-button cms-button-ghost"
          type="button"
          onClick={() =>
            setProfile((current) => ({
              ...current,
              tools: [
                ...current.tools,
                {
                  id: createId("tools"),
                  name: "",
                  items: [],
                },
              ],
            }))
          }
        >
          Add category
        </button>
      </fieldset>

      <fieldset className="theme-group">
        <legend>Work experience</legend>
        {profile.experience.map((entry, index) => (
          <div key={entry.id} className="profile-editor-block">
            <label className="cms-field">
              <span>Role</span>
              <input
                value={entry.role}
                onChange={(event) =>
                  updateExperience(index, { ...entry, role: event.target.value })
                }
              />
            </label>
            <label className="cms-field">
              <span>Company</span>
              <input
                value={entry.company}
                onChange={(event) =>
                  updateExperience(index, { ...entry, company: event.target.value })
                }
              />
            </label>
            <div className="profile-editor-row">
              <label className="cms-field">
                <span>Start date</span>
                <input
                  value={entry.startDate}
                  onChange={(event) =>
                    updateExperience(index, { ...entry, startDate: event.target.value })
                  }
                  placeholder="Jan 2024"
                />
              </label>
              <label className="cms-field">
                <span>End date</span>
                <input
                  value={entry.endDate ?? ""}
                  onChange={(event) =>
                    updateExperience(index, {
                      ...entry,
                      endDate: event.target.value || null,
                    })
                  }
                  placeholder="Present"
                />
              </label>
            </div>
            <label className="cms-field">
              <span>Description</span>
              <textarea
                rows={3}
                value={entry.description}
                onChange={(event) =>
                  updateExperience(index, { ...entry, description: event.target.value })
                }
              />
            </label>
            <label className="cms-field">
              <span>Highlights (one per line)</span>
              <textarea
                rows={3}
                value={(entry.highlights ?? []).join("\n")}
                onChange={(event) =>
                  updateExperience(index, {
                    ...entry,
                    highlights: event.target.value
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean),
                  })
                }
              />
            </label>
            <button
              className="cms-button cms-button-ghost"
              type="button"
              onClick={() =>
                setProfile((current) => ({
                  ...current,
                  experience: current.experience.filter((_, i) => i !== index),
                }))
              }
            >
              Remove experience
            </button>
          </div>
        ))}
        <button
          className="cms-button cms-button-ghost"
          type="button"
          onClick={() =>
            setProfile((current) => ({
              ...current,
              experience: [
                ...current.experience,
                {
                  id: createId("exp"),
                  company: "",
                  role: "",
                  startDate: "",
                  endDate: null,
                  description: "",
                  highlights: [],
                },
              ],
            }))
          }
        >
          Add experience
        </button>
      </fieldset>

      <fieldset className="theme-group">
        <legend>Certifications</legend>
        <p className="repo-curator-note">
          Set status to &quot;In progress&quot; to show beside About Me. Upload a PDF for completed
          certificates.
        </p>
        {profile.certifications.map((cert, index) => (
          <div key={cert.id} className="profile-editor-block">
            <label className="cms-field">
              <span>Title</span>
              <input
                value={cert.title}
                onChange={(event) =>
                  updateCertification(index, { ...cert, title: event.target.value })
                }
              />
            </label>
            <label className="cms-field">
              <span>Issuer</span>
              <input
                value={cert.issuer}
                onChange={(event) =>
                  updateCertification(index, { ...cert, issuer: event.target.value })
                }
              />
            </label>
            <div className="profile-editor-row">
              <label className="cms-field">
                <span>Date (optional)</span>
                <input
                  value={cert.date ?? ""}
                  onChange={(event) =>
                    updateCertification(index, {
                      ...cert,
                      date: event.target.value || undefined,
                    })
                  }
                  placeholder="2025"
                />
              </label>
              <label className="cms-field">
                <span>Status</span>
                <select
                  value={cert.status}
                  onChange={(event) =>
                    updateCertification(index, {
                      ...cert,
                      status: event.target.value as Certification["status"],
                    })
                  }
                >
                  <option value="completed">Completed</option>
                  <option value="in-progress">In progress</option>
                </select>
              </label>
            </div>
            <label className="cms-field">
              <span>Description (optional)</span>
              <textarea
                rows={2}
                value={cert.description ?? ""}
                onChange={(event) =>
                  updateCertification(index, {
                    ...cert,
                    description: event.target.value || undefined,
                  })
                }
              />
            </label>
            <label className="cms-field">
              <span>Credential link (optional)</span>
              <input
                type="url"
                value={cert.link ?? ""}
                onChange={(event) =>
                  updateCertification(index, {
                    ...cert,
                    link: event.target.value || undefined,
                  })
                }
              />
            </label>
            {cert.status === "completed" ? (
              <PdfUpload
                value={cert.pdfUrl}
                onChange={(url) => updateCertification(index, { ...cert, pdfUrl: url || undefined })}
              />
            ) : null}
            <button
              className="cms-button cms-button-ghost"
              type="button"
              onClick={() =>
                setProfile((current) => ({
                  ...current,
                  certifications: current.certifications.filter((_, i) => i !== index),
                }))
              }
            >
              Remove certification
            </button>
          </div>
        ))}
        <button
          className="cms-button cms-button-ghost"
          type="button"
          onClick={() =>
            setProfile((current) => ({
              ...current,
              certifications: [
                ...current.certifications,
                {
                  id: createId("cert"),
                  title: "",
                  issuer: "",
                  status: "completed",
                },
              ],
            }))
          }
        >
          Add certification
        </button>
      </fieldset>

      {error ? <p className="cms-status cms-status-error">{error}</p> : null}
      {success ? <p className="cms-status cms-status-ok">{success}</p> : null}

      <button className="cms-button" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
