import { describe, expect, it } from "vitest"
import {
  describeSectionsChange,
  sectionsSignature,
} from "@/pages/resumes/create/hooks/sectionsHistory"
import type { FormSection } from "@/pages/resumes/create/hooks/useCreateResumeForm"

function section(key: string, overrides: Partial<Record<string, unknown>> = {}): FormSection {
  return { type: "paragraph", title: "", text: "", _key: key, ...overrides } as FormSection
}

function company(key: string, roles: unknown[] = []): unknown {
  return { company_name: "", start_date: "", roles, _key: key }
}

function role(key: string, bullets: unknown[] = []): unknown {
  return { job_title: "", bullets, _key: key }
}

describe("sectionsSignature", () => {
  it("is empty for an empty tree", () => {
    expect(sectionsSignature([])).toBe("")
  })

  it("ignores text edits", () => {
    const before = [section("a", { text: "hello" })]
    const after = [section("a", { text: "hello world" })]

    expect(sectionsSignature(before)).toBe(sectionsSignature(after))
  })

  it("ignores title and contact text", () => {
    const before = [section("a", { title: "Experience" })]
    const after = [section("a", { title: "Work history" })]

    expect(sectionsSignature(before)).toBe(sectionsSignature(after))
  })

  it("changes when a section is added", () => {
    expect(sectionsSignature([section("a")])).not.toBe(
      sectionsSignature([section("a"), section("b")]),
    )
  })

  it("changes when a section is removed", () => {
    expect(sectionsSignature([section("a"), section("b")])).not.toBe(
      sectionsSignature([section("a")]),
    )
  })

  it("changes when sections are reordered", () => {
    expect(sectionsSignature([section("a"), section("b")])).not.toBe(
      sectionsSignature([section("b"), section("a")]),
    )
  })

  it("changes when a nested bullet is removed", () => {
    const before = [
      {
        type: "experience",
        title: "",
        companies: [company("c1", [role("r1", [{ type: "text", text: "x", _key: "b1" }])])],
        _key: "s1",
      },
    ] as unknown as FormSection[]

    const after = [
      {
        type: "experience",
        title: "",
        companies: [company("c1", [role("r1", [])])],
        _key: "s1",
      },
    ] as unknown as FormSection[]

    expect(sectionsSignature(before)).not.toBe(sectionsSignature(after))
  })
})

describe("describeSectionsChange", () => {
  it("describes an added section", () => {
    expect(describeSectionsChange([section("a")], [section("a"), section("b")])).toBe("add section")
  })

  it("counts one addition for a section that brings children with it", () => {
    const after = [
      {
        type: "experience",
        title: "",
        companies: [company("c1", [])],
        _key: "s1",
      },
    ] as unknown as FormSection[]

    // The company arrives with the section but must not inflate the count.
    expect(describeSectionsChange([], after)).toBe("add section")
  })

  it("describes a removed section", () => {
    expect(describeSectionsChange([section("a"), section("b")], [section("a")])).toBe(
      "delete section",
    )
  })

  it("counts multiple removals", () => {
    expect(describeSectionsChange([section("a"), section("b"), section("c")], [section("c")])).toBe(
      "delete 2 sections",
    )
  })

  it("describes a reorder", () => {
    expect(describeSectionsChange([section("a"), section("b")], [section("b"), section("a")])).toBe(
      "reorder sections",
    )
  })

  it("attributes a nested removal to the nested noun", () => {
    const withBullets = (bulletKeys: string[]) =>
      [
        {
          type: "experience",
          title: "",
          companies: [
            company("c1", [
              role(
                "r1",
                bulletKeys.map((key) => ({ type: "text", text: "x", _key: key })),
              ),
            ]),
          ],
          _key: "s1",
        },
      ] as unknown as FormSection[]

    expect(describeSectionsChange(withBullets(["b1", "b2"]), withBullets(["b1"]))).toBe(
      "delete bullet",
    )
  })

  it("reports nothing structural when only text changed", () => {
    const before = [section("a", { text: "one" })]
    const after = [section("a", { text: "two" })]

    expect(describeSectionsChange(before, after)).toBe("edit sections")
  })
})
