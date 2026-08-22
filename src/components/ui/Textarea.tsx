import { forwardRef } from 'react'
import { cn } from '@/utils'

type TextareaProps = React.ComponentPropsWithoutRef<'textarea'>

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (props, ref) => {
    const { className, ...rest } = props
    return (
      <textarea
        {...rest}
        ref={ref}
        className={cn(
          'border border-gray-300 hover:border-gray-400',
          'focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-gray-600',
          'p-2 rounded-lg placeholder:text-gray-400',
          className,
        )}
      />
    )
  },
)
