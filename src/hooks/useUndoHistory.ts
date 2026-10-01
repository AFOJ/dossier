import { useCallback, useMemo, useState } from "react"

const LIMIT = 50

type UndoEntry<T> = { label: string; value: T }

type History<T> = {
  past: UndoEntry<T>[]
  future: UndoEntry<T>[]
}

const EMPTY: History<never> = { past: [], future: [] }

export type UndoHistory<T> = {
  record: (label: string, value: T) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  nextUndoLabel: string | null
  nextRedoLabel: string | null
  clear: () => void
}

/**
 * A LIFO undo stack.
 *
 * Order is deliberately strict: undoing pops the most recent entry, which is
 * what keeps index-based values coherent, since any later change has already
 * been rolled back by the time an earlier one is replayed.
 */
export function useUndoHistory<T>(options: {
  read: () => T
  apply: (value: T) => void
}): UndoHistory<T> {
  const { read, apply } = options
  const [history, setHistory] = useState<History<T>>(EMPTY)

  const record = useCallback((label: string, value: T) => {
    setHistory((current) => ({
      past: [...current.past, { label, value }].slice(-LIMIT),
      future: [],
    }))
  }, [])

  const undo = useCallback(() => {
    const entry = history.past[history.past.length - 1]
    if (!entry) {
      return
    }

    // Captured before `apply`, so redo replays the state the action produced.
    const inverse: UndoEntry<T> = { label: entry.label, value: read() }

    apply(entry.value)
    setHistory({
      past: history.past.slice(0, -1),
      future: [...history.future, inverse],
    })
  }, [apply, history, read])

  const redo = useCallback(() => {
    const entry = history.future[history.future.length - 1]
    if (!entry) {
      return
    }

    const inverse: UndoEntry<T> = { label: entry.label, value: read() }

    apply(entry.value)
    setHistory({
      past: [...history.past, inverse],
      future: history.future.slice(0, -1),
    })
  }, [apply, history, read])

  const clear = useCallback(() => {
    setHistory(EMPTY)
  }, [])

  return useMemo(
    () => ({
      record,
      undo,
      redo,
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
      nextUndoLabel: history.past[history.past.length - 1]?.label ?? null,
      nextRedoLabel: history.future[history.future.length - 1]?.label ?? null,
      clear,
    }),
    [clear, history.future, history.past, redo, record, undo],
  )
}
