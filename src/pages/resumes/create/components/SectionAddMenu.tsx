import { Menu } from '@base-ui/react/menu'
import { Add01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { SECTION_LABELS } from '@/pages/resumes/create/components/sectionLabels'
import type { SectionType } from '@/pages/resumes/create/hooks/useCreateResumeForm'

const SECTION_DESCRIPTIONS: Record<SectionType, string> = {
  summary: 'A named paragraph of text',
  education: 'Schools, degrees and grades',
  skills: 'Grouped skill lists',
  experience: 'Companies, roles and bullets',
}

type SectionAddMenuProps = {
  onSelect: (type: SectionType) => void
}

export function SectionAddMenu(props: Readonly<SectionAddMenuProps>) {
  return (
    <Menu.Root>
      <Menu.Trigger className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-900 focus:outline-none focus-visible:ring-1 focus-visible:ring-gray-400 data-popup-open:border-gray-400">
        <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2} />
        Add section
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner align="start" sideOffset={6}>
          <Menu.Popup className="z-50 w-72 rounded-lg border border-gray-200 bg-white p-1 shadow-lg outline-none">
            {(Object.keys(SECTION_LABELS) as SectionType[]).map((type) => (
              <Menu.Item
                key={type}
                className="flex cursor-pointer flex-col gap-0.5 rounded-md px-3 py-2 text-sm text-gray-700 outline-none data-highlighted:bg-gray-100 data-highlighted:text-gray-900"
                onClick={() => props.onSelect(type)}
              >
                <span className="font-medium">{SECTION_LABELS[type]}</span>
                <span className="text-xs text-gray-500">
                  {SECTION_DESCRIPTIONS[type]}
                </span>
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
