import { useEffect, useId, useRef, useState, type RefObject } from "react"
import { useWatch, type Control, type FieldValues, type Path } from "react-hook-form"
import { ArrowDown01Icon, ArrowUpToLineIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/Button"
import { Tooltip } from "@/components/ui/Tooltip"
import { cn } from "@/utils"

type Props<FormValues extends FieldValues> = {
  heading: string
  control: Control<FormValues>
  fallbackTitle: string
  titleFieldRef: RefObject<HTMLDivElement | null>
  titleInputId: string
}

export function EditingContextBar<FormValues extends FieldValues>({
  heading,
  control,
  fallbackTitle,
  titleFieldRef,
  titleInputId,
}: Readonly<Props<FormValues>>) {
  const draftTitle = useWatch({ control, name: "title" as Path<FormValues> })
  const title = (typeof draftTitle === "string" && draftTitle.trim()) || fallbackTitle
  const barRef = useRef<HTMLDivElement>(null)
  const titleTextRef = useRef<HTMLSpanElement>(null)
  const titleContentId = useId()
  const [hasTitleOverflow, setHasTitleOverflow] = useState(false)
  const [titleExpanded, setTitleExpanded] = useState(false)
  const [titleHasFocus, setTitleHasFocus] = useState(false)
  const canToggleTitle = hasTitleOverflow || titleExpanded || titleHasFocus
  const [headerHeight, setHeaderHeight] = useState(0)
  const [hasPassedTitle, setHasPassedTitle] = useState(false)
  const [containsFocus, setContainsFocus] = useState(false)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const visible = hasPassedTitle || containsFocus

  useEffect(() => {
    const bar = barRef.current
    if (!bar) return
    const header = document.querySelector<HTMLElement>("[data-app-mobile-header]")
    const rootStyle = document.documentElement.style
    const previousPadding = rootStyle.getPropertyValue("scroll-padding-top")
    const previousPriority = rootStyle.getPropertyPriority("scroll-padding-top")
    const measure = () => {
      const mobileHeaderHeight = header?.getBoundingClientRect().height ?? 0
      const barHeight = bar.getBoundingClientRect().height
      const titleText = titleTextRef.current
      if (titleText) {
        const lineHeight = Number.parseFloat(getComputedStyle(titleText).lineHeight) || 20
        setHasTitleOverflow(titleText.scrollHeight > lineHeight * 2 + 1)
      }
      setHeaderHeight(mobileHeaderHeight)
      setIsOverflowing(bar.scrollHeight > bar.clientHeight)
      rootStyle.setProperty("scroll-padding-top", `${mobileHeaderHeight + barHeight + 12}px`)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(bar)
    if (titleTextRef.current) observer.observe(titleTextRef.current)
    if (header) observer.observe(header)
    window.addEventListener("resize", measure)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", measure)
      if (previousPadding)
        rootStyle.setProperty("scroll-padding-top", previousPadding, previousPriority)
      else rootStyle.removeProperty("scroll-padding-top")
    }
  }, [title, titleExpanded, hasTitleOverflow, canToggleTitle])

  useEffect(() => {
    const titleField = titleFieldRef.current
    if (!titleField) return
    const updateVisibility = (bounds: DOMRectReadOnly) => {
      setHasPassedTitle(bounds.bottom <= headerHeight)
    }
    updateVisibility(titleField.getBoundingClientRect())
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          const passedTitle =
            !entry.isIntersecting && entry.boundingClientRect.bottom <= headerHeight
          setHasPassedTitle(passedTitle)
          if (!passedTitle && !barRef.current?.contains(document.activeElement))
            setTitleExpanded(false)
        }
      },
      { rootMargin: `-${headerHeight}px 0px 0px 0px`, threshold: 0 },
    )
    observer.observe(titleField)
    return () => observer.disconnect()
  }, [headerHeight, titleFieldRef])

  const returnToTop = () => {
    setTitleExpanded(false)
    const titleInput = document.getElementById(titleInputId)
    titleInput?.focus({ preventScroll: true })
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    titleInput?.scrollIntoView({
      block: "start",
      behavior: reducedMotion ? "instant" : "smooth",
    })
  }

  return (
    <div
      ref={barRef}
      role="region"
      aria-label="Document editing context"
      aria-hidden={!visible}
      inert={!visible}
      tabIndex={visible && isOverflowing ? 0 : undefined}
      onFocusCapture={() => setContainsFocus(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setContainsFocus(false)
          if (!hasPassedTitle) setTitleExpanded(false)
        }
      }}
      style={{ top: headerHeight }}
      className={cn(
        "fixed inset-x-0 z-20 max-h-[40dvh] overflow-y-auto border-b border-gray-200 bg-white transition-[translate,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none lg:left-64",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0",
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-10">
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-gray-950">{heading}</p>
          {canToggleTitle ? (
            <button
              type="button"
              aria-expanded={titleExpanded}
              aria-controls={titleContentId}
              onClick={() => setTitleExpanded((expanded) => !expanded)}
              onFocus={() => setTitleHasFocus(true)}
              onBlur={() => setTitleHasFocus(false)}
              className="flex w-full min-w-0 items-center gap-1.5 rounded-md text-left text-sm text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:ring-offset-2"
            >
              <span
                ref={titleTextRef}
                id={titleContentId}
                className={cn(
                  "min-w-0 flex-1 [overflow-wrap:anywhere]",
                  !titleExpanded && "line-clamp-2",
                )}
              >
                {title}
              </span>
              <HugeiconsIcon
                aria-hidden
                icon={ArrowDown01Icon}
                size={16}
                className={cn("sticky top-3 shrink-0 self-start", titleExpanded && "rotate-180")}
              />
              <span className="sr-only">
                {titleExpanded ? "Collapse title" : "Show full title"}
              </span>
            </button>
          ) : (
            <p className="flex min-w-0 flex-1 items-center text-sm text-gray-600">
              <span
                ref={titleTextRef}
                id={titleContentId}
                className="line-clamp-2 min-w-0 [overflow-wrap:anywhere]"
              >
                {title}
              </span>
            </p>
          )}
        </div>
        <Tooltip content="Back to top">
          <Button
            type="button"
            intent="secondary"
            icon={ArrowUpToLineIcon}
            aria-label="Back to top"
            className="sticky top-3 size-11 shrink-0 self-start px-0"
            onClick={returnToTop}
          />
        </Tooltip>
      </div>
    </div>
  )
}
