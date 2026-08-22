import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Trash,
} from '@hugeicons/core-free-icons'
import { useState, type ReactNode } from 'react'
import { Button, Input } from '@/components/ui'

type SectionCardProps = {
  label: string
  title: string
  onTitleChange: (title: string) => void
  isFirst: boolean
  isLast: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
  children: ReactNode
}

export function SectionCard(props: Readonly<SectionCardProps>) {
  const {
    label,
    title,
    onTitleChange,
    isFirst,
    isLast,
    onMoveUp,
    onMoveDown,
    onRemove,
    children,
  } = props

  const [titleInputId] = useState(() => `section-title-${crypto.randomUUID()}`)

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-gray-200 p-4">
      <div className="flex flex-col-reverse items-start gap-2 sm:flex-row sm:items-center">
        <Input
          id={titleInputId}
          aria-label="Section title"
          className="min-w-0 sm:order-2 sm:flex-1"
          placeholder={`Section title: ${label}`}
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
        />

        <div className="flex items-center gap-1 sm:contents">
          <Button
            type="button"
            intent="secondary"
            icon={ArrowUp01Icon}
            disabled={isFirst}
            onClick={onMoveUp}
            aria-label={`Move ${title || label} section up`}
          />
          <Button
            type="button"
            intent="secondary"
            icon={ArrowDown01Icon}
            disabled={isLast}
            onClick={onMoveDown}
            aria-label={`Move ${title || label} section down`}
          />
          <Button
            type="button"
            intent="secondary"
            iconClassname="text-gray-500 hover:text-red-500"
            icon={Trash}
            onClick={onRemove}
            aria-label={`Remove ${title || label} section`}
            className="ml-auto sm:order-3 sm:ml-0"
          />
        </div>
      </div>

      {children}
    </div>
  )
}

export type ItemControlsProps = {
  label: string
  index: number
  isFirst: boolean
  isLast: boolean
  onMove: (from: number, to: number) => void
  onRemove: () => void
}

export function ItemControls(props: Readonly<ItemControlsProps>) {
  const { label, index, isFirst, isLast, onMove, onRemove } = props

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        intent="secondary"
        icon={ArrowUp01Icon}
        disabled={isFirst}
        onClick={() => onMove(index, index - 1)}
        aria-label={`Move ${label} up`}
      />
      <Button
        type="button"
        intent="secondary"
        icon={ArrowDown01Icon}
        disabled={isLast}
        onClick={() => onMove(index, index + 1)}
        aria-label={`Move ${label} down`}
      />
      <Button
        type="button"
        intent="secondary"
        iconClassname="text-gray-500 hover:text-red-500"
        icon={Trash}
        onClick={onRemove}
        aria-label={`Remove ${label}`}
      />
    </div>
  )
}

type AddItemButtonProps = {
  label: string
  onAdd: () => void
}

export function AddItemButton(props: Readonly<AddItemButtonProps>) {
  return (
    <Button
      type="button"
      intent="secondary"
      icon={Add01Icon}
      iconClassname="text-gray-400"
      className="self-start"
      onClick={props.onAdd}
    >
      {props.label}
    </Button>
  )
}
