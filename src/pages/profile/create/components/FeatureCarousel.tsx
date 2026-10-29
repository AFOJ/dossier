import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { PauseIcon, PlayIcon } from "@hugeicons/core-free-icons"
import {
  IsometricReuse,
  IsometricCart,
  IsometricShieldLock,
} from "@/components/illustrations/IsometricOnboardingIllustrations"
import { Button, Icon } from "@/components/ui"
import { cn } from "@/utils"
import "./FeatureCarousel.css"

const features = [
  {
    title: "Your details, ready to reuse.",
    description: "Set up your details once. Reuse them across resumes and cover letters.",
    Illustration: IsometricReuse,
  },
  {
    title: "Your work goes with you.",
    description: "Export your profile and documents. Pick up where you left off on another device.",
    Illustration: IsometricCart,
  },
  {
    title: "Your career. Your data.",
    description: "Stored in your browser, on your device. No account required.",
    Illustration: IsometricShieldLock,
  },
]

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (notify) => {
      const media = window.matchMedia(query)
      media.addEventListener("change", notify)
      return () => media.removeEventListener("change", notify)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

function subscribeVisibility(notify: () => void) {
  document.addEventListener("visibilitychange", notify)
  return () => document.removeEventListener("visibilitychange", notify)
}

export function FeatureCarousel() {
  const [activeSlide, setActiveSlide] = useState(0)
  const [paused, setPaused] = useState(false)
  const [selectionVersion, setSelectionVersion] = useState(0)
  const pointerFocus = useRef(false)
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")
  const desktop = useMediaQuery("(min-width: 1024px)")
  const pageVisible = useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState !== "hidden",
    () => true,
  )
  const rotating = !paused && !reducedMotion && desktop && pageVisible
  const feature = features[activeSlide]
  const Illustration = feature.Illustration

  useEffect(() => {
    if (!rotating) return
    const timer = window.setTimeout(
      () => setActiveSlide((current) => (current + 1) % features.length),
      6000,
    )
    return () => window.clearTimeout(timer)
  }, [rotating, activeSlide, selectionVersion])

  return (
    <section
      aria-label="Dossier features"
      aria-roledescription="carousel"
      onPointerDownCapture={() => {
        pointerFocus.current = true
      }}
      onPointerUpCapture={() => {
        pointerFocus.current = false
      }}
      onPointerCancelCapture={() => {
        pointerFocus.current = false
      }}
      onKeyDownCapture={() => {
        pointerFocus.current = false
      }}
      onFocusCapture={(event) => {
        if (
          !pointerFocus.current &&
          !(event.target as HTMLElement).closest("[data-rotation-control]")
        )
          setPaused(true)
        pointerFocus.current = false
      }}
      className="relative hidden min-w-0 flex-col items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 px-10 py-16 lg:flex"
    >
      {!reducedMotion && (
        <Button
          type="button"
          intent="secondary"
          data-rotation-control=""
          aria-label={paused ? "Start carousel" : "Pause carousel"}
          onClick={() => setPaused((current) => !current)}
          className="absolute top-4 right-4 size-11 border-transparent bg-transparent px-0 transition-colors duration-100 hover:border-gray-300 motion-reduce:transition-none"
        >
          <Icon icon={paused ? PlayIcon : PauseIcon} size={16} strokeWidth={1.5} aria-hidden />
        </Button>
      )}
      <div
        id="onboarding-feature"
        role="group"
        aria-roledescription="slide"
        aria-label={`${activeSlide + 1} of ${features.length}`}
        aria-live={rotating ? "off" : "polite"}
        aria-atomic="true"
        className="w-full min-w-0"
      >
        <div
          key={activeSlide}
          className="feature-slide flex min-w-0 flex-col items-center text-center"
        >
          <div aria-hidden="true" className="flex h-64 items-center justify-center">
            <Illustration aria-hidden="true" className="size-44 text-slate-500" />
          </div>
          <div className="min-h-36 w-full max-w-sm">
            <h2 className="text-3xl font-semibold tracking-tight text-gray-950">{feature.title}</h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600">{feature.description}</p>
          </div>
        </div>
      </div>
      <div role="group" aria-label="Choose a feature" className="mt-6 flex gap-1">
        {features.map((item, index) => (
          <button
            key={item.title}
            type="button"
            aria-label={`Show feature ${index + 1}: ${item.title}`}
            aria-current={activeSlide === index ? "true" : undefined}
            aria-controls="onboarding-feature"
            onClick={() => {
              setActiveSlide(index)
              setSelectionVersion((current) => current + 1)
            }}
            className="flex size-11 items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
          >
            <span
              aria-hidden="true"
              className="relative h-0.5 w-7 overflow-hidden rounded bg-gray-300"
            >
              {activeSlide === index && (
                <span
                  key={`${rotating}-${selectionVersion}`}
                  className={cn(
                    "absolute inset-0 origin-left bg-gray-900",
                    rotating && "feature-progress",
                  )}
                />
              )}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
