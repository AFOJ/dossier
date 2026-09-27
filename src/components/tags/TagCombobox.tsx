import { Combobox } from "@base-ui/react/combobox"
import { useLiveQuery } from "dexie-react-hooks"
import { listTags, normaliseTagIds, tagColourToCss, tagTextColour } from "@/db/tag"
import type { Tag } from "@/db/db"
import { cn } from "@/utils"

export type TagComboboxProps = {
  value: number[]
  onChange: (tagIds: number[]) => void
  ariaLabel: string
  id?: string
  placeholder?: string
  className?: string
}

export function TagCombobox(props: Readonly<TagComboboxProps>) {
  const { value, onChange, ariaLabel, id, placeholder = "Search tags", className } = props
  const tags = useLiveQuery(() => listTags(), []) ?? []
  const selectedTags = tags.filter((tag) => tag.id !== undefined && value.includes(tag.id))

  return (
    <Combobox.Root
      items={tags}
      multiple
      value={selectedTags}
      onValueChange={(nextTags) => {
        onChange(
          normaliseTagIds(
            (nextTags ?? []).flatMap((tag) => (tag.id === undefined ? [] : [tag.id])),
          ),
        )
      }}
      itemToStringLabel={(tag) => tag.name}
      itemToStringValue={(tag) => String(tag.id)}
      isItemEqualToValue={(first, second) => first.id === second.id}
    >
      <Combobox.InputGroup
        className={cn(
          "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-[10px] border border-gray-300 bg-white px-2 py-1.5",
          "hover:border-gray-400 focus-within:border-gray-600 focus-within:ring-1 focus-within:ring-gray-600",
          className,
        )}
      >
        <Combobox.Chips className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <Combobox.Value>
            {(currentTags: Tag[]) => (
              <>
                {currentTags.map((tag) => (
                  <Combobox.Chip
                    key={tag.id}
                    className="flex max-w-full items-center gap-1 rounded-full py-1 pr-1 pl-2.5 text-xs font-semibold"
                    style={{
                      backgroundColor: tagColourToCss(tag.colour),
                      color: tagTextColour(tag.colour),
                    }}
                  >
                    <span className="truncate">{tag.name}</span>
                    <Combobox.ChipRemove
                      aria-label={`Remove ${tag.name}`}
                      className="rounded-full p-0.5 text-current opacity-70 hover:bg-black/10 hover:opacity-100"
                    >
                      ×
                    </Combobox.ChipRemove>
                  </Combobox.Chip>
                ))}
                <Combobox.Input
                  id={id}
                  aria-label={ariaLabel}
                  className="min-w-20 flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-gray-400"
                  placeholder={currentTags.length === 0 ? placeholder : ""}
                />
              </>
            )}
          </Combobox.Value>
        </Combobox.Chips>
      </Combobox.InputGroup>

      <Combobox.Portal>
        <Combobox.Positioner sideOffset={4} className="z-50">
          <Combobox.Popup className="min-w-(--anchor-width) overflow-hidden rounded-[10px] border border-gray-200 bg-white shadow-lg">
            <Combobox.Empty className="empty:hidden px-3 py-2 text-sm text-gray-500">
              No tags found.
            </Combobox.Empty>
            <Combobox.List>
              {(tag: Tag) => (
                <Combobox.Item
                  key={tag.id}
                  value={tag}
                  className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-gray-900 outline-none data-highlighted:bg-gray-100"
                >
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: tagColourToCss(tag.colour),
                    }}
                  />
                  <span>{tag.name}</span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}
