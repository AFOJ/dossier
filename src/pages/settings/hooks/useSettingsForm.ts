import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { appSettingsSchema } from "@/db/schemas"
import { upsertSettings } from "@/db/settings"
import { useSettings } from "@/hooks/useSettings"
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning"
import { renderTitle } from "@/lib/titleFormat"
import type { Profile } from "@/db/db"

export function useSettingsForm(profile: Profile | undefined) {
  const { settings } = useSettings()

  const form = useForm({
    resolver: zodResolver(appSettingsSchema),
    defaultValues: settings,
  })

  useUnsavedChangesWarning(() => form.formState.isDirty)

  const titleFormat = form.watch("defaultResumeTitleFormat")

  const onSubmit = form.handleSubmit(async (data) => {
    await upsertSettings(data)
    // Re-baseline so the saved values read as pristine rather than as edits.
    form.reset(data)
  })

  return {
    form,
    onSubmit,
    titleFormat,
    previewTitle: renderTitle(titleFormat, { profile }),
  }
}
