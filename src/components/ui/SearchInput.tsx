import { Search01Icon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/utils'
import { Input } from './Input'

type SearchInputProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchInput(props: Readonly<SearchInputProps>) {
  const { value, onChange, placeholder = 'Search', className } = props

  return (
    <div className={cn('relative w-full sm:w-56', className)}>
      <Icon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
        icon={Search01Icon}
        size={20}
        strokeWidth={2}
      />
      <Input
        className="w-full pl-10 text-sm"
        onValueChange={onChange}
        placeholder={placeholder}
        value={value}
      />
    </div>
  )
}
