import { AdminNav } from "@/components/AdminNav";
import { ProjectForm } from "@/components/ProjectForm";
import { Card } from "@/components/ui/Card";

export default function NewProjectPage() {
  return (
    <main className="cms">
      <Card className="cms-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Add project</h1>
        </div>
        <AdminNav />
      </Card>

      <Card>
        <p>This writes a JSON file to your GitHub repo. Vercel will redeploy on that commit.</p>
        <ProjectForm mode="create" />
      </Card>
    </main>
  );
}
