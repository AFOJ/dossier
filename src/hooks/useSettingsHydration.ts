import { useEffect, useRef } from "react"
import type { FieldValues, UseFormReturn } from "react-hook-form"

interface UseSettingsHydrationOptions<T extends FieldValues> {
  form: UseFormReturn<T>
  /**
   * False until the stored settings have been read. Hydration waits for it, so
   * a form that mounts mid-read is not left holding the placeholder defaults.
   */
  settingsLoaded: boolean
  /**
   * Applies the stored settings to the form's fields. Called at most once, and
   * only while the form is still pristine, so anything already typed is kept.
   */
  hydrate: (setValue: UseFormReturn<T>["setValue"]) => void
}

/**
 * Applies stored settings to a form once they have loaded.
 *
 * A form that mounts while the settings read is in flight has to start from
 * `DEFAULT_SETTINGS`, so without this it keeps the placeholder value for the
 * lifetime of the page — and on a settings form, saving would persist that
 * placeholder over the visitor's real choice.
 */
export function useSettingsHydration<T extends FieldValues>({
  form,
  settingsLoaded,
  hydrate,
}: UseSettingsHydrationOptions<T>): void {
  const hydrated = useRef(false)

  useEffect(() => {
    if (!settingsLoaded || hydrated.current) {
      return
    }
    hydrated.current = true

    if (form.formState.isDirty) {
      return
    }

    hydrate(form.setValue)
  }, [form, hydrate, settingsLoaded])
}
