import { Delete02Icon, FileAddIcon } from "@hugeicons/core-free-icons"
import { Button, SearchInput, Tooltip } from "@/components/ui"

type ToolbarProps = {
  query: string
  onQueryChange: (query: string) => void
  isSearchPending: boolean
  selectedCount: number
  onCreate: () => void
  onBulkDelete: () => void
}

export function Toolbar(props: Readonly<ToolbarProps>) {
  const { query, onQueryChange, isSearchPending, selectedCount, onCreate, onBulkDelete } = props
  const isDisabled = selectedCount === 0

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput
        value={query}
        onChange={onQueryChange}
        placeholder="Search tags"
        loading={isSearchPending}
      />
      <Button intent="secondary" icon={FileAddIcon} onClick={onCreate}>
        Create tag
      </Button>
      <Tooltip content={isDisabled ? "Select tags to delete" : "Delete selected tags"}>
        <span className="inline-block">
          <Button
            aria-label="Delete selected tags"
            intent="secondary"
            icon={Delete02Icon}
            onClick={onBulkDelete}
            disabled={isDisabled}
            className="size-8 p-0"
          />
        </span>
      </Tooltip>
    </div>
  )
}
