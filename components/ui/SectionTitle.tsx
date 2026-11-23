import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type SectionTitleProps = {
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
};

export function SectionTitle({ icon: Icon, children, className = "" }: SectionTitleProps) {
  const classes = ["section-title", className].filter(Boolean).join(" ");

  return (
    <h2 className={classes}>
      <span className="section-title-icon" aria-hidden="true">
        <Icon size={18} strokeWidth={2} />
      </span>
      <span>{children}</span>
    </h2>
  );
}
