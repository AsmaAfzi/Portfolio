import { AdminNav } from "@/components/AdminNav";
import { ProfileForm } from "@/components/ProfileForm";
import { Card } from "@/components/ui/Card";
import { getReposWithDescriptions } from "@/lib/display";
import { getProfile } from "@/lib/profile";

export default async function ProfilePage() {
  const profile = await getProfile();
  let repos: Awaited<ReturnType<typeof getReposWithDescriptions>> = [];

  try {
    repos = await getReposWithDescriptions();
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
