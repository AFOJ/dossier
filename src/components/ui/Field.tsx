import { cn } from '../../utils'
import { Field as BaseField } from '@base-ui/react/field'
import * as React from 'react'

export interface FieldProps extends React.ComponentPropsWithoutRef<
  typeof BaseField.Root
> {
  label?: string
  description?: string
  error?: string
  required?: boolean
  children: React.ReactNode
  inputId?: string
}

export const Field = React.forwardRef<HTMLDivElement, Readonly<FieldProps>>(
  (props, ref) => {
    const {
      label,
      inputId,
      description,
      error,
      children,
      className,
      required,
      ...rest
    } = props
    return (
      <BaseField.Root
        {...rest}
        ref={ref}
        className={cn('flex flex-col gap-2', className)}
      >
        {label && (
          <BaseField.Label
            htmlFor={inputId}
            className={cn('font-medium text-sm')}
          >
            {label} {required && <span className="text-red-700">*</span>}
          </BaseField.Label>
        )}

        {children}

        {description && (
          <BaseField.Description className={'text-sm'}>
            {description}
          </BaseField.Description>
        )}

        <BaseField.Error match={!!error} className={'text-red-700 text-sm'}>
          {error}
        </BaseField.Error>
      </BaseField.Root>
    )
  },
)
