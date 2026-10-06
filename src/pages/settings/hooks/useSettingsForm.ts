import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { appSettingsSchema } from "@/db/schemas"
import { upsertSettings } from "@/db/settings"
import { useSettings } from "@/hooks/useSettings"
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning"
import { renderTitle } from "@/lib/titleFormat"
import { useToast } from "@/components/toast"
import type { Profile } from "@/db/db"

export function useSettingsForm(profile: Profile | undefined) {
  const { settings, isLoaded } = useSettings()
  const toast = useToast()

  const form = useForm({
    resolver: zodResolver(appSettingsSchema),
    defaultValues: settings,
  })

  useUnsavedChangesWarning(() => form.formState.isDirty)

  const titleFormat = form.watch("defaultResumeTitleFormat")

  // When settings load (after initial load or when they change), reset the form
  // to keep it in sync with the stored settings.
  useEffect(() => {
    if (isLoaded) {
      form.reset(settings)
    }
  }, [settings, isLoaded, form])

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await upsertSettings(data)
      // Re-baseline so the saved values read as pristine rather than as edits.
      form.reset(data)
      toast.success("Settings saved", "Your preferences have been updated.")
    } catch (error) {
      toast.error("Failed to save settings", "Please try again.")
      console.error("Failed to save settings:", error)
    }
  })

  return {
    form,
    onSubmit,
    titleFormat,
    previewTitle: renderTitle(titleFormat, { profile }),
  }
}
