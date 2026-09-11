import { cn } from "@/utils"
import type { ComponentPropsWithoutRef } from "react"

type CardProps = ComponentPropsWithoutRef<"div"> & {
  tone?: "muted" | "plain"
}

export function Card(props: Readonly<CardProps>) {
  const { tone = "muted", className, ...rest } = props

  return (
    <div
      {...rest}
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-gray-200 p-4",
        tone === "muted" ? "bg-gray-50" : "bg-white",
        className,
      )}
    />
  )
}
