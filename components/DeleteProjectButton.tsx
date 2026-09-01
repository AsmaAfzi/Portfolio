"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DeleteProjectButtonProps = {
  slug: string;
  title: string;
};

export function DeleteProjectButton({ slug, title }: DeleteProjectButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onDelete() {
    const confirmed = window.confirm(`Delete "${title}" from GitHub?`);
    if (!confirmed) return;

    setPending(true);
    setError("");

    const response = await fetch(`/api/projects/${slug}`, { method: "DELETE" });
    const data = (await response.json()) as { error?: string };

    setPending(false);

    if (!response.ok) {
      setError(data.error ?? "Could not delete project.");
      return;
    }

    router.push("/admin/projects");
    router.refresh();
  }

  return (
    <div className="cms-delete">
      <button
        className="cms-button cms-button-danger"
        type="button"
        onClick={onDelete}
        disabled={pending}
      >
        {pending ? "Deleting…" : "Delete project"}
      </button>
      {error ? <p className="cms-status cms-status-error">{error}</p> : null}
    </div>
  );
}
