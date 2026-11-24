"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DescribedRepo } from "@/lib/display";
import { parseTechInput } from "@/lib/schemas";

type RepoWithVisibility = DescribedRepo & { visible: boolean };

type RepoCuratorProps = {
  repos: RepoWithVisibility[];
  initialHiddenIds: number[];
  initialTech: Record<string, string[]>;
  initialDescriptions: Record<string, string>;
  detectedTech: Record<number, string[]>;
};

export function RepoCurator({
  repos,
  initialHiddenIds,
  initialTech,
  initialDescriptions,
  detectedTech,
}: RepoCuratorProps) {
  const router = useRouter();
  const [hiddenIds, setHiddenIds] = useState(new Set(initialHiddenIds));
  const [descriptions, setDescriptions] = useState(initialDescriptions);
  // Kept as the raw comma-separated text while editing; split on save.
  const [techText, setTechText] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(initialTech).map(([name, items]) => [name, items.join(", ")])),
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);

  function toggleVisible(repoId: number, visible: boolean) {
    setHiddenIds((current) => {
      const next = new Set(current);
      if (visible) next.delete(repoId);
      else next.add(repoId);
      return next;
    });
  }

  async function onSave() {
    setPending(true);
    setError("");
    setSuccess("");

    const response = await fetch("/api/site");
    const current = (await response.json()) as { site?: { home: unknown; layout: unknown } };
    if (!current.site) {
      setPending(false);
      setError("Could not load current site settings.");
      return;
    }

    const save = await fetch("/api/site", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...current.site,
        hiddenRepoIds: Array.from(hiddenIds),
        repoDescriptions: Object.fromEntries(
          Object.entries(descriptions)
            .map(([name, text]) => [name, text.trim()] as const)
            .filter(([, text]) => text.length > 0),
        ),
        repoTech: Object.fromEntries(
          Object.entries(techText)
            .map(([name, text]) => [name, parseTechInput(text)] as const)
            .filter(([, items]) => items.length > 0),
        ),
      }),
    });
    const data = (await save.json()) as { error?: string };

    setPending(false);

    if (!save.ok) {
      setError(data.error ?? "Could not save visibility.");
      return;
    }

    setSuccess(
      "Saved. Your live site updates once Vercel finishes redeploying (about a minute). Hidden repos stay on GitHub.",
    );
    router.refresh();
  }

  return (
    <div className="repo-curator">
      <p className="repo-curator-note">
        Toggle which repos appear on your portfolio. This does not delete anything from GitHub.
      </p>
      <ul className="admin-list">
        {repos.map((repo) => {
          const visible = !hiddenIds.has(repo.id);
          return (
            <li key={repo.id}>
              <div className="repo-curator-row">
                <div className="admin-list-item">
                  <div>
                    <h2>{repo.name}</h2>
                    <p>{repo.description ?? "No description"}</p>
                  </div>
                  <label className="cms-check">
                    <input
                      type="checkbox"
                      checked={visible}
                      onChange={(event) => toggleVisible(repo.id, event.target.checked)}
                    />
                    <span>{visible ? "Visible" : "Hidden"}</span>
                  </label>
                </div>
                <label className="cms-field">
                  <span>Description</span>
                  <textarea
                    rows={2}
                    maxLength={300}
                    value={descriptions[repo.name] ?? ""}
                    placeholder={repo.autoDescription ?? "Write a one-line description"}
                    onChange={(event) =>
                      setDescriptions((current) => ({ ...current, [repo.name]: event.target.value }))
                    }
                  />
                  <small>
                    {repo.autoDescription
                      ? "Leave empty to use the greyed-out description, taken from GitHub or the README."
                      : "No description on GitHub or in the README. Write one here."}
                  </small>
                </label>
                {visible ? (
                  <div className="repo-curator-tech">
                    {detectedTech[repo.id] ? (
                      <div className="repo-detected">
                        <span className="repo-detected-label">Detected from code</span>
                        {detectedTech[repo.id].length > 0 ? (
                          <ul className="tech-list">
                            {detectedTech[repo.id].map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="repo-detected-empty">Nothing recognised</span>
                        )}
                      </div>
                    ) : null}
                    <label className="cms-field">
                      <span>Extra tech</span>
                      <input
                        value={techText[repo.name] ?? ""}
                        placeholder="e.g. Computer Vision, REST APIs"
                        onChange={(event) =>
                          setTechText((current) => ({ ...current, [repo.name]: event.target.value }))
                        }
                      />
                      <small>
                        Comma-separated. Shown first, before the detected tech. Languages come from
                        GitHub automatically.
                      </small>
                    </label>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      {error ? <p className="cms-status cms-status-error">{error}</p> : null}
      {success ? <p className="cms-status cms-status-ok">{success}</p> : null}
      <button className="cms-button" type="button" onClick={onSave} disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}
