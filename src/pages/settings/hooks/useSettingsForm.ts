import { useEffect } from "react"
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

  useEffect(() => {
    if (isLoaded) {
      form.reset(settings)
    }
  }, [settings, isLoaded, form])

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