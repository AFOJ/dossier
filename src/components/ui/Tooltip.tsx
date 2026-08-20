import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip'
import type { ReactElement } from 'react'

type TooltipProps = {
  children: ReactElement
  content: string
}

export function Tooltip(props: Readonly<TooltipProps>) {
  const { children, content } = props

  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner sideOffset={6}>
          <BaseTooltip.Popup className="rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white shadow-sm">
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  )
}
