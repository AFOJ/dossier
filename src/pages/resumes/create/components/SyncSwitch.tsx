import { Switch } from '@base-ui/react/switch'
import { cn } from '@/utils'

type SyncSwitchProps = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export function SyncSwitch(props: Readonly<SyncSwitchProps>) {
  return (
    <Switch.Root
      aria-label="Use my profile information"
      checked={props.checked}
      onCheckedChange={props.onCheckedChange}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2',
        'data-checked:bg-gray-900 data-unchecked:bg-gray-300',
      )}
    >
      <Switch.Thumb
        className={cn(
          'block size-5 rounded-full bg-white shadow transition-transform',
          'data-checked:translate-x-5.5 data-unchecked:translate-x-0.5',
        )}
      />
    </Switch.Root>
  )
}
