import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

export function AdminNav() {
  return (
    <nav className="admin-nav">
      <div className="admin-nav-links">
        <Link href="/admin/projects">Projects</Link>
        <Link href="/admin/projects/new">Add project</Link>
        <Link href="/admin/theme">Theme</Link>
        <Link href="/">View site</Link>
      </div>
      <LogoutButton />
    </nav>
  );
}
