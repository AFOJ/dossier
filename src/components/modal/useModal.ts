import {
  ModalContext,
  type ModalComponent,
} from '@/components/modal/modalContext'
import { useCallback, useContext, useEffect, useState } from 'react'

export { type ModalContentProps } from '@/components/modal/modalContext'

export function useModal<TData = undefined>(Content: ModalComponent<TData>) {
  const context = useContext(ModalContext)
  const [id] = useState(() => `modal-${crypto.randomUUID()}`)

  if (!context) {
    throw new Error('useModal must be used within a ModalProvider.')
  }

  const { openModal, closeModal, isOpen } = context
  const open = useCallback(
    (data: TData) => openModal(id, Content, data),
    [Content, id, openModal],
  )
  const close = useCallback(() => closeModal(id), [closeModal, id])

  useEffect(() => () => closeModal(id), [closeModal, id])

  return { open, close, isOpen: isOpen(id) }
}
