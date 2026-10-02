import { describe, expect, it } from "vitest"
import {
  describeSectionsChange,
  replaySections,
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

describe("replaySections", () => {
  function paragraph(key: string, text: string) {
    return { type: "paragraph", title: "", text, _key: key } as unknown as FormSection
  }

  function experience(key: string, companies: unknown[]): FormSection {
    return { type: "experience", title: "", companies, _key: key } as unknown as FormSection
  }

  it("keeps text typed into a section after the recorded change", () => {
    const target = [paragraph("a", "before")]
    const live = [paragraph("a", "before plus more")]

    expect(replaySections(target, live)[0]).toMatchObject({ text: "before plus more" })
  })

  it("restores an item that is missing from the live tree", () => {
    const target = [paragraph("a", "kept"), paragraph("b", "restored")]
    const live = [paragraph("a", "kept, edited")]

    const result = replaySections(target, live)

    expect(result).toHaveLength(2)
    expect(result[1]).toMatchObject({ _key: "b", text: "restored" })
  })

  it("drops an item that only exists live", () => {
    const target = [paragraph("a", "kept")]
    const live = [paragraph("a", "kept"), paragraph("b", "added later")]

    expect(replaySections(target, live)).toHaveLength(1)
  })

  it("adopts the target order while keeping live content", () => {
    const target = [paragraph("b", "b"), paragraph("a", "a")]
    const live = [paragraph("a", "a edited"), paragraph("b", "b edited")]

    const result = replaySections(target, live)

    expect(result.map((item) => item._key)).toEqual(["b", "a"])
    expect(result[0]).toMatchObject({ text: "b edited" })
  })

  it("recurses into nested lists by identity", () => {
    const target = [
      experience("s1", [
        {
          company_name: "Spotify",
          roles: [
            {
              job_title: "Dev",
              bullets: [
                { type: "text", text: "first", _key: "b1" },
                { type: "text", text: "second", _key: "b2" },
              ],
              _key: "r1",
            },
          ],
          _key: "c1",
        },
      ]),
    ]

    // The sibling bullet was edited after the change was recorded.
    const live = [
      experience("s1", [
        {
          company_name: "Spotify, renamed",
          roles: [
            {
              job_title: "Dev, edited",
              bullets: [
                { type: "text", text: "first, edited", _key: "b1" },
                { type: "text", text: "second", _key: "b2" },
              ],
              _key: "r1",
            },
          ],
          _key: "c1",
        },
      ]),
    ]

    type Company = {
      company_name: string
      roles: { job_title: string; bullets: { text: string }[] }[]
    }

    const result = replaySections(target, live) as unknown as { companies: Company[] }[]
    const company = result[0].companies[0]

    expect(company.company_name).toBe("Spotify, renamed")
    expect(company.roles[0].job_title).toBe("Dev, edited")
    expect(company.roles[0].bullets.map((bullet) => bullet.text)).toEqual([
      "first, edited",
      "second",
    ])
  })

  it("restores a nested bullet without disturbing its sibling", () => {
    const target = [
      experience("s1", [
        {
          company_name: "Spotify",
          roles: [
            {
              job_title: "Dev",
              bullets: [
                { type: "text", text: "deleted later", _key: "b1" },
                { type: "text", text: "sibling", _key: "b2" },
              ],
              _key: "r1",
            },
          ],
          _key: "c1",
        },
      ]),
    ]

    const live = [
      experience("s1", [
        {
          company_name: "Spotify",
          roles: [
            {
              job_title: "Dev",
              bullets: [{ type: "text", text: "sibling, edited", _key: "b2" }],
              _key: "r1",
            },
          ],
          _key: "c1",
        },
      ]),
    ]

    type Company = { roles: { bullets: { text: string }[] }[] }

    const result = replaySections(target, live) as unknown as { companies: Company[] }[]

    expect(result[0].companies[0].roles[0].bullets.map((bullet) => bullet.text)).toEqual([
      "deleted later",
      "sibling, edited",
    ])
  })

  function skills(key: string, items: string[]): FormSection {
    return {
      type: "skills",
      title: "",
      groups: [{ title: "Web", items, _key: `${key}g1` }],
      _key: key,
    } as unknown as FormSection
  }

  function replayItems(targetItems: string[], liveItems: string[]) {
    const result = replaySections(
      [skills("s1", targetItems)],
      [skills("s1", liveItems)],
    ) as unknown as { groups: { items: string[] }[] }[]

    return result[0].groups[0].items
  }

  it("drops unkeyed entries added after the recorded change", () => {
    // The extra skill was added later, so it is dropped.
    expect(replayItems(["React", "TypeScript"], ["React", "TypeScript", "Vitest"])).toEqual([
      "React",
      "TypeScript",
    ])
  })

  it("restores a front-deleted entry without duplicating the survivor", () => {
    // Matching survivors by position would return ["TypeScript", "TypeScript"].
    expect(replayItems(["React", "TypeScript"], ["TypeScript"])).toEqual(["React", "TypeScript"])
  })

  it("drops later additions when an earlier entry was deleted", () => {
    expect(replayItems(["React", "TypeScript"], ["TypeScript", "Vue"])).toEqual([
      "React",
      "TypeScript",
    ])
  })
})

describe("skill groups", () => {
  function skillsSection(key: string, items: string[]): FormSection {
    return {
      type: "skills",
      title: "",
      groups: [{ title: "Web", items, _key: `${key}-g1` }],
      _key: key,
    } as unknown as FormSection
  }

  it("changes when a skill is added to a group", () => {
    expect(sectionsSignature([skillsSection("s1", ["React"])])).not.toBe(
      sectionsSignature([skillsSection("s1", ["React", "TypeScript"])]),
    )
  })

  it("changes when a skill is removed from a group", () => {
    expect(sectionsSignature([skillsSection("s1", ["React", "TypeScript"])])).not.toBe(
      sectionsSignature([skillsSection("s1", ["React"])]),
    )
  })

  it("ignores rewriting a skill without changing the count", () => {
    expect(sectionsSignature([skillsSection("s1", ["React"])])).toBe(
      sectionsSignature([skillsSection("s1", ["Vue"])]),
    )
  })

  it("describes an added skill", () => {
    expect(
      describeSectionsChange(
        [skillsSection("s1", ["React"])],
        [skillsSection("s1", ["React", "TypeScript"])],
      ),
    ).toBe("add skill")
  })

  it("describes a removed skill", () => {
    expect(
      describeSectionsChange(
        [skillsSection("s1", ["React", "TypeScript"])],
        [skillsSection("s1", ["React"])],
      ),
    ).toBe("delete skill")
  })
})
