import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { getProject, getProjects } from "@/lib/projects";

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) notFound();

  return (
    <main className="site project-page">
      <Card>
        <p>
          <Link href="/">All projects</Link>
        </p>
        {project.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={project.image} alt="" className="project-hero" />
        ) : null}
        <h1>{project.title}</h1>
        <p>{project.description}</p>
        <ul className="tech-list">
          {project.tech.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="project-links">
          {project.links.live ? (
            <a href={project.links.live} target="_blank" rel="noreferrer">
              Live site
            </a>
          ) : null}
          {project.links.github ? (
            <a href={project.links.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
          ) : null}
        </p>
      </Card>
    </main>
  );
}
