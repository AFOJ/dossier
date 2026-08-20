import {
  Add01Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  Trash,
} from '@hugeicons/core-free-icons'
import { Button, Field, Heading2, Input } from '@/components/ui'
import { useFieldArray } from 'react-hook-form'
import { useProfileFormContext } from '@/pages/profile/create/hooks/useCreateProfileForm'

export function SocialLinksFields() {
  const { control } = useProfileFormContext()
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'socials',
  })

  return (
    <div className="flex flex-col gap-4">
      <Heading2>Social links</Heading2>

      {fields.map((field, index) => (
        <SocialLinkRow
          key={field.id}
          index={index}
          isFirst={index === 0}
          isLast={index === fields.length - 1}
          onMove={move}
          onRemove={remove}
        />
      ))}

      <Button
        type="button"
        icon={Add01Icon}
        intent="secondary"
        iconClassname="text-gray-400"
        onClick={() => append({ label: '', url: '' })}
      >
        Add social link
      </Button>
    </div>
  )
}

type SocialLinkRowProps = {
  index: number
  isFirst: boolean
  isLast: boolean
  onMove: (from: number, to: number) => void
  onRemove: (index: number) => void
}

function SocialLinkRow(props: Readonly<SocialLinkRowProps>) {
  const { index, isFirst, isLast, onMove, onRemove } = props

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3 sm:flex-row sm:gap-4 sm:items-start sm:border-none sm:p-0">
      <div className="flex items-center justify-between sm:contents">
        <div className="flex items-center gap-1 sm:pt-1">
          <ReorderControls
            index={index}
            isFirst={isFirst}
            isLast={isLast}
            onMove={onMove}
          />
        </div>
        <div className="sm:order-last sm:pt-1">
          <RemoveButton index={index} onRemove={onRemove} />
        </div>
      </div>

      <SocialLinkInputs index={index} />
    </div>
  )
}

type ReorderControlsProps = {
  index: number
  isFirst: boolean
  isLast: boolean
  onMove: (from: number, to: number) => void
}

function ReorderControls(props: Readonly<ReorderControlsProps>) {
  const { index, isFirst, isLast, onMove } = props

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        intent="secondary"
        icon={ArrowUp01Icon}
        disabled={isFirst}
        onClick={() => onMove(index, index - 1)}
        aria-label={`Move link ${index + 1} up`}
      />
      <Button
        type="button"
        intent="secondary"
        icon={ArrowDown01Icon}
        disabled={isLast}
        onClick={() => onMove(index, index + 1)}
        aria-label={`Move link ${index + 1} down`}
      />
    </div>
  )
}

type SocialLinkInputsProps = {
  index: number
}

function SocialLinkInputs(props: Readonly<SocialLinkInputsProps>) {
  const { index } = props
  const {
    register,
    formState: { errors },
  } = useProfileFormContext()

  const fieldErrors = errors.socials?.[index]

  return (
    <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-start">
      <div className="grow">
        <Field
          inputId={`socials.${index}.label`}
          error={fieldErrors?.label?.message}
        >
          <Input
            id={`socials.${index}.label`}
            placeholder="Label (e.g. GitHub)"
            {...register(`socials.${index}.label`)}
          />
        </Field>
      </div>

      <div className="grow">
        <Field
          inputId={`socials.${index}.url`}
          error={fieldErrors?.url?.message}
        >
          <Input
            id={`socials.${index}.url`}
            placeholder="URL"
            {...register(`socials.${index}.url`)}
          />
        </Field>
      </div>
    </div>
  )
}

type RemoveButtonProps = {
  index: number
  onRemove: (index: number) => void
}

function RemoveButton(props: Readonly<RemoveButtonProps>) {
  const { index, onRemove } = props

  return (
    <Button
      type="button"
      intent="secondary"
      iconClassname="text-gray-500 hover:text-red-500"
      icon={Trash}
      onClick={() => onRemove(index)}
      aria-label={`Remove link ${index + 1}`}
    />
  )
}
