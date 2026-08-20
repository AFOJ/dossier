import { cn } from '@/utils'
import type { ComponentPropsWithoutRef } from 'react'

export const Divider = (props: Readonly<ComponentPropsWithoutRef<'hr'>>) => {
  const { className, ...rest } = props

  return <hr {...rest} className={cn('border-gray-200/80', className)} />
}
