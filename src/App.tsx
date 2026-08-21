import { ModalProvider } from '@/components/modal'
import { Toaster } from '@/components/toast'
import AppRoutes from '@/routes'

function App() {
  return (
    <ModalProvider>
      <AppRoutes />
      <Toaster />
    </ModalProvider>
  )
}

export default App
