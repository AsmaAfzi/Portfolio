import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .url("Enter a valid URL.")
  .optional()
  .or(z.literal("").transform(() => undefined));

export const projectInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(80),
  description: z.string().trim().min(1, "Description is required.").max(2000),
  tech: z
    .array(z.string().trim().min(1))
    .min(1, "Add at least one tech.")
    .max(20, "Use 20 technologies or fewer."),
  links: z.object({
    live: optionalUrl,
    github: optionalUrl,
  }),
  image: optionalUrl,
  featured: z.boolean().optional().default(false),
});

export const themeSchema = z.object({
  colors: z.object({
    background: z.string().trim().min(1),
    foreground: z.string().trim().min(1),
    muted: z.string().trim().min(1),
    card: z.string().trim().min(1),
    cardBorder: z.string().trim().min(1),
    accent: z.string().trim().min(1),
    accentForeground: z.string().trim().min(1),
    backgroundAlt: z.string().trim().min(1).optional(),
    backgroundText: z.string().trim().min(1).optional(),
    secondary: z.string().trim().min(1).optional(),
  }),
  radius: z.object({
    card: z.string().trim().min(1),
    button: z.string().trim().min(1),
    image: z.string().trim().min(1),
    pill: z.string().trim().min(1),
  }),
  spacing: z.object({
    cardPadding: z.string().trim().min(1),
    sectionGap: z.string().trim().min(1),
    pageWidth: z.string().trim().min(1),
  }),
  typography: z.object({
    eyebrowSize: z.string().trim().min(1),
    titleSize: z.string().trim().min(1),
  }),
  effects: z
    .object({
      lavaBlur: z.string().trim().min(1),
      lavaIntensity: z.string().trim().min(1),
      lavaSpeed: z.string().trim().min(1),
    })
    .partial()
    .optional(),
});

export const siteSchema = z.object({
  home: z.object({
    eyebrow: z.string().trim().min(1).max(40),
    title: z.string().trim().min(1).max(80),
    description: z.string().trim().min(1).max(500),
    role: z.string().trim().max(80).optional(),
    location: z.string().trim().max(80).optional(),
    availability: z.string().trim().max(60).optional(),
    links: z
      .object({
        github: optionalUrl,
        linkedin: optionalUrl,
        email: z
          .string()
          .trim()
          .email("Enter a valid email address.")
          .optional()
          .or(z.literal("").transform(() => undefined)),
        resume: optionalUrl,
      })
      .optional(),
  }),
  layout: z.object({
    gridColumns: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    showStars: z.boolean(),
    showLanguage: z.boolean(),
    showTopics: z.boolean(),
  }),
  hiddenRepoIds: z.array(z.number().int().positive()),
  repoDescriptions: z.record(z.string(), z.string().trim().max(300)).optional().default({}),
  repoTech: z
    .record(z.string(), z.array(z.string().trim().min(1).max(40)).max(15, "Use 15 technologies or fewer."))
    .optional()
    .default({}),
});

export function parseTechInput(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export const inProgressProjectSchema = z.object({
  id: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(1000),
  link: optionalUrl,
});

export const certificationSchema = z.object({
  id: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(120),
  issuer: z.string().trim().min(1).max(120),
  date: z.string().trim().max(40).optional(),
  description: z.string().trim().max(1000).optional(),
  pdfUrl: optionalUrl,
  status: z.enum(["completed", "in-progress"]),
  link: optionalUrl,
});

export const experienceSchema = z.object({
  id: z.string().trim().min(1).max(80),
  company: z.string().trim().min(1).max(120),
  role: z.string().trim().min(1).max(120),
  startDate: z.string().trim().min(1).max(40),
  endDate: z.string().trim().max(40).optional().nullable(),
  description: z.string().trim().min(1).max(2000),
  highlights: z.array(z.string().trim().min(1)).max(10).optional(),
});

export const toolCategorySchema = z.object({
  id: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(80),
  items: z.array(z.string().trim().min(1)).min(1).max(30),
});

export const profileSchema = z.object({
  intro: z.string().trim().min(1).max(5000),
  tools: z.array(toolCategorySchema),
  experience: z.array(experienceSchema),
  certifications: z.array(certificationSchema),
  inProgressProjects: z.array(inProgressProjectSchema),
  inProgressRepoIds: z.array(z.number().int().positive()),
});

export function formatZodError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid request.";
}
