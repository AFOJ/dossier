/**
 * Lets app-initiated redirects past the unsaved-changes guard.
 *
 * react-router's blocker cannot tell a link click apart from a redirect the app
 * performs itself, and every form hook redirects as soon as a save succeeds.
 * The guard also can't simply consult the form: react-hook-form's `isDirty` is
 * a subscription value that `form.reset()` does not update synchronously, so a
 * reset immediately before `navigate()` still reads `true` when the router asks.
 *
 * The release is therefore sticky rather than scoped to the `navigate()` call.
 * It stays in effect until the router reports the destination, which is the
 * point at which the guard is moot anyway.
 */
let releasedForNavigation = false

/** Marks the next navigation as app-initiated, so the guard stands down. */
export function releaseUnsavedChangesGuard() {
  releasedForNavigation = true
}

/** Called once the navigation the guard was released for has landed. */
export function settleUnsavedChangesGuard() {
  releasedForNavigation = false
}

export function isUnsavedChangesGuardReleased() {
  return releasedForNavigation
}
