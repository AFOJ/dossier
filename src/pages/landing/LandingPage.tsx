import { useLoaderData } from "react-router-dom"
import { ArrowUpRight01Icon, File01Icon, Mail01Icon, UserIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react"
import { ButtonLink, Heading1, Heading2, Heading3, Subheading } from "@/components/ui"

const GITHUB_URL = "https://github.com/AFOJ/dossier"

type Feature = {
  icon: HugeiconsIconProps["icon"]
  title: string
  description: string
}
const FEATURES: Feature[] = [
  {
    icon: File01Icon,
    title: "Resume Editor",
    description:
      "Build tailored resumes with reorderable and renameable sections. Every version stays consistently formatted, so you can focus on the content that matters for each role.",
  },
  {
    icon: Mail01Icon,
    title: "Cover Letter Editor",
    description:
      "Write naturally in a rich text editor with your details already synced in. No retyping, no copy-pasting, and no starting from a blank page.",
  },
  {
    icon: UserIcon,
    title: "Profile",
    description:
      "Keep your career details in one place. Update your profile once, and your changes are available across every resume and cover letter.",
  },
]
export default function LandingPage() {
  const { hasProfile } = useLoaderData<{ hasProfile: boolean }>()
  const ctaTarget = hasProfile ? "/resumes" : "/setup"
  const ctaLabel = hasProfile ? "Open the app" : "Get started"

  return (
    <div className="relative min-h-dvh bg-white">
      <div className="relative z-10 flex min-h-dvh flex-col bg-white">
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-10">
            <div className="flex items-center justify-between border-x border-gray-200 px-6 py-4">
              <a href="/" className="flex items-center">
                <img src="/d-logo.svg" alt="Dossier" className="size-7" />
              </a>

              <nav className="flex items-center gap-2">
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                >
                  GitHub
                  <HugeiconsIcon aria-hidden icon={ArrowUpRight01Icon} size={14} strokeWidth={2} />
                </a>
                <ButtonLink to={ctaTarget}>{ctaLabel}</ButtonLink>
              </nav>
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col">
          <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-10">
            <Heading1 className="max-w-2xl text-5xl md:text-6xl lg:text-7xl">
              Manage your career documents in one place.
            </Heading1>
            <Subheading className="mt-3 max-w-[27em] text-balance font-medium text-base leading-snug">
              Dossier gives you one place to manage your career details and build tailored resumes
              and cover letters for every role, while keeping your data on your device.
            </Subheading>
            <div className="mt-8 flex items-center gap-2.5">
              <ButtonLink to={GITHUB_URL} intent="secondary">
                GitHub
              </ButtonLink>
              <ButtonLink to={ctaTarget}>{ctaLabel}</ButtonLink>
            </div>
          </section>

          <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 border border-gray-200 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="flex flex-col justify-between gap-6 border-gray-200 py-8 max-lg:items-center max-lg:gap-4 max-lg:not-first:border-t max-lg:text-center lg:not-first:border-l lg:px-7"
                >
                  <HugeiconsIcon
                    aria-hidden
                    icon={feature.icon}
                    size={24}
                    strokeWidth={2}
                    className="text-gray-900"
                  />
                  <div className="flex flex-col gap-1.5">
                    <Heading3 className="text-balance font-medium leading-[1.4]">
                      {feature.title}
                    </Heading3>
                    <p className="text-balance text-sm font-medium leading-[1.45] text-gray-500">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-10">
            <div className="relative -mt-px overflow-hidden border border-gray-200 px-6 py-16 sm:py-20 lg:px-10">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 size-full text-black/1.5"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(to right, currentColor 0 1px, transparent 1px 8px), repeating-linear-gradient(to bottom, currentColor 0 1px, transparent 1px 8px)",
                  maskImage:
                    "radial-gradient(ellipse 55% 42% at 50% 38%, transparent 32%, #000 72%)",
                  WebkitMaskImage:
                    "radial-gradient(ellipse 55% 42% at 50% 38%, transparent 32%, #000 72%)",
                }}
              />
              <div className="relative flex flex-col items-center gap-3 text-center">
                <Heading2>Local-first, by design</Heading2>
                <p className="max-w-[27em] text-balance text-lg font-medium leading-snug text-gray-500">
                  Your documents live in your browser, not on a server. No account, no cloud, no
                  lock-in. Export and import your work whenever you want.
                </p>
                <ButtonLink to={ctaTarget} className="mt-2">
                  {ctaLabel}
                </ButtonLink>
              </div>
            </div>
          </section>
        </main>
      </div>

      <footer className="sticky bottom-0 z-0">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-10">
          <div className="border-x border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center">
                <span className="text-sm text-gray-500">© 2026</span>
                <a
                  href="https://ojabba.com"
                  target="_blank"
                  rel="noreferrer"
                  className="ml-1.5 transition-opacity hover:opacity-80"
                >
                  <span className="text-sm font-medium text-gray-900 underline decoration-wavy decoration-gray-400 decoration-1 underline-offset-4">
                    OJ Abba
                  </span>
                </a>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="https://api.dossier.ojabba.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                >
                  API
                  <HugeiconsIcon aria-hidden icon={ArrowUpRight01Icon} size={14} strokeWidth={2} />
                </a>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                >
                  GitHub
                  <HugeiconsIcon aria-hidden icon={ArrowUpRight01Icon} size={14} strokeWidth={2} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
