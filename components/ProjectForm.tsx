"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@/components/ImageUpload";
import type { Project } from "@/lib/project";

type Status =
  | { type: "idle" }
  | { type: "pending" }
  | { type: "error"; message: string }
  | { type: "success"; slug: string; commitUrl: string | null; updated: boolean };

type ProjectFormProps = {
  mode: "create" | "edit";
  project?: Project;
};

export function ProjectForm({ mode, project }: ProjectFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [imageUrl, setImageUrl] = useState(project?.image ?? "");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus({ type: "pending" });

    const body = new FormData(form);
    body.set("imageUrl", imageUrl);

    const endpoint =
      mode === "create" ? "/api/projects" : `/api/projects/${project?.slug}`;
    const method = mode === "create" ? "POST" : "PUT";

    const response = await fetch(endpoint, { method, body });
    const data = (await response.json()) as {
      error?: string;
      project?: Project;
      commitUrl?: string | null;
      updated?: boolean;
    };

    if (!response.ok || !data.project) {
      setStatus({ type: "error", message: data.error ?? "Could not save project." });
      return;
    }

    if (mode === "create") form.reset();
    setImageUrl(data.project.image ?? "");
    setStatus({
      type: "success",
      slug: data.project.slug,
      commitUrl: data.commitUrl ?? null,
      updated: Boolean(data.updated),
    });

    if (mode === "edit" && data.project.slug !== project?.slug) {
      router.replace(`/admin/projects/${data.project.slug}/edit`);
    }
    router.refresh();
  }

  return (
    <form className="cms-form" onSubmit={onSubmit}>
      <label className="cms-field">
        <span>Title</span>
        <input
          name="title"
          required
          maxLength={80}
          defaultValue={project?.title ?? ""}
        />
      </label>

      <label className="cms-field">
        <span>Description</span>
        <textarea
          name="description"
          required
          rows={5}
          defaultValue={project?.description ?? ""}
        />
      </label>

      <label className="cms-field">
        <span>Tech stack</span>
        <input
          name="tech"
          required
          defaultValue={project?.tech.join(", ") ?? ""}
          placeholder="Next.js, TypeScript, Octokit"
        />
        <small>Comma-separated.</small>
      </label>

      <label className="cms-field">
        <span>Live URL</span>
        <input
          name="liveUrl"
          type="url"
          defaultValue={project?.links.live ?? ""}
          placeholder="https://"
        />
      </label>

      <label className="cms-field">
        <span>GitHub URL</span>
        <input
          name="githubUrl"
          type="url"
          defaultValue={project?.links.github ?? ""}
          placeholder="https://github.com/..."
        />
      </label>

      <ImageUpload value={imageUrl} onChange={setImageUrl} />

      <label className="cms-check">
        <input
          name="featured"
          type="checkbox"
          defaultChecked={project?.featured ?? false}
        />
        <span>Featured</span>
      </label>

      {status.type === "error" ? (
        <p className="cms-status cms-status-error">{status.message}</p>
      ) : null}

      {status.type === "success" ? (
        <p className="cms-status cms-status-ok">
          {status.updated ? "Updated" : "Saved"}{" "}
          <code>{status.slug}</code>. Vercel will redeploy from the new commit.
          {status.commitUrl ? (
            <>
              {" "}
              <a href={status.commitUrl} target="_blank" rel="noreferrer">
                View commit
              </a>
            </>
          ) : null}
        </p>
      ) : null}

      <button className="cms-button" type="submit" disabled={status.type === "pending"}>
        {status.type === "pending"
          ? "Saving…"
          : mode === "create"
            ? "Save to GitHub"
            : "Update on GitHub"}
      </button>
    </form>
  );
}
