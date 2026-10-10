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
    // Only initialize once: the form already has defaultValues from the first
    // settings read. Subsequent stored-settings arrivals must not clobber user
    // edits, so we skip resetting after the first load.
    if (isLoaded && !initialized.current) {
      initialized.current = true
    }
  }, [isLoaded, settings])

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
