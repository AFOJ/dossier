import { Toast as BaseToast } from '@base-ui/react/toast'

export const toastManager = BaseToast.createToastManager()

type ToastIntent = 'success' | 'error'

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
    type: intent,
    priority: intent === 'error' ? 'high' : 'low',
    timeout: intent === 'error' ? 8000 : 4000,
  })
}
