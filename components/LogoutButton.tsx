"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button className="cms-button cms-button-ghost cms-button-sm" type="button" onClick={logout}>
      <LogOut size={15} aria-hidden="true" />
      Sign out
    </button>
  );
}
