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

export function formatZodError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid request.";
}
