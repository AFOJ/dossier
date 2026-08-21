import { Toast as BaseToast } from '@base-ui/react/toast'
import type { ToastObject } from '@base-ui/react/toast'
import {
  Alert02Icon,
  CircleCheckIcon,
  Cancel01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { toastManager } from '@/components/toast/useToast'
import { cn } from '@/utils'
import './Toast.css'

const INTENT_STYLES = {
  success: 'text-green-600',
  error: 'text-red-600',
} as const

const INTENT_ICONS = {
  success: CircleCheckIcon,
  error: Alert02Icon,
} as const

type ToastIntent = keyof typeof INTENT_STYLES

export function Toaster() {
  return (
    <BaseToast.Provider toastManager={toastManager} limit={3}>
      <BaseToast.Portal>
        <BaseToast.Viewport className="toast-viewport">
          <ToastList />
        </BaseToast.Viewport>
      </BaseToast.Portal>
    </BaseToast.Provider>
  )
}

function ToastList() {
  const { toasts } = BaseToast.useToastManager()

  return (
    <>
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </>
  )
}

type AppToastData = Record<string, unknown>

type ToastCardProps = {
  toast: ToastObject<AppToastData>
}

function ToastCard({ toast }: Readonly<ToastCardProps>) {
  const intent = (toast.type as ToastIntent) ?? 'success'
  const Icon = INTENT_ICONS[intent]

  return (
    <BaseToast.Root toast={toast} className="toast-card">
      <BaseToast.Content className="toast-content">
        <HugeiconsIcon
          icon={Icon}
          size={20}
          strokeWidth={2}
          aria-hidden
          className={cn('shrink-0', INTENT_STYLES[intent])}
        />

        <div className="min-w-0 flex-1">
          <BaseToast.Title className="text-sm font-semibold text-gray-900">
            {toast.title}
          </BaseToast.Title>
          {toast.description && (
            <BaseToast.Description className="mt-0.5 text-sm leading-5 text-gray-500">
              {toast.description}
            </BaseToast.Description>
          )}
        </div>

        <BaseToast.Close
          aria-label="Dismiss notification"
          className="shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-gray-400"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2} />
        </BaseToast.Close>
      </BaseToast.Content>
    </BaseToast.Root>
  )
}
