import { cn } from '../../utils'
import type { ComponentPropsWithoutRef } from 'react'

export const Heading1 = (props: Readonly<ComponentPropsWithoutRef<'h1'>>) => {
  const { children, className, ...rest } = props

  return (
    <h1
      {...rest}
      className={cn(
        'font-bold font-heading text-4xl md:text-5xl text-gray-900',
        className,
      )}
    >
      {children}
    </h1>
  )
}

export const Heading2 = (props: Readonly<ComponentPropsWithoutRef<'h2'>>) => {
  const { children, className, ...rest } = props

  return (
    <h2
      {...rest}
      className={cn(
        'font-semibold font-heading text-2xl md:text-3xl text-gray-800',
        className,
      )}
    >
      {children}
    </h2>
  )
}

export const Heading3 = (props: Readonly<ComponentPropsWithoutRef<'h3'>>) => {
  const { children, className, ...rest } = props

  return (
    <h3
      {...rest}
      className={cn(
        'font-semibold font-heading text-base text-gray-800',
        className,
      )}
    >
      {children}
    </h3>
  )
}

export const Subheading = (props: Readonly<ComponentPropsWithoutRef<'p'>>) => {
  const { children, className, ...rest } = props

  return (
    <p
      {...rest}
      className={cn(
        'text-sm text-gray-500 font-normal leading-relaxed',
        className,
      )}
    >
      {children}
    </p>
  )
}
