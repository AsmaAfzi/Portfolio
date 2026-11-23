import { redirect } from "next/navigation";

export default function LegacyEditProjectPage() {
  redirect("/admin/repos");
}
