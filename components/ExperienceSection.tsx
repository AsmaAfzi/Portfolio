import { Briefcase } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import type { Experience } from "@/lib/profile";

type ExperienceSectionProps = {
  experience: Experience[];
};

export function ExperienceSection({ experience }: ExperienceSectionProps) {
  if (experience.length === 0) return null;

  return (
    <section className="profile-section" id="experience">
      <SectionTitle icon={Briefcase}>Work Experience</SectionTitle>
      <ol className="experience-list experience-timeline">
        {experience.map((entry) => (
          <li key={entry.id} className={`timeline-item${entry.endDate ? "" : " is-current"}`}>
            <span className="timeline-node" aria-hidden="true" />
            <Card as="article" className="experience-card">
              <div className="experience-header">
                <div>
                  <h3>{entry.role}</h3>
                  <p className="cert-meta">{entry.company}</p>
                </div>
                <p className="experience-dates">
                  {entry.startDate}
                  {entry.endDate ? ` — ${entry.endDate}` : " — Present"}
                </p>
              </div>
              <p>{entry.description}</p>
              {entry.highlights && entry.highlights.length > 0 ? (
                <ul className="experience-highlights">
                  {entry.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              ) : null}
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}
