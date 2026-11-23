import { Award } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { HorizontalScroller } from "@/components/ui/HorizontalScroller";
import { SectionTitle } from "@/components/ui/SectionTitle";
import type { Certification } from "@/lib/profile";

type CertificationsSectionProps = {
  certifications: Certification[];
  gridColumns?: 1 | 2 | 3;
};

export function CertificationsSection({
  certifications,
  gridColumns = 2,
}: CertificationsSectionProps) {
  if (certifications.length === 0) return null;

  return (
    <section className="profile-section" id="certifications">
      <HorizontalScroller
        heading={<SectionTitle icon={Award}>Certifications</SectionTitle>}
        label="certifications"
        perView={gridColumns}
        autoPlay={5000}
        loop
      >
        {certifications.map((cert) => (
          <li key={cert.id}>
            <Card as="article" className={`project-card${cert.pdfUrl ? " ui-card-flush" : ""}`}>
              {cert.pdfUrl ? (
                <div className="certificate-preview">
                  <iframe
                    src={cert.pdfUrl}
                    title={`${cert.title} certificate`}
                    className="certificate-pdf"
                  />
                </div>
              ) : null}
              <div className="project-card-body">
                <h3>{cert.title}</h3>
                <p className="cert-meta">
                  {cert.issuer}
                  {cert.date ? ` · ${cert.date}` : ""}
                </p>
                {cert.description ? <p>{cert.description}</p> : null}
                <p className="project-links">
                  {cert.link ? (
                    <a href={cert.link} target="_blank" rel="noreferrer">
                      Credential link
                    </a>
                  ) : null}
                  {cert.pdfUrl ? (
                    <a href={cert.pdfUrl} target="_blank" rel="noreferrer">
                      Open PDF
                    </a>
                  ) : null}
                </p>
              </div>
            </Card>
          </li>
        ))}
      </HorizontalScroller>
    </section>
  );
}
