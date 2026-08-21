import { createContext, type ComponentType } from 'react'

export interface ModalContentProps<TData = undefined> {
  data: TData
  close: () => void
}

export type ModalComponent<TData> = ComponentType<ModalContentProps<TData>>

export interface ModalEntry {
  id: string
  Content: ModalComponent<unknown>
  data: unknown
}

export interface ModalContextValue {
  openModal: <TData>(
    id: string,
    Content: ModalComponent<TData>,
    data: TData,
  ) => void
  closeModal: (id: string) => void
  isOpen: (id: string) => boolean
}

export const ModalContext = createContext<ModalContextValue | null>(null)
