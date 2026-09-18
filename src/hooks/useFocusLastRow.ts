import { useLayoutEffect, useRef } from "react"
import { focusLastRowInput } from "@/utils/focus"

export function useFocusLastRow<T extends HTMLElement = HTMLDivElement>(count: number) {
  const containerRef = useRef<T | null>(null)
  const previousCount = useRef(count)

  useLayoutEffect(() => {
    if (count > previousCount.current && count > 0) {
      focusLastRowInput(containerRef.current)
    }
    previousCount.current = count
  }, [count])

  return containerRef
}