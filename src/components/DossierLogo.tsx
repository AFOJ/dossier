import type { SVGProps } from "react"
import { cn } from "@/utils"

type DossierLogoProps = SVGProps<SVGSVGElement> & {
  title?: string
}

export function DossierLogo({ className, title, ...props }: Readonly<DossierLogoProps>) {
  return (
    <svg
      viewBox="0 0 32 32"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
      className={cn("fill-current", className)}
      {...props}
    >
      {title && <title>{title}</title>}
      <path
        fillRule="evenodd"
        d="M6 5h11c7 0 9 4 9 11s-2 11-9 11H6V5Zm4 4v14h6c4 0 6-3 6-7s-2-7-6-7h-6Z"
      />
      <rect x="12" y="12" width="6" height="2" rx="1" />
      <rect x="12" y="15" width="5" height="2" rx="1" />
      <rect x="12" y="18" width="4" height="2" rx="1" />
    </svg>
  )
}
