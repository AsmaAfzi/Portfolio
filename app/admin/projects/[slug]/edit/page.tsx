import { notFound } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { DeleteProjectButton } from "@/components/DeleteProjectButton";
import { ProjectForm } from "@/components/ProjectForm";
import { Card } from "@/components/ui/Card";
import { getProject } from "@/lib/projects";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  return (
    <main className="cms">
      <Card className="cms-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Edit project</h1>
        </div>
        <AdminNav />
      </Card>

      <Card>
        <ProjectForm mode="edit" project={project} />
        <DeleteProjectButton slug={project.slug} title={project.title} />
      </Card>
    </main>
  );
}
