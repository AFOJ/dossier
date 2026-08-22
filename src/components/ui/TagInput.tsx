import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { cn } from '@/utils'
import { HugeiconsIcon } from '@hugeicons/react'
import { useState, type KeyboardEvent } from 'react'

type TagInputProps = {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  ariaLabel?: string
}

export function TagInput(props: Readonly<TagInputProps>) {
  const {
    value,
    onChange,
    placeholder = 'Type a skill and press Enter',
    ariaLabel,
  } = props
  const [draft, setDraft] = useState('')

  const commitDraft = () => {
    const tag = draft.trim()
    if (tag !== '' && !value.includes(tag)) {
      onChange([...value, tag])
    }
    setDraft('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      commitDraft()
      return
    }

    if (event.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div
      className={cn(
        'flex w-full flex-wrap items-center gap-1.5 rounded-lg border border-gray-300 p-2',
        'hover:border-gray-400 focus-within:border-gray-600 focus-within:ring-1 focus-within:ring-gray-600',
      )}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 rounded-md bg-gray-100 py-0.5 pr-1 pl-2 text-sm text-gray-700"
        >
          {tag}
          <button
            type="button"
            aria-label={`Remove ${tag}`}
            onClick={() => onChange(value.filter((item) => item !== tag))}
            className="rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-gray-400"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={12} strokeWidth={2} />
          </button>
        </span>
      ))}

      <input
        type="text"
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={draft}
        className="min-w-24 flex-1 text-sm outline-none placeholder:text-gray-400"
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commitDraft}
      />
    </div>
  )
}
