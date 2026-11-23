"use client";

import { ExternalLink, FolderGit2, LayoutGrid, Palette, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";

const LINKS = [
  { href: "/admin/repos", label: "Repos", icon: FolderGit2 },
  { href: "/admin/profile", label: "Profile", icon: UserRound },
  { href: "/admin/appearance", label: "Layout", icon: LayoutGrid },
  { href: "/admin/theme", label: "Theme", icon: Palette },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-nav" aria-label="Admin">
      <div className="admin-tabs">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`admin-tab${active ? " is-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={15} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </div>
      <div className="admin-nav-actions">
        <Link href="/" className="admin-tab admin-tab-quiet" target="_blank">
          <ExternalLink size={15} aria-hidden="true" />
          View site
        </Link>
        <LogoutButton />
      </div>
    </nav>
  );
}
