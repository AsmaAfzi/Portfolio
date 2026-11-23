import { describe, it, expect } from "vitest";
import { siteSchema } from "../schemas";

const validSite = {
  home: {
    title: "Test Portfolio",
    eyebrow: "Hello",
    description: "A short description of the site.",
    links: {},
  },
  layout: {
    gridColumns: 3 as const,
    showStars: false,
    showLanguage: true,
    showTopics: true,
  },
  hiddenRepoIds: [],
  repoDescriptions: {},
  repoTech: {},
};

describe("siteSchema", () => {
  it("accepts a valid site config", () => {
    const result = siteSchema.safeParse(validSite);
    expect(result.success).toBe(true);
  });

  it("rejects invalid gridColumns", () => {
    const result = siteSchema.safeParse({
      ...validSite,
      layout: { ...validSite.layout, gridColumns: 99 },
    });
    expect(result.success).toBe(false);
  });
});
