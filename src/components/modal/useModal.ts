import {
  ModalContext,
  type ModalComponent,
  type ModalOptions,
  type ResolvedModalOptions,
} from '@/components/modal/modalContext'
import { useCallback, useContext, useEffect, useState } from 'react'

export {
  type ModalContentProps,
  type ModalOptions,
} from '@/components/modal/modalContext'

const defaultOptions: ResolvedModalOptions = {
  closeOnBackdropClick: true,
  closeOnEscape: true,
}

export function useModal<TData = undefined>(
  Content: ModalComponent<TData>,
  options: ModalOptions = {},
) {
  const context = useContext(ModalContext)
  const [id] = useState(() => `modal-${crypto.randomUUID()}`)

  if (!context) {
    throw new Error('useModal must be used within a ModalProvider.')
  }

  const { openModal, closeModal, isOpen } = context
  const open = useCallback(
    (data: TData) => openModal(id, Content, data, { ...defaultOptions, ...options }),
    [Content, id, openModal, options],
  )
  const close = useCallback(() => closeModal(id), [closeModal, id])

  useEffect(() => () => closeModal(id), [closeModal, id])

  return { open, close, isOpen: isOpen(id) }
}
