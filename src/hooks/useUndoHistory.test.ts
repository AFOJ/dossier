import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { useUndoHistory } from "@/hooks/useUndoHistory"

function setup(initial: string) {
  let value = initial

  const { result } = renderHook(() =>
    useUndoHistory<string>({
      read: () => value,
      apply: (next) => {
        value = next
      },
    }),
  )

  return {
    result,
    current: () => value,
    set: (next: string) => {
      value = next
    },
  }
}

describe("useUndoHistory", () => {
  it("starts with nothing to undo or redo", () => {
    const { result } = setup("a")

    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
    expect(result.current.nextUndoLabel).toBeNull()
  })

  it("restores the recorded value on undo", () => {
    const { result, current, set } = setup("start")

    act(() => result.current.record("delete section", "start"))
    act(() => set("deleted"))

    expect(current()).toBe("deleted")

    act(() => result.current.undo())

    expect(current()).toBe("start")
    expect(result.current.canUndo).toBe(false)
  })

  it("replays the value on redo", () => {
    const { result, current, set } = setup("start")

    act(() => result.current.record("delete section", "start"))
    act(() => set("deleted"))
    act(() => result.current.undo())

    act(() => result.current.redo())

    expect(current()).toBe("deleted")
  })

  it("keeps the action label available for tooltips", () => {
    const { result } = setup("start")

    act(() => result.current.record("delete bullet", "start"))

    expect(result.current.nextUndoLabel).toBe("delete bullet")
  })

  it("unwinds several actions in reverse order", () => {
    const { result, current, set } = setup("s0")

    act(() => result.current.record("add section", "s0"))
    act(() => set("s1"))
    act(() => result.current.record("add section", "s1"))
    act(() => set("s2"))

    act(() => result.current.undo())
    expect(current()).toBe("s1")

    act(() => result.current.undo())
    expect(current()).toBe("s0")
  })

  it("discards the redo branch once a new action is recorded", () => {
    const { result, current, set } = setup("s0")

    act(() => result.current.record("add section", "s0"))
    act(() => set("s1"))
    act(() => result.current.undo())

    expect(result.current.canRedo).toBe(true)

    act(() => result.current.record("add section", "s0"))
    act(() => set("s1-with-another"))

    expect(result.current.canRedo).toBe(false)
    expect(current()).toBe("s1-with-another")
  })

  it("caps the stack and drops the oldest entry", () => {
    const { result, current, set } = setup("v0")

    for (let index = 1; index <= 60; index += 1) {
      const previous = current()
      act(() => result.current.record("add section", previous))
      act(() => set(`v${index}`))
    }

    for (let step = 0; step < 60; step += 1) {
      act(() => result.current.undo())
    }

    // Only the newest 50 survive, so undo stops at v10 rather than v0.
    expect(current()).toBe("v10")
    expect(result.current.canUndo).toBe(false)
  })

  it("empties both stacks on clear", () => {
    const { result, current, set } = setup("s0")

    act(() => result.current.record("add section", "s0"))
    act(() => set("s1"))
    act(() => result.current.undo())
    act(() => result.current.clear())

    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
    expect(current()).toBe("s0")
  })
})
