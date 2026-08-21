import { Toast as BaseToast } from '@base-ui/react/toast'

export type ToastIntent = 'success' | 'error'

export interface ToastData {
  intent: ToastIntent
}

export const toastManager = BaseToast.createToastManager<ToastData>()

export function useToast() {
  return {
    success: (title: string, description?: string) =>
      showToast('success', { title, description }),
    error: (title: string, description?: string) =>
      showToast('error', { title, description }),
  }
}

function showToast(
  intent: ToastIntent,
  options: { title: string; description?: string },
) {
  return toastManager.add({
    ...options,
    data: { intent },
    priority: intent === 'error' ? 'high' : 'low',
    timeout: intent === 'error' ? 8000 : 4000,
  })
}
