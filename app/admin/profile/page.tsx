import { AdminNav } from "@/components/AdminNav";
import { ProfileForm } from "@/components/ProfileForm";
import { Card } from "@/components/ui/Card";
import { getGitHubRepos } from "@/lib/github-repos";
import { getProfile } from "@/lib/profile";

export default async function ProfilePage() {
  const profile = await getProfile();
  let repos: Awaited<ReturnType<typeof getGitHubRepos>> = [];

  try {
    repos = await getGitHubRepos();
  } catch {
    repos = [];
  }

  return (
    <main className="cms">
      <Card className="cms-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Profile</h1>
        </div>
        <AdminNav />
      </Card>

      <Card>
        <p>
          Edit your introduction, work experience, certifications, and in-progress items.
          Completed certifications can include a PDF upload.
        </p>
        <ProfileForm initialProfile={profile} repos={repos} />
      </Card>
    </main>
  );
}
