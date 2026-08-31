import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PropsWithChildren,
} from 'react'
import { createPortal } from 'react-dom'
import {
  ModalContext,
  type ModalComponent,
  type ModalContextValue,
  type ModalEntry,
} from '@/components/modal/modalContext'

const focusableSelector =
  'a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function ModalProvider({ children }: Readonly<PropsWithChildren>) {
  const [modals, setModals] = useState<ModalEntry[]>([])

  const openModal = useCallback<ModalContextValue['openModal']>(
    (id, Content, data, options) => {
      setModals((current) => [
        ...current.filter((modal) => modal.id !== id),
        { id, Content: Content as ModalComponent<unknown>, data, options },
      ])
    },
    [],
  )

  const closeModal = useCallback((id: string) => {
    setModals((current) => current.filter((modal) => modal.id !== id))
  }, [])

  const isOpen = useCallback(
    (id: string) => modals.some((modal) => modal.id === id),
    [modals],
  )

  useEffect(() => {
    if (modals.length === 0) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [modals.length])

  return (
    <ModalContext.Provider value={{ openModal, closeModal, isOpen }}>
      {children}
      {modals.map((modal, index) => (
        <ModalSurface
          key={modal.id}
          onClose={() => closeModal(modal.id)}
          options={modal.options}
          isTopmost={index === modals.length - 1}
          zIndex={50 + index * 2}
        >
          <modal.Content data={modal.data} close={() => closeModal(modal.id)} />
        </ModalSurface>
      ))}
    </ModalContext.Provider>
  )
}

type ModalSurfaceProps = PropsWithChildren<{
  onClose: () => void
  options: ModalEntry['options']
  isTopmost: boolean
  zIndex: number
}>

function ModalSurface(props: Readonly<ModalSurfaceProps>) {
  const { children, onClose, options, isTopmost, zIndex } = props
  const dialogRef = useRef<HTMLDivElement>(null)
  const lastFocusedElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isTopmost) {
      return
    }

    lastFocusedElement.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    const dialog = dialogRef.current
    const initialFocus = dialog?.querySelector<HTMLElement>(
      `[autofocus], ${focusableSelector}`,
    )
    ;(initialFocus ?? dialog)?.focus()

    return () => {
      lastFocusedElement.current?.focus()
    }
  }, [isTopmost])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isTopmost) {
      return
    }

    if (event.key === 'Escape' && options.closeOnEscape) {
      event.preventDefault()
      onClose()
      return
    }

    if (event.key !== 'Tab') return

    const focusable =
      dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector)

    if (!focusable || focusable.length === 0) {
      event.preventDefault()
      dialogRef.current?.focus()
      return
    }

    const first = focusable.item(0)
    const last = focusable.item(focusable.length - 1)

    if (!first || !last) return
    const activeElement = document.activeElement

    if (event.shiftKey && activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const modal = (
    <div
      className="fixed inset-0 flex items-center justify-center bg-gray-950/40 p-4"
      style={{ zIndex }}
      onMouseDown={(event) => {
        if (
          isTopmost &&
          options.closeOnBackdropClick &&
          event.target === event.currentTarget
        ) {
          onClose()
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={`w-full rounded-xl bg-white shadow-xl outline-none p-4 sm:p-6 ${options.contentClassName}`}
      >
        {children}
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
