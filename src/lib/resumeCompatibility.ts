import { resumeSectionSchema } from "@/db/schemas"

function hasUnpreservedFields(original: unknown, parsed: unknown): boolean {
  if (Array.isArray(original)) {
    return (
      !Array.isArray(parsed) ||
      original.some((entry, index) => hasUnpreservedFields(entry, parsed[index]))
    )
  }
  if (typeof original !== "object" || original === null) return false
  if (typeof parsed !== "object" || parsed === null) return true
  const parsedFields = parsed as Record<string, unknown>
  return Object.entries(original).some(
    ([field, value]) =>
      field !== "_key" &&
      (!(field in parsedFields) || hasUnpreservedFields(value, parsedFields[field])),
  )
}

export function getResumeCompatibilityIssue(sections: unknown): "invalid" | "unsupported" | null {
  if (!Array.isArray(sections)) return "invalid"
  for (const section of sections) {
    if (typeof section !== "object" || section === null || typeof section.type !== "string")
      return "invalid"
    if (!resumeSectionSchema.options.some((option) => option.shape.type.value === section.type))
      return "unsupported"
    const parsed = resumeSectionSchema.safeParse(section)
    if (!parsed.success) return "invalid"
    if (hasUnpreservedFields(section, parsed.data)) return "unsupported"
  }
  return null
}
