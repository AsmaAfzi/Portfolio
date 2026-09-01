import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { Card } from "@/components/ui/Card";
import { getProjects } from "@/lib/projects";

export default async function AdminProjectsPage() {
  const projects = await getProjects();

  return (
    <main className="cms">
      <Card className="cms-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Projects</h1>
        </div>
        <AdminNav />
      </Card>

      {projects.length === 0 ? (
        <Card className="empty">
          <p>No projects yet.</p>
          <Link href="/admin/projects/new">Add your first project</Link>
        </Card>
      ) : (
        <ul className="admin-list">
          {projects.map((project) => (
            <li key={project.slug}>
              <Card className="admin-list-item">
                <div>
                  <h2>{project.title}</h2>
                  <p>{project.slug}</p>
                </div>
                <div className="admin-list-actions">
                  <Link href={`/admin/projects/${project.slug}/edit`}>Edit</Link>
                  <Link href={`/projects/${project.slug}`}>View</Link>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
