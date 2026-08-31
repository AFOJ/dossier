import { createContext, type ComponentType } from 'react'

export interface ModalContentProps<TData = undefined> {
  data: TData
  close: () => void
}

export interface ModalOptions {
  closeOnBackdropClick?: boolean
  closeOnEscape?: boolean
  /** Extra classes for the dialog surface, e.g. a wider max-width. */
  contentClassName?: string
}

export interface ResolvedModalOptions {
  closeOnBackdropClick: boolean
  closeOnEscape: boolean
  contentClassName: string
}

export type ModalComponent<TData> = ComponentType<ModalContentProps<TData>>

export interface ModalEntry {
  id: string
  Content: ModalComponent<unknown>
  data: unknown
  options: ResolvedModalOptions
}

export interface ModalContextValue {
  openModal: <TData>(
    id: string,
    Content: ModalComponent<TData>,
    data: TData,
    options: ResolvedModalOptions,
  ) => void
  closeModal: (id: string) => void
  isOpen: (id: string) => boolean
}

export const ModalContext = createContext<ModalContextValue | null>(null)
