import { ButtonLink, SearchInput } from '@/components/ui'
import { FileAddIcon } from '@hugeicons/core-free-icons'

type ToolbarProps = {
  query: string
  onQueryChange: (query: string) => void
}

export function Toolbar(props: Readonly<ToolbarProps>) {
  const { query, onQueryChange } = props

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput
        value={query}
        onChange={onQueryChange}
        placeholder="Search resumes"
      />
      <ButtonLink intent="secondary" icon={FileAddIcon} to="/resumes/create">
        New resume
      </ButtonLink>
    </div>
  )
}
