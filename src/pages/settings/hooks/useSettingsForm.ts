import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { appSettingsSchema } from "@/db/schemas"
import { upsertSettings, type Settings } from "@/db/settings"
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning"
import { useToast } from "@/components/toast"

export function useSettingsForm(settings: Settings) {
  const toast = useToast()

  // The form's initial values are read once and never reconciled afterwards, so
  // if this mounts before the caller has the stored row, the form is stuck on
  // the placeholder defaults and saving writes those over the visitor's real
  // settings. Callers therefore render this only once settings have loaded.
  const form = useForm({
    resolver: zodResolver(appSettingsSchema),
    defaultValues: settings,
  })

  useUnsavedChangesWarning(() => form.formState.isDirty)

  const saveSettings = async (data: Settings) => {
    try {
      await upsertSettings(data)
      form.reset(data)
      toast.success("Settings saved", "Your preferences have been updated.")
    } catch (error) {
      toast.error("Failed to save settings", "Please try again.")
      console.error("Failed to save settings:", error)
    }
  }

  return {
    form,
    saveSettings,
  }
}
