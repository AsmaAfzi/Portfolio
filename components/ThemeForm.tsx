"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { ThemeConfig } from "@/lib/theme";

type ThemeFormProps = {
  initialTheme: ThemeConfig;
};

export function ThemeForm({ initialTheme }: ThemeFormProps) {
  const router = useRouter();
  const [theme, setTheme] = useState(initialTheme);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);

  function updateColor(key: keyof ThemeConfig["colors"], value: string) {
    setTheme((current) => ({
      ...current,
      colors: { ...current.colors, [key]: value },
    }));
  }

  function updateRadius(key: keyof ThemeConfig["radius"], value: string) {
    setTheme((current) => ({
      ...current,
      radius: { ...current.radius, [key]: value },
    }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setSuccess("");

    const response = await fetch("/api/theme", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(theme),
    });
    const data = (await response.json()) as { error?: string; commitUrl?: string | null };

    setPending(false);

    if (!response.ok) {
      setError(data.error ?? "Could not save theme.");
      return;
    }

    setSuccess("Theme saved to GitHub.");
    router.refresh();
  }

  return (
    <form className="cms-form" onSubmit={onSubmit}>
      <fieldset className="theme-group">
        <legend>Colors</legend>
        {Object.entries(theme.colors).map(([key, value]) => (
          <label className="cms-field" key={key}>
            <span>{key}</span>
            <input
              type="text"
              value={value}
              onChange={(event) =>
                updateColor(key as keyof ThemeConfig["colors"], event.target.value)
              }
            />
          </label>
        ))}
      </fieldset>

      <fieldset className="theme-group">
        <legend>Radius</legend>
        {Object.entries(theme.radius).map(([key, value]) => (
          <label className="cms-field" key={key}>
            <span>{key}</span>
            <input
              type="text"
              value={value}
              onChange={(event) =>
                updateRadius(key as keyof ThemeConfig["radius"], event.target.value)
              }
            />
          </label>
        ))}
      </fieldset>

      {error ? <p className="cms-status cms-status-error">{error}</p> : null}
      {success ? <p className="cms-status cms-status-ok">{success}</p> : null}

      <button className="cms-button" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save theme to GitHub"}
      </button>
    </form>
  );
}
