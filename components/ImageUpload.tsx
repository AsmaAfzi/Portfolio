"use client";

import { ChangeEvent, useState } from "react";

type ImageUploadProps = {
  value?: string;
  onChange: (url: string) => void;
};

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setPending(true);
    setError("");

    const body = new FormData();
    body.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body,
    });
    const data = (await response.json()) as { url?: string; error?: string };

    setPending(false);

    if (!response.ok || !data.url) {
      setError(data.error ?? "Upload failed.");
      return;
    }

    onChange(data.url);
  }

  return (
    <div className="cms-field">
      <span>Image</span>
      <input
        name="imageUrl"
        type="url"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder="https://res.cloudinary.com/..."
      />
      <input type="file" accept="image/*" onChange={onFileChange} disabled={pending} />
      <small>{pending ? "Uploading…" : "Upload to Cloudinary or paste a URL."}</small>
      {error ? <p className="cms-status cms-status-error">{error}</p> : null}
    </div>
  );
}
