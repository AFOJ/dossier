import { useCallback, useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useToast } from "@/components/toast"
import type { Profile } from "@/db/db"
import { createCoverLetter } from "@/db/coverLetter"
import { isCoverLetterBodyEmpty, sanitizeCoverLetterBody } from "@/lib/coverLetterBody"

export const coverLetterFormSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    subject: z.string().max(160, "Subject must be 160 characters or less").optional(),
    signoff: z.string().max(120, "Sign-off must be 120 characters or less").optional(),
    body: z.string().min(1, "Body is required"),
    syncProfile: z.boolean(),
    fullName: z.string().optional(),
    jobTitle: z.string().optional(),
    location: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    socials: z.array(
      z.object({
        label: z.string(),
        url: z.string(),
      }),
    ),
  })
  .superRefine((data, ctx) => {
    if (isCoverLetterBodyEmpty(data.body ?? "")) {
      ctx.addIssue({
        code: "custom",
        path: ["body"],
        message: "Body cannot be empty",
      })
    }

    if (data.syncProfile) {
      return
    }

    if ((data.fullName ?? "").trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["fullName"],
        message: "Full name is required",
      })
    }

    const email = data.email ?? ""
    if (email !== "" && !z.email().safeParse(email).success) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: "Invalid email address",
      })
    }

    data.socials.forEach((social, index) => {
      if (social.label.trim() === "") {
        ctx.addIssue({
          code: "custom",
          path: ["socials", index, "label"],
          message: "Label is required",
        })
      }

      if (!z.url().safeParse(social.url).success) {
        ctx.addIssue({
          code: "custom",
          path: ["socials", index, "url"],
          message: "Must be a valid URL",
        })
      }
    })
  })

export type CoverLetterFormData = z.infer<typeof coverLetterFormSchema>

export function emptyContactValues() {
  return {
    fullName: "",
    jobTitle: "",
    location: "",
    phone: "",
    email: "",
    socials: [] as { label: string; url: string }[],
  }
}

export function profileToContactValues(profile: Profile) {
  return {
    fullName: profile.full_name,
    jobTitle: profile.role ?? "",
    location: profile.location ?? "",
    phone: profile.phone ?? "",
    email: profile.email ?? "",
    socials: profile.links.map((link) => {
      return {
        label: link.label,
        url: link.url,
      }
    }),
  }
}

export function useCreateCoverLetterForm(profile?: Profile) {
  const toast = useToast()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CoverLetterFormData>({
    resolver: zodResolver(coverLetterFormSchema),
    defaultValues: {
      title: "",
      subject: "",
      signoff: "",
      body: "",
      syncProfile: true,
      ...(profile ? profileToContactValues(profile) : emptyContactValues()),
    },
  })

  const { setValue } = form

  const setSyncProfile = useCallback(
    (sync: boolean) => {
      setValue("syncProfile", sync, { shouldDirty: true })

      if (sync && profile) {
        Object.entries(profileToContactValues(profile)).forEach(([key, value]) => {
          ;(
            form as unknown as {
              setValue: (name: string, value: unknown) => void
            }
          ).setValue(key, value)
        })
      }
    },
    [form, profile, setValue],
  )

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      setIsSubmitting(true)
      form.clearErrors("root")

      const contact = data.syncProfile
        ? null
        : {
            full_name: data.fullName ?? "",
            email: data.email || null,
            phone: data.phone || null,
            location: data.location || null,
            links: data.socials,
            role: data.jobTitle || null,
          }

      await createCoverLetter(
        {
          title: data.title,
          subject: data.subject?.trim() ? data.subject.trim() : null,
          signoff: data.signoff?.trim() ? data.signoff.trim() : null,
          body: sanitizeCoverLetterBody(data.body),
        },
        {
          syncProfile: data.syncProfile,
          contact,
        },
      )

      toast.success("Cover letter created", `"${data.title}" has been created.`)
      navigate("/cover-letters")
    } catch (error) {
      form.setError("root", {
        type: "manual",
        message: "Failed to create cover letter. Please try again.",
      })
      toast.error("Failed to create cover letter", "Please try again.")

      console.error("Failed to create cover letter:", error)
    } finally {
      setIsSubmitting(false)
    }
  })

  return {
    form,
    onSubmit,
    isSubmitting,
    formError: form.formState.errors.root?.message,
    setSyncProfile,
  }
}
