import type { Profile } from "@/db/db"

export const TITLE_FORMAT_TOKENS = [
  "profile.name",
  "profile.role",
  "date",
  "dateShort",
  "year",
  "month",
  "monthShort",
  "day",
] as const

export type TitleFormatToken = (typeof TITLE_FORMAT_TOKENS)[number]

/**
 * Human-readable hints for each token, keyed by token name. Exported so the
 * settings UI lists exactly the tokens the renderer understands rather than
 * duplicating the list.
 */
export const TOKEN_HELPERS: Record<TitleFormatToken, string> = {
  "profile.name": "Your full name from your profile",
  "profile.role": "Your job title from your profile",
  date: "Today's date, e.g. 17 September 2026",
  dateShort: "Today's date in short form, e.g. 17 Sep 2026",
  year: "Today's year, e.g. 2026",
  month: "Today's month, e.g. September",
  monthShort: "Today's short month, e.g. Sep",
  day: "Today's day of the month, e.g. 17",
}

export const DEFAULT_RESUME_TITLE_FORMAT = "{profile.role} Resume"

export const DEFAULT_EXPORT_FILENAME_FORMAT = "{kind}-{title}-export-{dateShort}"

const TOKEN_PATTERN = /\{([a-zA-Z]+(?:\.[a-zA-Z]+)?)\}/g

type TokenValues = Partial<Record<TitleFormatToken, string>>

function tokenValues(profile: Profile | undefined, now: Date): TokenValues {
  return {
    "profile.name": profile?.full_name,
    "profile.role": profile?.role ?? undefined,
    date: now.toLocaleDateString(undefined, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    dateShort: now.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    year: String(now.getFullYear()),
    month: now.toLocaleDateString(undefined, { month: "long" }),
    monthShort: now.toLocaleDateString(undefined, { month: "short" }),
    day: String(now.getDate()),
  }
}

/**
 * Renders a user-editable title format into a document title.
 *
 * A token that cannot be resolved is left exactly as written, whether it is an
 * unrecognised name or a recognised one with nothing behind it (a profile with
 * no role, or no profile at all). Keeping the braces makes a typo obvious and
 * keeps a missing value from silently deleting part of the title. Someone who
 * wants a literal `{profile.role}` in a title can type the braces themselves,
 * so nothing is lost by not guessing.
 *
 * The bare-title fallback only applies to a format that resolves to nothing at
 * all — a blank or whitespace-only format string — because any surviving token
 * guarantees non-empty output.
 */
export function renderTitle(
  format: string,
  context: { profile?: Profile; now?: Date } = {},
): string {
  const { profile, now = new Date() } = context
  const values = tokenValues(profile, now)

  const rendered = format.replace(TOKEN_PATTERN, (match, token: string) => {
    if (!TITLE_FORMAT_TOKENS.includes(token as TitleFormatToken)) {
      return match
    }

    return values[token as TitleFormatToken] ?? match
  })

  const collapsed = rendered.replace(/\s+/g, " ").trim()

  return collapsed === "" ? "Resume" : collapsed
}
