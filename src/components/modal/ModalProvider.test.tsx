import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import {
  ModalProvider,
  type ModalContentProps,
  useModal,
} from '@/components/modal'

function TestModal({ data, close }: Readonly<ModalContentProps<string>>) {
  return (
    <div>
      <p>{data}</p>
      <button type="button" autoFocus onClick={close}>
        Close {data}
      </button>
    </div>
  )
}

function ModalControls() {
  const firstModal = useModal(TestModal)
  const secondModal = useModal(TestModal)
  const persistentModal = useModal(TestModal, {
    closeOnBackdropClick: false,
    closeOnEscape: false,
  })

  return (
    <>
      <button type="button" onClick={() => firstModal.open('First modal')}>
        Open first
      </button>
      <button type="button" onClick={() => secondModal.open('Second modal')}>
        Open second
      </button>
      <button
        type="button"
        onClick={() => persistentModal.open('Persistent modal')}
      >
        Open persistent
      </button>
    </>
  )
}

describe('ModalProvider', () => {
  it('stacks modals by opening order and traps focus in the top modal', async () => {
    const user = userEvent.setup()
    render(
      <ModalProvider>
        <ModalControls />
      </ModalProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Open first' }))
    await user.click(screen.getByRole('button', { name: 'Open second' }))

    const dialogs = screen.getAllByRole('dialog')
    expect(dialogs).toHaveLength(2)
    expect(dialogs[0]).toHaveTextContent('First modal')
    expect(dialogs[1]).toHaveTextContent('Second modal')
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Close Second modal' }),
    )

    await user.keyboard('{Escape}')

    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    expect(screen.getByRole('dialog')).toHaveTextContent('First modal')
  })

  it('honours dismissal options supplied to useModal', async () => {
    const user = userEvent.setup()
    render(
      <ModalProvider>
        <ModalControls />
      </ModalProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Open persistent' }))
    const dialog = screen.getByRole('dialog')

    await user.keyboard('{Escape}')
    await user.click(dialog.parentElement!)

    expect(screen.getByRole('dialog')).toHaveTextContent('Persistent modal')

    await user.click(
      screen.getByRole('button', { name: 'Close Persistent modal' }),
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
