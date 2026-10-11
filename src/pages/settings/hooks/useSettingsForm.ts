import { useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { appSettingsSchema } from "@/db/schemas"
import { upsertSettings } from "@/db/settings"
import { useSettings } from "@/hooks/useSettings"
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning"
import { useToast } from "@/components/toast"

export function useSettingsForm() {
  const { settings, isLoaded } = useSettings()
  const toast = useToast()

  const form = useForm({
    resolver: zodResolver(appSettingsSchema),
    defaultValues: settings,
  })

  useUnsavedChangesWarning(() => form.formState.isDirty)

  const initialized = useRef(false)

  useEffect(() => {
    // The form's defaultValues came from the first read, which may still have
    // been the placeholder defaults, so swap in the real row once it lands.
    // Later arrivals must not clobber the visitor's edits: values they have
    // already changed are kept, so a click made before the read resolved is not
    // rolled back by it.
    if (isLoaded && !initialized.current) {
      initialized.current = true
      form.reset(settings, { keepDirtyValues: true })
    }
  }, [form, isLoaded, settings])

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await upsertSettings(data)
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
  }
}
