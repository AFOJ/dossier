import { Menu } from '@base-ui/react/menu'
import type { ExperienceCompanyRoleBullet } from '@/db/types'

type BulletAddMenuProps = {
  onAdd: (bullet: ExperienceCompanyRoleBullet) => void
}

export function BulletAddMenu(props: Readonly<BulletAddMenuProps>) {
  return (
    <Menu.Root>
      <Menu.Trigger className="inline-flex items-center gap-1.5 self-start rounded-lg border border-dashed border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-900 focus:outline-none focus-visible:ring-1 focus-visible:ring-gray-400">
        Add bullet
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner align="start" sideOffset={6}>
          <Menu.Popup className="z-50 w-52 rounded-lg border border-gray-200 bg-white p-1 shadow-lg outline-none">
            <Menu.Item
              className="flex cursor-pointer flex-col gap-0.5 rounded-md px-3 py-2 text-sm text-gray-700 outline-none data-highlighted:bg-gray-100 data-highlighted:text-gray-900"
              onClick={() => props.onAdd({ type: 'text', text: '' })}
            >
              <span className="font-medium">Simple bullet</span>
              <span className="text-xs text-gray-600">
                A single line of text
              </span>
            </Menu.Item>
            <Menu.Item
              className="flex cursor-pointer flex-col gap-0.5 rounded-md px-3 py-2 text-sm text-gray-700 outline-none data-highlighted:bg-gray-100 data-highlighted:text-gray-900"
              onClick={() =>
                props.onAdd({ type: 'text-with-title', title: '', text: '' })
              }
            >
              <span className="font-medium">Titled bullet</span>
              <span className="text-xs text-gray-600">
                A heading followed by text
              </span>
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
