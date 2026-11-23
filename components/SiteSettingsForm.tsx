"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { SiteConfig, SiteLinks } from "@/lib/site";

type SiteSettingsFormProps = {
  initialSite: SiteConfig;
};

export function SiteSettingsForm({ initialSite }: SiteSettingsFormProps) {
  const router = useRouter();
  const [site, setSite] = useState(initialSite);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);

  function setHome<K extends Exclude<keyof SiteConfig["home"], "links">>(key: K, value: string) {
    setSite((current) => ({ ...current, home: { ...current.home, [key]: value } }));
  }

  function setLink(key: keyof SiteLinks, value: string) {
    setSite((current) => ({
      ...current,
      home: { ...current.home, links: { ...current.home.links, [key]: value } },
    }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setSuccess("");

    const response = await fetch("/api/site", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(site),
    });
    const data = (await response.json()) as { error?: string };

    setPending(false);

    if (!response.ok) {
      setError(data.error ?? "Could not save site settings.");
      return;
    }

    setSuccess("Layout and homepage copy saved.");
    router.refresh();
  }

  return (
    <form className="cms-form" onSubmit={onSubmit}>
      <fieldset className="theme-group">
        <legend>Intro</legend>
        <div className="profile-editor-row">
          <label className="cms-field">
            <span>Name</span>
            <input value={site.home.title} onChange={(event) => setHome("title", event.target.value)} />
          </label>
          <label className="cms-field">
            <span>Role</span>
            <input
              value={site.home.role ?? ""}
              placeholder="Software Developer"
              onChange={(event) => setHome("role", event.target.value)}
            />
          </label>
        </div>
        <label className="cms-field">
          <span>Headline</span>
          <textarea
            rows={3}
            value={site.home.description}
            onChange={(event) => setHome("description", event.target.value)}
          />
          <small>One or two sentences shown under your name.</small>
        </label>
        <div className="profile-editor-row">
          <label className="cms-field">
            <span>Eyebrow</span>
            <input value={site.home.eyebrow} onChange={(event) => setHome("eyebrow", event.target.value)} />
            <small>Small label above your name.</small>
          </label>
          <label className="cms-field">
            <span>Location</span>
            <input
              value={site.home.location ?? ""}
              placeholder="Optional"
              onChange={(event) => setHome("location", event.target.value)}
            />
          </label>
        </div>
        <label className="cms-field">
          <span>Availability</span>
          <input
            value={site.home.availability ?? ""}
            placeholder="e.g. Open to new opportunities"
            onChange={(event) => setHome("availability", event.target.value)}
          />
          <small>Shows as a status badge in the intro. Leave empty to hide it.</small>
        </label>
      </fieldset>

      <fieldset className="theme-group">
        <legend>Intro links</legend>
        <div className="profile-editor-row">
          <label className="cms-field">
            <span>GitHub</span>
            <input
              type="url"
              value={site.home.links?.github ?? ""}
              placeholder="Defaults to your GITHUB_OWNER profile"
              onChange={(event) => setLink("github", event.target.value)}
            />
          </label>
          <label className="cms-field">
            <span>LinkedIn</span>
            <input
              type="url"
              value={site.home.links?.linkedin ?? ""}
              placeholder="https://linkedin.com/in/…"
              onChange={(event) => setLink("linkedin", event.target.value)}
            />
          </label>
          <label className="cms-field">
            <span>Email</span>
            <input
              type="email"
              value={site.home.links?.email ?? ""}
              placeholder="you@example.com"
              onChange={(event) => setLink("email", event.target.value)}
            />
          </label>
          <label className="cms-field">
            <span>Résumé</span>
            <input
              type="url"
              value={site.home.links?.resume ?? ""}
              placeholder="Link to a PDF"
              onChange={(event) => setLink("resume", event.target.value)}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="theme-group">
        <legend>Layout</legend>
        <label className="cms-field">
          <span>Grid columns</span>
          <select
            value={site.layout.gridColumns}
            onChange={(event) =>
              setSite((current) => ({
                ...current,
                layout: {
                  ...current.layout,
                  gridColumns: Number(event.target.value) as 1 | 2 | 3,
                },
              }))
            }
          >
            <option value={1}>1 column</option>
            <option value={2}>2 columns</option>
            <option value={3}>3 columns</option>
          </select>
        </label>
        <label className="cms-check">
          <input
            type="checkbox"
            checked={site.layout.showStars}
            onChange={(event) =>
              setSite((current) => ({
                ...current,
                layout: { ...current.layout, showStars: event.target.checked },
              }))
            }
          />
          <span>Show star count</span>
        </label>
        <label className="cms-check">
          <input
            type="checkbox"
            checked={site.layout.showLanguage}
            onChange={(event) =>
              setSite((current) => ({
                ...current,
                layout: { ...current.layout, showLanguage: event.target.checked },
              }))
            }
          />
          <span>Show language</span>
        </label>
        <label className="cms-check">
          <input
            type="checkbox"
            checked={site.layout.showTopics}
            onChange={(event) =>
              setSite((current) => ({
                ...current,
                layout: { ...current.layout, showTopics: event.target.checked },
              }))
            }
          />
          <span>Show topics</span>
        </label>
      </fieldset>

      {error ? <p className="cms-status cms-status-error">{error}</p> : null}
      {success ? <p className="cms-status cms-status-ok">{success}</p> : null}

      <button className="cms-button" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save layout & copy"}
      </button>
    </form>
  );
}
