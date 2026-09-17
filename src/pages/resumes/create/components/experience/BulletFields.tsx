import type { ExperienceCompanyRoleBullet } from "@/db/types"
import { Field, Input, Textarea } from "@/components/ui"
import { useId } from "react"

type BulletFieldsProps = {
  bullet: ExperienceCompanyRoleBullet
  index: number
  roleLabel: string
  bulletErrors: { title?: { message?: string }; text?: { message?: string } } | undefined
  onChange: (bullet: ExperienceCompanyRoleBullet) => void
}

export function BulletFields(props: Readonly<BulletFieldsProps>) {
  const { bullet, index, roleLabel, bulletErrors, onChange } = props

  const update = (patch: ExperienceCompanyRoleBullet) => onChange(patch)

  const headingId = useId()
  const textId = useId()

  if (bullet.type === "text") {
    return (
      <div className="flex flex-col gap-2">
        <Field label="Text" inputId={textId} required error={bulletErrors?.text?.message}>
          <Textarea
            id={textId}
            aria-label={`${roleLabel} bullet ${index + 1}`}
            aria-invalid={bulletErrors?.text ? true : undefined}
            placeholder="What did you achieve?"
            rows={3}
            value={bullet.text}
            className="w-full"
            onChange={(event) =>
              update({
                type: "text",
                text: event.target.value,
              })
            }
          />
        </Field>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <Field label="Heading" inputId={headingId} required error={bulletErrors?.title?.message}>
        <Input
          id={headingId}
          aria-label={`${roleLabel} bullet ${index + 1} heading`}
          aria-invalid={bulletErrors?.title ? true : undefined}
          placeholder="Heading"
          value={bullet.title}
          className="w-full"
          onChange={(event) =>
            update({
              ...bullet,
              title: event.target.value,
            })
          }
        />
      </Field>

      <Field label="Text" inputId={textId} required error={bulletErrors?.text?.message}>
        <Textarea
          id={textId}
          aria-label={`${roleLabel} bullet ${index + 1} text`}
          aria-invalid={bulletErrors?.text ? true : undefined}
          placeholder="What did you achieve?"
          rows={3}
          value={bullet.text}
          className="w-full"
          onChange={(event) =>
            update({
              ...bullet,
              text: event.target.value,
            })
          }
        />
      </Field>
    </div>
  )
}
