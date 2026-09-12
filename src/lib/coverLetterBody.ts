const ALLOWED_TAGS = new Set(["p", "br", "strong", "b", "u", "a"])

function isSafeHref(href: string): boolean {
  const trimmed = href.trim()
  return (
    trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("mailto:")
  )
}

export function sanitizeCoverLetterBody(html: string): string {
  if (!html) {
    return ""
  }
  const doc = new DOMParser().parseFromString(html, "text/html")
  const body = doc.body

  const walk = (node: Node): void => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.COMMENT_NODE) {
        node.removeChild(child)
        continue
      }
      if (child.nodeType === Node.TEXT_NODE) {
        continue
      }
      if (child.nodeType !== Node.ELEMENT_NODE) {
        node.removeChild(child)
        continue
      }
      const element = child as Element
      const tag = element.tagName.toLowerCase()
      if (!ALLOWED_TAGS.has(tag)) {
        walk(element)
        while (element.firstChild) {
          node.insertBefore(element.firstChild, element)
        }
        node.removeChild(element)
        continue
      }
      for (const attr of Array.from(element.attributes)) {
        if (tag === "a" && attr.name.toLowerCase() === "href" && isSafeHref(attr.value)) {
          continue
        }
        element.removeAttribute(attr.name)
      }
      walk(element)
    }
  }

  walk(body)
  return body.innerHTML
}

export function isCoverLetterBodyEmpty(html: string): boolean {
  if (!html || html.trim() === "") {
    return true
  }
  const doc = new DOMParser().parseFromString(html, "text/html")
  const text = (doc.body.textContent ?? "").replace(/\u00a0/g, " ").trim()
  if (text !== "") {
    return false
  }
  // A link with no text but a valid href still counts as content.
  return doc.body.querySelector("a[href]") === null
}
