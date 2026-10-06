/**
 * Marks a navigation as app-initiated so the unsaved-changes guard stands down.
 *
 * react-router's blocker cannot tell a link click apart from a redirect the app
 * performs itself, and a form hook redirects as soon as a save succeeds. Timing
 * does not help either: by the time the blocker is consulted, `isSubmitting` has
 * already been cleared and `isDirty` may still read true for a tick.
 */
let bypassCount = 0

/** Runs `navigate` with the unsaved-changes guard temporarily released. */
export function navigateAllowingUnsavedChanges<T>(navigate: () => T): T {
  bypassCount += 1
  try {
    return navigate()
  } finally {
    bypassCount -= 1
  }
}

export function shouldBypassUnsavedChangesWarning() {
  return bypassCount > 0
}
