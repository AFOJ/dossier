import { useCallback, useMemo, useRef, useState } from "react"

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

  // Mutations read and write this alongside state, so two calls landing in the
  // same tick both act on the latest stack rather than a render-captured copy.
  const historyRef = useRef<History<T>>(EMPTY)

  const commit = useCallback((next: History<T>) => {
    historyRef.current = next
    setHistory(next)
  }, [])

  const record = useCallback(
    (label: string, value: T) => {
      const current = historyRef.current
      commit({
        past: [...current.past, { label, value }].slice(-LIMIT),
        future: [],
      })
    },
    [commit],
  )

  const undo = useCallback(() => {
    const current = historyRef.current
    const entry = current.past[current.past.length - 1]

    if (!entry) {
      return
    }

    // Captured before `apply`, so redo replays the state the action produced.
    const inverse: UndoEntry<T> = { label: entry.label, value: read() }

    commit({
      past: current.past.slice(0, -1),
      future: [...current.future, inverse],
    })
    apply(entry.value)
  }, [apply, commit, read])

  const redo = useCallback(() => {
    const current = historyRef.current
    const entry = current.future[current.future.length - 1]

    if (!entry) {
      return
    }

    const inverse: UndoEntry<T> = { label: entry.label, value: read() }

    commit({
      past: [...current.past, inverse],
      future: current.future.slice(0, -1),
    })
    apply(entry.value)
  }, [apply, commit, read])

  const clear = useCallback(() => {
    commit(EMPTY)
  }, [commit])

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
