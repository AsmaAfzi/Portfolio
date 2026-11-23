import { UserRound } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";

type IntroSectionProps = {
  intro: string;
};

export function IntroSection({ intro }: IntroSectionProps) {
  if (!intro.trim()) return null;

  const paragraphs = intro.split(/\n\n+/).filter(Boolean);

  return (
    <Card as="article" className="about-in-progress-panel">
      <SectionTitle icon={UserRound}>About Me</SectionTitle>
      <div className="about-in-progress-content">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </Card>
  );
}
