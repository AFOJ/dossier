import { z } from "zod"

export const resumeBulletSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), text: z.string() }),
  z.object({
    type: z.literal("text-with-title"),
    title: z.string(),
    text: z.string(),
  }),
])

export const resumeSectionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("paragraph"),
    title: z.string().min(1, "Title is required"),
    text: z.string(),
  }),
  z.object({
    type: z.literal("education"),
    title: z.string().min(1, "Title is required"),
    institutions: z.array(
      z.object({
        name: z.string(),
        degree: z.string(),
        grade: z.string().optional(),
        start_date: z.string(),
        end_date: z.string(),
        location: z.string(),
        paragraph: z.string().optional(),
      }),
    ),
  }),
  z.object({
    type: z.literal("skills"),
    title: z.string().min(1, "Title is required"),
    groups: z.array(
      z.object({
        title: z.string(),
        items: z.array(z.string()),
      }),
    ),
  }),
  z.object({
    type: z.literal("experience"),
    title: z.string().min(1, "Title is required"),
    companies: z.array(
      z.object({
        company_name: z.string(),
        company_website: z.url().optional(),
        start_date: z.string(),
        end_date: z.string().optional(),
        roles: z.array(
          z.object({
            job_title: z.string(),
            employment_type: z.string().optional(),
            location: z.string().optional(),
            start_date: z.string().optional(),
            end_date: z.string().optional(),
            bullets: z.array(resumeBulletSchema),
          }),
        ),
      }),
    ),
  }),
  z.object({
    type: z.literal("list"),
    title: z.string().min(1, "Title is required"),
    items: z
      .array(
        z.object({
          title: z.string().optional(),
          url: z
            .string()
            .optional()
            .refine((val) => !val || z.url().safeParse(val).success, {
              message: "Must be a valid URL",
            }),
          description: z.string().min(1, "Description is required"),
          date: z.string().optional(),
        }),
      )
      .min(1, "Add at least one item to this section")
      .superRefine((items, ctx) => {
        items.forEach((item, index) => {
          if (item.url && (!item.title || item.title.trim() === "")) {
            ctx.addIssue({
              code: "custom",
              path: [index, "title"],
              message: "Title is required when URL is provided",
            })
          }
          if (!item.description || item.description.trim() === "") {
            ctx.addIssue({
              code: "custom",
              path: [index, "description"],
              message: "Description is required",
            })
          }
        })
      }),
  }),
])

export type ResumeSectionData = z.infer<typeof resumeSectionSchema>

export const linkSchema = z.object({
  label: z.string(),
  url: z.url(),
})

export const contactSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  role: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  links: z.array(linkSchema).default([]),
})

export const exportContactSchema = z.object({
  full_name: z.string().min(1),
  role: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  location: z.string().nullable(),
  links: z.array(linkSchema),
})

export const coverLetterExportContactSchema = z.object({
  full_name: z.string(),
  role: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  location: z.string().nullable(),
})

export const appSettingsSchema = z.object({
  /** Whether new resumes and cover letters start synced to the profile. */
  defaultSyncProfile: z.boolean(),
  /**
   * Title format for new resumes; see {@link renderTitle}.
   *
   * Bounded because settings round-trip through the export file, so an
   * unbounded format string would be restorable from an arbitrary file.
   */
  defaultResumeTitleFormat: z.string().min(1).max(120),
  /**
   * Export filename format for downloaded documents.
   *
   * Available tokens: {kind}, {title}, {date}, {dateShort}, {year}, {month}, {monthShort}, {day}.
   * Invalid filename characters (<>:"/\|?*) will be sanitized automatically.
   */
  defaultExportFilenameFormat: z.string().min(1).max(120),
  /**
   * PDF filename formats, one per document kind so resume and cover-letter
   * PDFs can be named differently. Supports `{title}` (filename-safe title,
   * falling back to the kind), `{kind}`, and the `{date}`, `{dateShort}`,
   * `{year}`, `{month}`, `{monthShort}`, `{day}` tokens. A `.pdf` suffix is
   * added on download unless the rendered name already ends with one.
   */
  defaultResumePdfFilenameFormat: z.string().min(1).max(120),
  defaultCoverLetterPdfFilenameFormat: z.string().min(1).max(120),
})

export type SettingsData = z.infer<typeof appSettingsSchema>

export const tagIdSchema = z.number().int().positive()

export const tagIdsSchema = z
  .array(tagIdSchema)
  .refine((tagIds) => new Set(tagIds).size === tagIds.length, "Tag IDs must be unique")

export const tagSchema = z.object({
  id: tagIdSchema,
  name: z.string().min(1).max(50),
  description: z.string().max(240).optional().nullable(),
  normalizedName: z.string().min(1),
  colour: z.string().regex(/^#?(?:[0-9a-f]{3}|[0-9a-f]{6})$/i),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export const resumeSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().min(1, "Title is required"),
  sections: z.array(resumeSectionSchema),
  createdAt: z.iso.datetime().optional(),
  updatedAt: z.iso.datetime().optional(),
  syncProfile: z.boolean().optional(),
  contact: contactSchema.nullable().optional(),
})

export type ResumeData = z.infer<typeof resumeSchema>

export const resumePayloadSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().min(1, "Title is required"),
  contact: contactSchema.nullable().optional(),
  sections: z.array(resumeSectionSchema),
})

export type ResumePayloadData = z.infer<typeof resumePayloadSchema>

export const coverLetterSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().min(1, "Title is required"),
  subject: z.string().max(160, "Subject must be 160 characters or less").optional().nullable(),
  date: z.string().optional().nullable(),
  body: z.string().min(1, "Body is required"),
  createdAt: z.iso.datetime().optional(),
  updatedAt: z.iso.datetime().optional(),
  syncProfile: z.boolean().optional(),
  contact: contactSchema.nullable().optional(),
})

export type CoverLetterData = z.infer<typeof coverLetterSchema>

export const coverLetterPayloadSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().min(1, "Title is required"),
  subject: z.string().max(160).optional().nullable(),
  date: z.string().optional().nullable(),
  contact: contactSchema.nullable().optional(),
  body: z.string().min(1, "Body is required"),
})

export type CoverLetterPayloadData = z.infer<typeof coverLetterPayloadSchema>
