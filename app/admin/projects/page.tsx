import { redirect } from "next/navigation";

export default function LegacyProjectsPage() {
  redirect("/admin/repos");
}
