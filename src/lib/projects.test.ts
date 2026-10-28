import { zipSync } from "fflate"
import { extractResumeJsonFiles } from "@/lib/zipImport"
import { describe, it, expect } from "vitest"
import { resumeSectionSchema } from "@/db/schemas"
import { createResume, getResume } from "@/db/resume"
import { toResumePayload } from "@/lib/resumePayload"
import { toResumeExportPayload } from "@/lib/resumeExport"
import { parseResumeJsonText } from "@/pages/resumes/upload/hooks/parseResumeJsonFile"
import { parseApiValidationErrors } from "@/lib/api"
import {
  sectionsSignature,
  describeSectionsChange,
  replaySections,
} from "@/pages/resumes/create/hooks/sectionsHistory"
import {
  withKey,
  type FormSection,
  type ProjectsSectionErrors,
} from "@/pages/resumes/create/hooks/useCreateResumeForm"

const project = { name: "Dashboard", technologies: [], bullets: [] }
const section = { type: "projects" as const, title: "Projects", projects: [project] }

describe("projects integration", () => {
  it("requires a title, a project name, arrays, and at least one project", () => {
    expect(resumeSectionSchema.safeParse(section).success).toBe(true)
    for (const invalid of [
      { ...section, title: " " },
      { ...section, projects: [] },
      { ...section, projects: [{ ...project, name: " " }] },
      { ...section, projects: [{ name: "Missing arrays" }] },
      { ...section, projects: [{ ...project, url: "invalid" }] },
    ]) {
      expect(resumeSectionSchema.safeParse(invalid).success).toBe(false)
    }
    for (const bullet of [
      { type: "text", text: " " },
      { type: "text-with-title", title: "", text: "Impact" },
    ]) {
      expect(
        resumeSectionSchema.safeParse({ ...section, projects: [{ ...project, bullets: [bullet] }] })
          .success,
      ).toBe(false)
    }
  })

  it.each([
    [undefined, undefined],
    ["2024", undefined],
    [undefined, "03-2024"],
    [undefined, "Present"],
    [" ", "Present"],
    [undefined, "In progress"],
    ["2024", "In progress"],
    ["2024", "2024"],
    ["Summer 2024", "Present"],
    [" 03-2024 ", " Autumn 2025 "],
    ["", " "],
  ])("round trips dates %s / %s and emits required empty arrays", async (start_date, end_date) => {
    const id = await createResume(
      "Projects resume",
      [{ ...section, projects: [{ ...project, start_date, end_date, url: " " }] }],
      { syncProfile: false },
    )
    const saved = (await getResume(id))!
    const exported = JSON.parse(JSON.stringify(toResumeExportPayload(saved)))
    expect(resumeSectionSchema.parse(exported.sections[0])).toEqual(
      JSON.parse(JSON.stringify(saved.sections[0])),
    )
    const imported = parseResumeJsonText(JSON.stringify(exported), "resume.json")
    expect(imported.success).toBe(true)
    if (!imported.success) throw new Error(imported.error)
    expect(imported.resume.sections).toEqual(exported.sections)
    const payload = JSON.parse(JSON.stringify(await toResumePayload(imported.resume)))
    expect(payload.sections[0]).toEqual({
      type: "projects",
      title: "Projects",
      projects: [
        {
          ...project,
          ...(start_date?.trim() ? { start_date: start_date.trim() } : {}),
          ...(end_date?.trim()
            ? {
                end_date: ["Present", "In progress"].includes(end_date.trim())
                  ? start_date?.trim()
                    ? "Present"
                    : "In progress"
                  : end_date.trim(),
              }
            : {}),
        },
      ],
    })
  })

  it("strips editor keys and preserves links, technologies, and both bullet types", async () => {
    const entry = withKey({
      ...project,
      url: " https://github.com/example ",
      technologies: ["React", "TypeScript"],
      bullets: [
        withKey({ type: "text" as const, text: "Built it" }),
        withKey({ type: "text-with-title" as const, title: "Impact", text: "Saved time" }),
      ],
    })
    const id = await createResume("Resume", [{ ...section, projects: [entry] }], {
      syncProfile: false,
    })
    const payload = await toResumePayload((await getResume(id))!)
    expect(JSON.stringify(payload)).not.toContain("_key")
    expect(payload.sections[0]).toMatchObject({
      projects: [
        {
          url: "https://github.com/example",
          technologies: ["React", "TypeScript"],
          bullets: [
            { type: "text", text: "Built it" },
            { type: "text-with-title", title: "Impact", text: "Saved time" },
          ],
        },
      ],
    })
  })

  it("merges errors across project fields, technologies, and multiple bullets in either order", () => {
    const details = [
      ["title", "Section title"],
      ["projects", "Projects required"],
      ["projects/0/name", "Name required"],
      ["projects/0/technologies/1", "Invalid technology"],
      ["projects/0/bullets", "Bullet list"],
      ["projects/0/bullets/0/title", "Heading required"],
      ["projects/0/bullets/0/text", "Text required"],
      ["projects/0/bullets/1/text", "Other text"],
    ].map(([path, message]) => ({ path: `/sections/0/${path}`, message }))
    for (const ordered of [details, [...details].reverse()]) {
      const result = parseApiValidationErrors(ordered)[0] as ProjectsSectionErrors
      expect(result.title?.message).toBe("Section title")
      expect(result.projects?.message).toBe("Projects required")
      expect(result.projects?.[0].name?.message).toBe("Name required")
      expect(result.projects?.[0].technologies?.[1].message).toBe("Invalid technology")
      expect(result.projects?.[0].bullets?.message).toBe("Bullet list")
      expect(result.projects?.[0].bullets?.[0]).toEqual({
        title: { message: "Heading required" },
        text: { message: "Text required" },
      })
      expect(result.projects?.[0].bullets?.[1].text?.message).toBe("Other text")
    }
  })

  it("tracks project and technology structure and replays bullets while keeping live text", () => {
    const entry = withKey({
      ...project,
      technologies: ["React", "TypeScript"],
      bullets: [withKey({ type: "text" as const, text: "Initial" })],
    })
    const before: FormSection[] = [withKey({ ...section, projects: [entry] })]
    const after: FormSection[] = [
      {
        ...before[0],
        type: "projects",
        projects: [
          {
            ...entry,
            technologies: ["TypeScript", "React"],
            bullets: [{ ...entry.bullets[0], text: "Updated" }],
          },
        ],
      },
    ]
    expect(sectionsSignature(before)).not.toBe(sectionsSignature(after))
    expect(describeSectionsChange(before, after)).toBe("reorder technologies")
    expect(replaySections(before, after)[0]).toMatchObject({
      projects: [{ technologies: ["React", "TypeScript"], bullets: [{ text: "Updated" }] }],
    })
  })
})

it("imports old list and skills sections without changing their data", () => {
  const sections = [
    {
      type: "skills",
      title: "Skills",
      groups: [{ title: "Tools", items: ["React", "React", "TypeScript"] }],
    },
    {
      type: "list",
      title: "Projects",
      items: [{ title: "Old project", description: "Existing content", date: "2024" }],
    },
  ]
  const result = parseResumeJsonText(
    JSON.stringify({ title: "Old export", sections }),
    "old-resume.json",
  )
  expect(result.success).toBe(true)
  if (result.success) expect(result.resume.sections).toEqual(sections)
})

it("tracks skill reordering in undo without changing the stored string array", () => {
  const group = withKey({ title: "Tools", items: ["React", "TypeScript"] })
  const before: FormSection[] = [withKey({ type: "skills", title: "Skills", groups: [group] })]
  const after: FormSection[] = [
    { ...before[0], type: "skills", groups: [{ ...group, items: ["TypeScript", "React"] }] },
  ]
  expect(sectionsSignature(before)).not.toBe(sectionsSignature(after))
  expect(describeSectionsChange(before, after)).toBe("reorder skills")
  expect(replaySections(before, after)[0]).toMatchObject({
    groups: [{ items: ["React", "TypeScript"] }],
  })
})

it("imports a ZIP entry containing exported projects and preserves current-work state", async () => {
  const id = await createResume(
    "Projects",
    [{ ...section, projects: [{ ...project, end_date: "Present" }] }],
    { syncProfile: false },
  )
  const exported = toResumeExportPayload((await getResume(id))!)
  const bytes = zipSync({ "resume.json": new TextEncoder().encode(JSON.stringify(exported)) })
  const file = new File([bytes.buffer as ArrayBuffer], "resumes.zip", { type: "application/zip" })
  const { entries, skipped } = await extractResumeJsonFiles(file)
  expect(skipped).toEqual([])
  const imported = parseResumeJsonText(entries[0].text, entries[0].name)
  expect(imported.success).toBe(true)
  if (!imported.success) throw new Error(imported.error)
  expect(imported.resume.sections).toEqual(exported.sections)
  expect((await toResumePayload(imported.resume)).sections[0]).toMatchObject({
    projects: [{ end_date: "In progress", technologies: [], bullets: [] }],
  })
})
