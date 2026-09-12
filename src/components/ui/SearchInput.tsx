import { Search01Icon } from "@hugeicons/core-free-icons"
import { Icon } from "@/components/ui/Icon"
import { cn } from "@/utils"
import { Input } from "@/components/ui/Input"

type SearchInputProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  loading?: boolean
}

export function SearchInput(props: Readonly<SearchInputProps>) {
  const { value, onChange, placeholder = "Search", className, loading = false } = props

  return (
    <div className={cn("relative w-full sm:w-56", className)}>
      {loading ? (
        <span
          role="status"
          aria-label="Searching"
          className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"
        />
      ) : (
        <Icon
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
          icon={Search01Icon}
          size={20}
          strokeWidth={2}
        />
      )}
      <Input
        className="w-full pl-10 text-sm"
        onValueChange={onChange}
        placeholder={placeholder}
        value={value}
      />
    </div>
  )
}
