import type { FormSection } from "@/pages/resumes/create/hooks/useCreateResumeForm"

/**
 * Identity-based snapshotting for the section tree.
 *
 * Every list item carries a stable `_key`, so the ordered list of keys is a
 * fingerprint of the tree's *shape*. Editing text never changes it, while
 * adding, removing or reordering an item always does. That difference is how
 * the undo stack tells a structural action apart from a keystroke.
 */

type Keyed = { _key?: unknown }

type Noun = "section" | "company" | "role" | "bullet" | "school" | "skill group" | "list item"

type ChildrenOf = (item: unknown) => { items: readonly unknown[]; noun: Noun }

const NOUNS: Record<Noun, string> = {
  section: "section",
  company: "company",
  role: "role",
  bullet: "bullet",
  school: "school",
  "skill group": "skill group",
  "list item": "list item",
}

const NO_CHILDREN: ChildrenOf = () => ({ items: [], noun: "bullet" })

const sectionChildren: ChildrenOf = (item) => {
  const section = item as {
    type: FormSection["type"]
    companies?: unknown[]
    institutions?: unknown[]
    groups?: unknown[]
    items?: unknown[]
  }

  switch (section.type) {
    case "education":
      return { items: section.institutions ?? [], noun: "school" }
    case "skills":
      return { items: section.groups ?? [], noun: "skill group" }
    case "list":
      return { items: section.items ?? [], noun: "list item" }
    case "experience":
      return { items: section.companies ?? [], noun: "company" }
    case "paragraph":
      return { items: [], noun: "bullet" }
  }
}

const companyChildren: ChildrenOf = (item) => ({
  items: (item as { roles?: unknown[] }).roles ?? [],
  noun: "role",
})

const roleChildren: ChildrenOf = (item) => ({
  items: (item as { bullets?: unknown[] }).bullets ?? [],
  noun: "bullet",
})

function childrenOfFor(noun: Noun): ChildrenOf {
  switch (noun) {
    case "section":
      return sectionChildren
    case "company":
      return companyChildren
    case "role":
      return roleChildren
    default:
      return NO_CHILDREN
  }
}

function keyOf(item: unknown): string {
  const key = (item as Keyed)._key
  return typeof key === "string" ? key : `~${String(key)}`
}

function plural(noun: Noun, count: number): string {
  if (count === 1) {
    return NOUNS[noun]
  }

  if (noun === "skill group") {
    return "skill groups"
  }

  return `${NOUNS[noun]}s`
}

function collectKeys(items: readonly unknown[], noun: Noun, out: string[]): void {
  const childrenOf = childrenOfFor(noun)

  for (const item of items) {
    out.push(keyOf(item))

    const childNoun = childrenOf(item).noun
    collectKeys(childrenOf(item).items, childNoun, out)
  }
}

/**
 * A fingerprint of the tree's shape. Two trees with the same signature hold the
 * same items in the same order at every depth, whatever their contents.
 */
export function sectionsSignature(sections: readonly FormSection[]): string {
  const keys: string[] = []
  collectKeys(sections, "section", keys)

  return keys.join("|")
}

function countDelta(beforeKeys: string[], afterKeys: string[], noun: Noun): string {
  const after = new Set(afterKeys)
  const before = new Set(beforeKeys)

  const removed = beforeKeys.filter((key) => !after.has(key)).length
  const added = afterKeys.filter((key) => !before.has(key)).length

  if (removed > 0) {
    return `${removed === 1 ? "delete" : `delete ${removed}`} ${plural(noun, removed)}`
  }

  return `${added === 1 ? "add" : `add ${added}`} ${plural(noun, added)}`
}

/**
 * Reports the shallowest structural difference, so adding an experience
 * section reads as "add section" rather than counting the company it brings
 * along. Descends only through items present in both trees, which is what keeps
 * a reorder at depth distinguishable from a removal above it.
 */
function diffAtLevel(
  before: readonly unknown[],
  after: readonly unknown[],
  noun: Noun,
): string | null {
  const beforeKeys = before.map(keyOf)
  const afterKeys = after.map(keyOf)
  const childrenOf = childrenOfFor(noun)

  const shared = Math.min(beforeKeys.length, afterKeys.length)

  for (let index = 0; index < shared; index += 1) {
    if (beforeKeys[index] !== afterKeys[index]) {
      continue
    }

    const beforeChildren = childrenOf(before[index])
    const deeper = diffAtLevel(
      beforeChildren.items,
      childrenOf(after[index]).items,
      beforeChildren.noun,
    )

    if (deeper) {
      return deeper
    }
  }

  if (beforeKeys.length === afterKeys.length) {
    const sameOrder = beforeKeys.every((key, index) => key === afterKeys[index])

    return sameOrder ? null : `reorder ${plural(noun, beforeKeys.length)}`
  }

  return countDelta(beforeKeys, afterKeys, noun)
}

/**
 * Describes the first structural difference between two trees, for undo
 * tooltips.
 */
export function describeSectionsChange(
  before: readonly FormSection[],
  after: readonly FormSection[],
): string {
  return diffAtLevel(before, after, "section") ?? "edit sections"
}
