import { Button, ButtonLink, SearchInput, Tooltip } from "@/components/ui"
import { FileAddIcon, FileExportIcon, Delete02Icon } from "@hugeicons/core-free-icons"

type ToolbarProps = {
  query: string
  onQueryChange: (query: string) => void
  isSearchPending: boolean
  selectedCount: number
  onBulkExport: () => void
  onBulkDelete: () => void
  isBulkExporting: boolean
}

export function Toolbar(props: Readonly<ToolbarProps>) {
  const { query, onQueryChange, isSearchPending, selectedCount, onBulkExport, onBulkDelete, isBulkExporting } = props
  const isDisabled = selectedCount === 0

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput
        value={query}
        onChange={onQueryChange}
        placeholder="Search resumes"
        loading={isSearchPending}
      />
      <ButtonLink intent="secondary" icon={FileAddIcon} to="/resumes/create">
        New resume
      </ButtonLink>
      <Tooltip
        content={
          isDisabled
            ? "Select resumes to export"
            : isBulkExporting
              ? "Exporting..."
              : "Export selected"
        }
      >
        <span className="inline-block">
          <Button
            aria-label="Export selected"
            intent="secondary"
            icon={FileExportIcon}
            onClick={onBulkExport}
            disabled={isDisabled || isBulkExporting}
            className="size-8 p-0"
          />
        </span>
      </Tooltip>
      <Tooltip content={isDisabled ? "Select resumes to delete" : "Delete selected"}>
        <span className="inline-block">
          <Button
            aria-label="Delete selected"
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
