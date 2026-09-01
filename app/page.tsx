import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { getProjects } from "@/lib/projects";

export default async function Home() {
  const projects = await getProjects();

  return (
    <main className="site">
      <Card as="header" className="site-header">
        <div>
          <p className="eyebrow">Portfolio</p>
          <h1>Projects</h1>
          <p>
            Project data lives in <code>content/projects</code>. Add more from the{" "}
            <Link href="/admin/projects/new">CMS</Link>.
          </p>
        </div>
      </Card>

      {projects.length === 0 ? (
        <Card className="empty">
          <p>No projects yet.</p>
        </Card>
      ) : (
        <ul className="project-grid">
          {projects.map((project) => (
            <li key={project.slug}>
              <Card as="article" className="project-card" padding="none">
                {project.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={project.image} alt="" className="project-card-image" />
                ) : null}
                <div className="project-card-body">
                  {project.featured ? <span className="badge">Featured</span> : null}
                  <h2>
                    <Link href={`/projects/${project.slug}`}>{project.title}</Link>
                  </h2>
                  <p>{project.description}</p>
                  <ul className="tech-list">
                    {project.tech.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
