import { useCallback, useEffect } from "react"
import { useBeforeUnload, useBlocker } from "react-router-dom"
import { useModal } from "@/components/modal"
import {
  UnsavedChangesDialog,
  type UnsavedChangesDialogData,
} from "@/components/UnsavedChangesDialog"
import { shouldBypassUnsavedChangesWarning } from "@/lib/unsavedChangesBypass"

// Hoisted so the options object keeps a stable identity; useModal's open/close
// callbacks are memoised on it, and a new object each render would churn them.
const modalOptions = { closeOnBackdropClick: false, closeOnEscape: true }

/**
 * Guards unsaved form edits against both in-app navigation and a full page
 * unload.
 *
 * In-app navigations go through react-router's blocker, which surfaces the
 * unsaved-changes dialog. Unloads (tab close, reload, navigating off the
 * origin) can't be intercepted, so they fall back to the browser's own prompt.
 *
 * `getIsDirty` is a getter rather than a boolean because react-router decides
 * whether to block at navigation time, which can be a tick or more after the
 * last render. A captured boolean would be stale by then, and a stale `true`
 * makes the guard challenge changes that were just saved.
 */
export function useUnsavedChangesWarning(getIsDirty: () => boolean) {
  const { open: openModal, close: closeModal } = useModal<UnsavedChangesDialogData>(
    UnsavedChangesDialog,
    modalOptions,
  )

  // Stable identity: useBlocker re-registers its callback in an effect, so a
  // callback that changed every render would be evaluated against values from
  // the previous commit.
  const shouldBlock = useCallback(
    () => getIsDirty() && !shouldBypassUnsavedChangesWarning(),
    [getIsDirty],
  )

  const blocker = useBlocker(shouldBlock)

  useBeforeUnload(
    useCallback(
      (event) => {
        if (!shouldBlock()) return
        event.preventDefault()
        // Browsers ignore custom text and show their own wording, but the
        // assignment is still required for the prompt to appear.
        event.returnValue = ""
      },
      [shouldBlock],
    ),
    { capture: true },
  )

  // Blocker transitions must not run during render, so the dialog's actions are
  // driven from here via the data passed to open().
  useEffect(() => {
    if (blocker.state !== "blocked") return

    openModal({
      onStay: () => {
        blocker.reset()
        closeModal()
      },
      onLeave: () => {
        blocker.proceed()
        closeModal()
      },
    })
  }, [blocker, openModal, closeModal])
}
