"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      body: new FormData(event.currentTarget),
    });

    setPending(false);

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Could not sign in.");
      return;
    }

    const from = searchParams.get("from");
    router.push(from?.startsWith("/admin") ? from : "/admin/projects");
    router.refresh();
  }

  return (
    <form className="cms-form" onSubmit={onSubmit}>
      <label className="cms-field">
        <span>Password</span>
        <input type="password" name="password" required autoComplete="current-password" />
      </label>
      {error ? <p className="cms-status cms-status-error">{error}</p> : null}
      <button className="cms-button" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
