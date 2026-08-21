import { Button, SearchInput } from '@/components/ui'
import { FileAddIcon } from '@hugeicons/core-free-icons'

type ToolbarProps = {
  query: string
  onQueryChange: (query: string) => void
  onCreateResume: () => void
}

export function Toolbar(props: Readonly<ToolbarProps>) {
  const { query, onQueryChange, onCreateResume } = props

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput
        value={query}
        onChange={onQueryChange}
        placeholder="Search resumes"
      />
      <Button intent="secondary" icon={FileAddIcon} onClick={onCreateResume}>
        New resume
      </Button>
    </div>
  )
}
