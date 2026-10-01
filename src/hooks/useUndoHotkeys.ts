import { useEffect } from "react"

/**
 * Text fields keep their own native undo history, so a global shortcut would
 * fight the browser for the same keystroke. Anything focused inside an editable
 * region is left alone.
 */
function isTextEditing(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (target.isContentEditable) {
    return true
  }

  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT"
}

type UndoHotkeyOptions = {
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
}

export function useUndoHotkeys(options: UndoHotkeyOptions) {
  const { onUndo, onRedo, canUndo, canRedo } = options

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTextEditing(event.target)) {
        return
      }

      if (event.altKey || (!event.metaKey && !event.ctrlKey)) {
        return
      }

      const key = event.key.toLowerCase()

      const isUndo = key === "z" && !event.shiftKey
      const isRedo = (key === "z" && event.shiftKey) || (key === "y" && !event.shiftKey)

      if (!isUndo && !isRedo) {
        return
      }

      if (isUndo ? !canUndo : !canRedo) {
        return
      }

      event.preventDefault()

      if (isUndo) {
        onUndo()
      } else {
        onRedo()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [canRedo, canUndo, onRedo, onUndo])
}
