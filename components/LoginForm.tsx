"use client";

import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    router.push(from?.startsWith("/admin") ? from : "/admin/repos");
    router.refresh();
  }

  return (
    <form className="cms-form" onSubmit={onSubmit}>
      <label className="cms-field">
        <span>Password</span>
        <span className="input-with-action">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            required
            autoFocus
            autoComplete="current-password"
          />
          <button
            type="button"
            className="icon-button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </span>
      </label>
      {error ? <p className="cms-status cms-status-error">{error}</p> : null}
      <button className="cms-button cms-button-block" type="submit" disabled={pending}>
        {pending ? <Loader2 className="spin" size={16} aria-hidden="true" /> : null}
        {pending ? "Signing in…" : "Sign in"}
        {pending ? null : <ArrowRight size={16} aria-hidden="true" />}
      </button>
    </form>
  );
}
