import { z } from 'zod'

export const resumeBulletSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), text: z.string() }),
  z.object({
    type: z.literal('text-with-title'),
    title: z.string(),
    text: z.string(),
  }),
])

export const resumeSectionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('paragraph'),
    title: z.string().min(1, 'Title is required'),
    text: z.string(),
  }),
  z.object({
    type: z.literal('education'),
    title: z.string().min(1, 'Title is required'),
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
    type: z.literal('skills'),
    title: z.string().min(1, 'Title is required'),
    groups: z.array(
      z.object({
        title: z.string(),
        items: z.array(z.string()),
      }),
    ),
  }),
  z.object({
    type: z.literal('experience'),
    title: z.string().min(1, 'Title is required'),
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
])

export type ResumeSectionData = z.infer<typeof resumeSectionSchema>

export const linkSchema = z.object({
  label: z.string(),
  url: z.url(),
})

export const contactSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
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

export const resumeSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, 'Title is required'),
  sections: z.array(resumeSectionSchema).min(1, 'At least one section is required'),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  syncProfile: z.boolean().optional(),
  contact: contactSchema.nullable().optional(),
})

export type ResumeData = z.infer<typeof resumeSchema>

export const resumePayloadSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  contact: contactSchema.optional(),
  sections: z.array(resumeSectionSchema).min(1, 'At least one section is required'),
})

export type ResumePayloadData = z.infer<typeof resumePayloadSchema>
