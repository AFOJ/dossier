import { cva } from "class-variance-authority"
import { cn } from "@/utils"
import type { PropsWithChildren } from "react"

const calloutVariants = cva("rounded-lg border p-3 text-sm", {
  variants: {
    intent: {
      gray: "border-gray-300 bg-gray-50 text-gray-700",
      yellow: "border-amber-300 bg-amber-50 text-amber-900",
      red: "border-red-300 bg-red-50 text-red-900",
      green: "border-green-300 bg-green-50 text-green-900",
    },
  },
  defaultVariants: {
    intent: "gray",
  },
})

type CalloutProps = PropsWithChildren<{
  intent?: "gray" | "yellow" | "red" | "green"
  role?: "status" | "alert"
  className?: string
}>

export function Callout(props: Readonly<CalloutProps>) {
  const { intent = "gray", role, className, children } = props

  return (
    <div role={role} className={cn(calloutVariants({ intent }), className)}>
      {children}
    </div>
  )
}
