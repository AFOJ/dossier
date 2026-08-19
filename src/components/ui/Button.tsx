import { Button as BaseButton } from "@base-ui/react";
import { cn } from "../../utils";
import { cva } from "class-variance-authority";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react";

interface ButtonProps extends ComponentPropsWithoutRef<typeof BaseButton> {
    intent?: "primary" | "secondary"
    icon?: HugeiconsIconProps["icon"]
    iconClassname?: string
}

const buttonVariants = cva(
    cn("inline-flex items-center justify-center",
        "gap-1 px-2 py-2",
        "rounded-lg focus:outline-none focus:ring-1 focus:ring-offset-1",
        "font-medium text-sm transition-colors cursor-pointer ",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:select-none"
    ),
    {
        variants: {
            intent: {
                primary: "bg-gray-900 text-white enabled:hover:bg-gray-700 focus:ring-gray-400",
                secondary: "bg-white text-gray-900 border border-gray-400/40 enabled:hover:bg-gray-50 focus:ring-gray-600",
            },
        },
        defaultVariants: {
            intent: "primary",
        },
    }
);

export const Button = forwardRef<HTMLButtonElement, Readonly<ButtonProps>>((props, ref) => {
    const { children, className, icon, iconClassname, intent = "primary", ...rest } = props
    return <BaseButton {...rest}
        ref={ref}
        className={cn(buttonVariants({ intent }), className)}
    >
        {icon && (
            <HugeiconsIcon
                aria-hidden
                icon={icon}
                size={16}
                strokeWidth={3}
                className={cn("shrink-0", iconClassname)}
            />
        )}
        {children}
    </BaseButton>
})