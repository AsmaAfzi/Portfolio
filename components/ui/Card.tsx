import type { ComponentPropsWithoutRef, ElementType } from "react";

type CardProps<T extends ElementType = "div"> = {
  as?: T;
  padding?: "default" | "none";
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

export function Card<T extends ElementType = "div">({
  as,
  padding = "default",
  className = "",
  ...props
}: CardProps<T>) {
  const Component = as ?? "div";
  const classes = ["ui-card", padding === "none" ? "ui-card-flush" : "", className]
    .filter(Boolean)
    .join(" ");

  return <Component className={classes} {...props} />;
}
