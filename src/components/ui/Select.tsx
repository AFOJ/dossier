import { Select as BaseSelect } from '@base-ui/react/select'
import { CheckmarkCircle01Icon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/Icon'

type SelectOption<T extends string | number> = {
  label: string
  value: T
}

type SelectProps<T extends string | number> = {
  'aria-label': string
  options: readonly SelectOption<T>[]
  value: T
  onValueChange: (value: T) => void
}

export function Select<T extends string | number>(props: Readonly<SelectProps<T>>) {
  const { 'aria-label': ariaLabel, options, value, onValueChange } = props

  return (
    <BaseSelect.Root
      value={value}
      onValueChange={(nextValue) => {
        if (nextValue !== null) {
          onValueChange(nextValue as T)
        }
      }}
    >
      <BaseSelect.Trigger
        aria-label={ariaLabel}
        className="flex items-center gap-1 rounded-lg border border-gray-400/40 bg-white px-2 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-600"
      >
        <BaseSelect.Value>{value}</BaseSelect.Value>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner sideOffset={6}>
          <BaseSelect.Popup className="z-50 min-w-(--anchor-width) rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
            {options.map((option) => (
              <BaseSelect.Item
                key={option.value}
                value={option.value}
                className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-gray-900 transition-colors data-highlighted:bg-gray-100 focus:outline-none"
              >
                <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                <BaseSelect.ItemIndicator className="text-gray-900">
                  <Icon icon={CheckmarkCircle01Icon} />
                </BaseSelect.ItemIndicator>
              </BaseSelect.Item>
            ))}
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  )
}
