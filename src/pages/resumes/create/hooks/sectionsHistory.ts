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

type Noun =
  "section" | "company" | "role" | "bullet" | "school" | "skill group" | "skill" | "list item"

type ChildrenOf = (item: unknown) => {
  /** Property on the parent that holds the children, so it can be written back. */
  field: string
  items: readonly unknown[]
  noun: Noun
}

const NO_CHILDREN: ChildrenOf = () => ({ field: "", items: [], noun: "skill" })

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
      return { field: "institutions", items: section.institutions ?? [], noun: "school" }
    case "skills":
      return { field: "groups", items: section.groups ?? [], noun: "skill group" }
    case "list":
      return { field: "items", items: section.items ?? [], noun: "list item" }
    case "experience":
      return { field: "companies", items: section.companies ?? [], noun: "company" }
    case "paragraph":
      return { field: "", items: [], noun: "skill" }
  }
}

const companyChildren: ChildrenOf = (item) => ({
  field: "roles",
  items: (item as { roles?: unknown[] }).roles ?? [],
  noun: "role",
})

const roleChildren: ChildrenOf = (item) => ({
  field: "bullets",
  items: (item as { bullets?: unknown[] }).bullets ?? [],
  noun: "bullet",
})

// Skill entries are plain strings with no `_key`, so they are matched by
// position instead of identity.
const skillChildren: ChildrenOf = (item) => ({
  field: "items",
  items: (item as { items?: unknown[] }).items ?? [],
  noun: "skill",
})

function childrenOfFor(noun: Noun): ChildrenOf {
  switch (noun) {
    case "section":
      return sectionChildren
    case "company":
      return companyChildren
    case "role":
      return roleChildren
    case "skill group":
      return skillChildren
    default:
      return NO_CHILDREN
  }
}

const NOUNS: Record<Noun, string> = {
  section: "section",
  company: "company",
  role: "role",
  bullet: "bullet",
  school: "school",
  "skill group": "skill group",
  skill: "skill",
  "list item": "list item",
}

function keyOf(item: unknown): string {
  const key = (item as Keyed)._key
  return typeof key === "string" ? key : `~${String(key)}`
}

function hasKey(item: unknown): boolean {
  return typeof (item as Keyed)._key === "string"
}

/**
 * Keys for one level of the tree.
 *
 * Keyed items are identified by their `_key`. Unkeyed ones (skill strings) get
 * a positional token instead, so a list of them still reads as length-sensitive
 * rather than collapsing to a single indistinguishable entry.
 */
function keysAt(items: readonly unknown[]): string[] {
  return items.map((item, index) => (hasKey(item) ? keyOf(item) : `#${index}`))
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

  out.push(...keysAt(items))

  for (const item of items) {
    const child = childrenOf(item)
    collectKeys(child.items, child.noun, out)
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

  if (added > 0) {
    return `${added === 1 ? "add" : `add ${added}`} ${plural(noun, added)}`
  }

  return "edit sections"
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
  const beforeKeys = keysAt(before)
  const afterKeys = keysAt(after)
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

function replayList(target: readonly unknown[], live: readonly unknown[], noun: Noun): unknown[] {
  const useIdentity = target.length > 0 && target.every(hasKey)

  if (!useIdentity) {
    // Unkeyed entries (skill strings) have no identity, so the target's length
    // wins and live content is kept wherever the positions line up.
    const merged = live.slice(0, target.length)

    return target.length > live.length ? [...merged, ...target.slice(live.length)] : merged
  }

  const liveByKey = new Map<string, unknown>()
  for (const item of live) {
    liveByKey.set(keyOf(item), item)
  }

  const childrenOf = childrenOfFor(noun)

  return target.map((item) => {
    const matched = liveByKey.get(keyOf(item))

    if (matched === undefined) {
      return item
    }

    const targetChildren = childrenOf(item)
    const liveChildren = childrenOf(matched)

    if (targetChildren.field === "") {
      return matched
    }

    return {
      ...matched,
      [targetChildren.field]: replayList(
        targetChildren.items,
        liveChildren.items,
        targetChildren.noun,
      ),
    }
  })
}

/**
 * Rebuilds the target's structure while keeping the content of anything that
 * still exists in `live`.
 *
 * Restoring a raw snapshot would discard text typed after the change was
 * recorded — the snapshot is a whole-tree copy, so every unrelated edit made
 * since then would be rolled back along with the structural change.
 */
export function replaySections(
  target: readonly FormSection[],
  live: readonly FormSection[],
): FormSection[] {
  return replayList(target, live, "section") as FormSection[]
}
