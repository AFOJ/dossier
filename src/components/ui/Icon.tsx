import { HugeiconsIcon, type HugeiconsIconProps } from '@hugeicons/react'

export type IconProps = HugeiconsIconProps

export function Icon({ size = 16, strokeWidth = 2, ...props }: IconProps) {
  return <HugeiconsIcon {...props} size={size} strokeWidth={strokeWidth} />
}
