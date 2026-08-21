import { createContext, type ComponentType } from 'react'

export interface ModalContentProps<TData = undefined> {
  data: TData
  close: () => void
}

export interface ModalOptions {
  closeOnBackdropClick?: boolean
  closeOnEscape?: boolean
}

export interface ResolvedModalOptions {
  closeOnBackdropClick: boolean
  closeOnEscape: boolean
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
