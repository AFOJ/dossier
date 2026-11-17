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
   * Fields the visitor has already changed or touched are skipped, so hydration
   * cannot replace an in-progress choice even if its value is back at the default.
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
  const { dirtyFields, touchedFields } = form.formState

  useEffect(() => {
    if (!settingsLoaded || hydrated.current) {
      return
    }
    hydrated.current = true

    // These forms hydrate only flat fields. React Hook Form types both maps as
    // deeply partial because other forms can contain nested paths.
    const dirty = dirtyFields as Record<string, boolean>
    const touched = touchedFields as Record<string, boolean>

    hydrate((name, value) => {
      if (dirty[name] || touched[name]) {
        return
      }

      // setValue pairs a field name with the type of that one field's value,
      // which cannot be expressed across a whole FieldPath union.
      form.setValue(name, value as never, { shouldDirty: false })
    })
  }, [dirtyFields, form, hydrate, settingsLoaded, touchedFields])
}
