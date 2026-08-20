import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Drawer } from '@base-ui/react/drawer'
import { Menu01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Sidebar } from './Sidebar'

export default function ProtectedLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="min-h-dvh bg-white lg:pl-64">
      <Sidebar className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-gray-200 lg:flex" />

      <Drawer.Root
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        swipeDirection="left"
      >
        <MobileHeader />

        <MobileDrawer onNavigate={() => setDrawerOpen(false)} />
      </Drawer.Root>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <Outlet />
      </main>
    </div>
  )
}

function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
      <Drawer.Trigger
        aria-label="Open navigation menu"
        className="inline-flex size-10 items-center justify-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-400"
      >
        <HugeiconsIcon icon={Menu01Icon} size={20} strokeWidth={2} />
      </Drawer.Trigger>
      <span className="font-heading text-base font-bold text-gray-900">
        Dossier
      </span>
    </header>
  )
}

type MobileDrawerProps = {
  onNavigate: () => void
}

function MobileDrawer(props: Readonly<MobileDrawerProps>) {
  const { onNavigate } = props

  return (
    <Drawer.Portal>
      <Drawer.Backdrop className="fixed inset-0 bg-black/40 transition-opacity duration-300 data-starting-style:opacity-0 data-ending-style:opacity-0 lg:hidden" />
      <Drawer.Viewport className="fixed inset-0 flex justify-start lg:hidden">
        <Drawer.Popup className="h-dvh w-64 max-w-[85vw] overflow-y-auto overscroll-contain bg-white outline-none transform-[translateX(var(--drawer-swipe-movement-x))] transition-transform duration-300 ease-out data-swiping:duration-0 data-starting-style:transform-[translateX(-100%)] data-ending-style:transform-[translateX(-100%)]">
          <Drawer.Content className="h-full">
            <Sidebar onNavigate={onNavigate} />
          </Drawer.Content>
        </Drawer.Popup>
      </Drawer.Viewport>
    </Drawer.Portal>
  )
}
