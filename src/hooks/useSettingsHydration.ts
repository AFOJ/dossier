import { useEffect, useRef } from "react"
import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form"

export interface UseSettingsHydrationOptions<T extends FieldValues> {
  form: UseFormReturn<T>
  /**
   * False until the stored settings have been read. Hydration waits for it, so
   * a form that mounts mid-read is not left holding the placeholder defaults.
   */
  settingsLoaded: boolean
  /**
   * Applies the stored settings to the form's fields. Called at most once.
   * Fields the visitor has already changed are skipped, so hydration cannot roll
   * back anything entered before the settings arrived.
   */
  hydrate: (setUnlessDirty: (name: FieldPath<T>, value: unknown) => void) => void
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

    // dirtyFields is deeply partial to allow nested paths, so narrowing it to
    // the flat lookup these form fields need costs a cast.
    const dirtyFields = form.formState.dirtyFields as Record<string, boolean>

    hydrate((name, value) => {
      if (dirtyFields[name]) {
        return
      }

      // setValue pairs a field name with the type of that one field's value,
      // which cannot be expressed across a whole FieldPath union.
      form.setValue(name, value as never, { shouldDirty: false })
    })
  }, [form, hydrate, settingsLoaded])
}
