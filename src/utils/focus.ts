const focusableFieldSelector =
  'input:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), [contenteditable="true"]'

export function focusFirstInput(container: HTMLElement | null): boolean {
  const first = container?.querySelector<HTMLElement>(focusableFieldSelector)
  if (!first) {
    return false
  }

  first.focus()
  return true
}

export function focusLastRowInput(container: HTMLElement | null): boolean {
  if (!container) {
    return false
  }

  const children = Array.from(container.children)
  for (let i = children.length - 1; i >= 0; i--) {
    const child = children[i]
    if (child instanceof HTMLElement && child.matches("[data-row]")) {
      return focusFirstInput(child)
    }
  }

  return false
}