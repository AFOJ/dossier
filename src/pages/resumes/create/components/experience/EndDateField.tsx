import { Input } from "@/components/ui"
import { SyncSwitch } from "@/pages/resumes/create/components/SyncSwitch"

type EndDateFieldProps = {
  id: string
  value?: string
  error?: string
  isPresent: boolean
  onValueChange: (value: string | undefined) => void
  onPresentChange: (present: boolean) => void
}

export function EndDateField(props: Readonly<EndDateFieldProps>) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-gray-900">End date</p>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Input
          id={props.id}
          type="month"
          aria-label="End date"
          aria-invalid={props.error ? true : undefined}
          disabled={props.isPresent}
          className="min-w-0 flex-1 basis-40"
          value={props.value ?? ""}
          onChange={(event) => props.onValueChange(event.target.value)}
        />

        <div className="flex shrink-0 items-center gap-2">
          <SyncSwitch
            checked={props.isPresent}
            onCheckedChange={props.onPresentChange}
            label="I currently work here"
          />
          <span className="text-sm font-medium text-gray-900">I currently work here</span>
        </div>
      </div>

      {props.error && (
        <p role="alert" className="text-xs text-red-700">
          {props.error}
        </p>
      )}
    </div>
  )
}
