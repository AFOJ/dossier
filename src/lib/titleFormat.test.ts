import { describe, it, expect } from "vitest"
import type { Profile } from "@/db/db"
import {
  DEFAULT_RESUME_TITLE_FORMAT,
  TOKEN_HELPERS,
  TITLE_FORMAT_TOKENS,
  renderTitle,
} from "@/lib/titleFormat"

const profile: Profile = {
  id: 1,
  full_name: "John Doe",
  role: "Farmer",
  email: "john@doe.com",
  phone: null,
  location: null,
  links: [],
}

const rolelessProfile: Profile = { ...profile, role: null }

// Fixed so the date assertions do not depend on when the suite runs.
const now = new Date(2026, 8, 17)

describe("renderTitle", () => {
  it("substitutes profile tokens", () => {
    expect(renderTitle(DEFAULT_RESUME_TITLE_FORMAT, { profile, now })).toBe("Farmer Resume")
    expect(renderTitle("{profile.name}", { profile, now })).toBe("John Doe")
  })

  it("substitutes date tokens using the viewer's locale", () => {
    expect(renderTitle("{date}", { profile, now })).toBe(
      now.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }),
    )
    expect(renderTitle("{year}", { profile, now })).toBe("2026")
    expect(renderTitle("{day}", { profile, now })).toBe("17")
    expect(renderTitle("{monthShort}", { profile, now })).toBe(
      now.toLocaleDateString(undefined, { month: "short" }),
    )
  })

  it("mixes profile and date tokens", () => {
    expect(renderTitle("{profile.role} Resume - {dateShort}", { profile, now })).toBe(
      `Farmer Resume - ${now.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`,
    )
  })

  it("keeps an unrecognised token verbatim so typos stay visible", () => {
    expect(renderTitle("{nope} Resume", { profile, now })).toBe("{nope} Resume")
    expect(renderTitle("{profile.nickname} Resume", { profile, now })).toBe(
      "{profile.nickname} Resume",
    )
  })

  it("keeps a known token verbatim when there is no value behind it", () => {
    expect(renderTitle("{profile.role} Resume", { profile: rolelessProfile, now })).toBe(
      "{profile.role} Resume",
    )
    expect(renderTitle("{profile.name} Resume", { now })).toBe("{profile.name} Resume")
  })

  it("substitutes what it can and keeps the rest verbatim", () => {
    expect(renderTitle("{profile.role} Resume {year}", { profile: rolelessProfile, now })).toBe(
      "{profile.role} Resume 2026",
    )
  })

  it("collapses whitespace left behind by empty substitutions", () => {
    expect(renderTitle("  {profile.role}   Resume  ", { profile: rolelessProfile, now })).toBe(
      "{profile.role} Resume",
    )
  })

  it("falls back to a bare title when the format resolves to nothing", () => {
    expect(renderTitle("", { profile, now })).toBe("Resume")
    expect(renderTitle("   ", { profile, now })).toBe("Resume")
  })

  it("leaves text without tokens untouched", () => {
    expect(renderTitle("My Resume", { profile, now })).toBe("My Resume")
  })
})

describe("TOKEN_HELPERS", () => {
  it("documents every token the renderer supports", () => {
    expect(Object.keys(TOKEN_HELPERS).sort()).toEqual([...TITLE_FORMAT_TOKENS].sort())
  })
})
