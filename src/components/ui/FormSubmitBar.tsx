import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react"
import { cn } from "@/utils"

type FormSubmitBarProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  children: ReactNode
  sidebarOffset?: boolean
  innerClassName?: string
}

export const FormSubmitBar = forwardRef<HTMLDivElement, Readonly<FormSubmitBarProps>>(
  (props, ref) => {
    const { children, sidebarOffset = true, innerClassName, className, ...rest } = props

    return (
      <div
        ref={ref}
        {...rest}
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white",
          sidebarOffset && "lg:left-64",
          className,
        )}
      >
        <div
          className={cn(
            "mx-auto flex w-full max-w-6xl items-center justify-end gap-3 px-4 py-3 sm:px-6 lg:px-10",
            innerClassName,
          )}
        >
          {children}
        </div>
      </div>
    )
  },
)
