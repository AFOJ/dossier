import { ModalProvider } from '@/components/modal'
import AppRoutes from '@/routes'

function App() {
  return (
    <ModalProvider>
      <AppRoutes />
    </ModalProvider>
  )
}

export default App
