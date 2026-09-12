import { useCallback, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { useToast } from "@/components/toast"
import type { CoverLetter, Profile } from "@/db/db"
import { updateCoverLetter } from "@/db/coverLetter"
import { sanitizeCoverLetterBody } from "@/lib/coverLetterBody"
import {
  coverLetterFormSchema,
  emptyContactValues,
  profileToContactValues,
  type CoverLetterFormData,
} from "@/pages/cover-letters/create/hooks/useCreateCoverLetterForm"

export function useEditCoverLetterForm(letter: CoverLetter, profile?: Profile) {
  const toast = useToast()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const defaultValues = useMemo(() => toEditValues(letter, profile), [letter, profile])

  const form = useForm<CoverLetterFormData>({
    resolver: zodResolver(coverLetterFormSchema),
    defaultValues,
  })

  const isDirty = form.formState.isDirty

  const revert = useCallback(() => {
    form.reset(defaultValues)
  }, [form, defaultValues])

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      setIsSubmitting(true)
      form.clearErrors("root")

      await updateCoverLetter(letter.id!, {
        title: data.title,
        subject: data.subject?.trim() ? data.subject.trim() : null,
        signoff: data.signoff?.trim() ? data.signoff.trim() : null,
        body: sanitizeCoverLetterBody(data.body),
        syncProfile: data.syncProfile,
        contact: data.syncProfile
          ? null
          : {
              full_name: data.fullName ?? "",
              email: data.email || null,
              phone: data.phone || null,
              location: data.location || null,
              links: data.socials,
              role: data.jobTitle || null,
            },
      })

      form.reset(form.getValues())
      toast.success("Cover letter saved", `"${data.title}" has been saved.`)
      navigate("/cover-letters")
    } catch (error) {
      form.setError("root", {
        type: "manual",
        message: "Failed to save cover letter. Please try again.",
      })
      toast.error("Failed to save cover letter", "Please try again.")

      console.error("Failed to save cover letter:", error)
    } finally {
      setIsSubmitting(false)
    }
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

  return {
    form,
    isDirty,
    isSubmitting,
    revert,
    onSubmit,
    setSyncProfile,
    formError: form.formState.errors.root?.message,
  }
}

function toEditValues(letter: CoverLetter, profile?: Profile): CoverLetterFormData {
  return {
    title: letter.title,
    subject: letter.subject ?? "",
    signoff: letter.signoff ?? "",
    body: letter.body,
    syncProfile: letter.syncProfile ?? true,
    ...contactDefaults(letter, profile),
  }
}

function contactDefaults(letter: CoverLetter, profile?: Profile) {
  if (letter.contact && !letter.syncProfile) {
    return {
      fullName: letter.contact.full_name,
      jobTitle: letter.contact.role ?? "",
      location: letter.contact.location ?? "",
      phone: letter.contact.phone ?? "",
      email: letter.contact.email ?? "",
      socials: letter.contact.links.map((link) => {
        return {
          label: link.label,
          url: link.url,
        }
      }),
    }
  }

  return profile ? profileToContactValues(profile) : emptyContactValues()
}
