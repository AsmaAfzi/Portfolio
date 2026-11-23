import { Wrench } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import type { ToolCategory } from "@/lib/profile";

type ToolsSectionProps = {
  tools: ToolCategory[];
};

export function ToolsSection({ tools }: ToolsSectionProps) {
  const visibleCategories = tools.filter((category) => category.items.length > 0);
  if (visibleCategories.length === 0) return null;

  return (
    <section className="profile-section" id="tools">
      <SectionTitle icon={Wrench}>Tools & Technologies</SectionTitle>
      <Card as="article" className="tools-panel">
        <ul className="tools-grid">
          {visibleCategories.map((category) => (
            <li key={category.id} className="tools-category">
              <h3>{category.name}</h3>
              <ul className="tech-list">
                {category.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
