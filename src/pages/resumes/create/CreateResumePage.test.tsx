import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import CreateResumePage from '@/pages/resumes/create/CreateResumePage'
import useProtectedRouteData from '@/hooks/useProtectedRouteData'
import { createResume } from '@/db/resume'
import type { Profile } from '@/db/db'
import { ModalProvider } from '@/components/modal'

vi.mock('@/db/resume', () => ({
  createResume: vi.fn(),
}))

vi.mock('@/hooks/useProtectedRouteData', () => ({
  default: vi.fn(),
}))

const mockUseProtectedRouteData = vi.mocked(useProtectedRouteData)

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
}

vi.mock('@/components/toast', () => ({
  useToast: () => mockToast,
}))

const profile: Profile = {
  id: 1,
  full_name: 'John Doe',
  role: null,
  email: null,
  phone: null,
  location: null,
  links: [],
}

function renderPage() {
  const router = createMemoryRouter(
    [
      {
        path: '/resumes/create',
        element: (
          <ModalProvider>
            <CreateResumePage />
          </ModalProvider>
        ),
      },
      { path: '/resumes', element: <div>Resumes list</div> },
    ],
    { initialEntries: ['/resumes/create'] },
  )

  return render(<RouterProvider router={router} />)
}

async function addSectionViaMenu(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
) {
  await user.click(screen.getByRole('button', { name: /Add section/i }))
  await user.click(
    await screen.findByRole('menuitem', { name: new RegExp(`^${label}`) }),
  )
}

describe('CreateResumePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseProtectedRouteData.mockReturnValue({ profile })
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('shows the empty state before any section is added', () => {
    renderPage()

    expect(screen.getByText(/No sections yet/i)).toBeInTheDocument()
  })

  it('prefills contact details from the profile and reveals them when unsynced', async () => {
    const user = userEvent.setup()
    renderPage()

    const syncSwitch = screen.getByRole('switch', {
      name: 'Use my profile information',
    })
    expect(syncSwitch).toBeChecked()

    await user.click(syncSwitch)

    expect(syncSwitch).not.toBeChecked()
    const fullName = screen.getByLabelText(/Full name/i)
    expect(fullName).toHaveValue('John Doe')
    expect(screen.getByPlaceholderText('Farmer')).toBeInTheDocument()
  })

  it('adds and edits a summary section via the add-section menu, then creates the resume', async () => {
    const user = userEvent.setup()
    vi.mocked(createResume).mockResolvedValueOnce('resume-1')
    renderPage()

    await addSectionViaMenu(user, 'Paragraph')

    const summary = screen.getByRole('textbox', { name: 'Paragraph text' })
    await user.type(summary, 'Seasoned engineer.')

    await user.type(screen.getByLabelText(/^Title/), 'My Resume')
    await user.click(screen.getByRole('button', { name: 'Create resume' }))

    await waitFor(() => {
      expect(createResume).toHaveBeenCalledWith(
        'My Resume',
        [{ type: 'summary', text: 'Seasoned engineer.' }],
        { syncProfile: true, contact: null },
      )
    })
    expect(await screen.findByText('Resumes list')).toBeInTheDocument()
  })

  it('blocks submission without a title', async () => {
    const user = userEvent.setup()
    renderPage()

    await addSectionViaMenu(user, 'Paragraph')
    const summary = screen.getByRole('textbox', { name: 'Paragraph text' })
    await user.type(summary, 'Some text')

    await user.click(screen.getByRole('button', { name: 'Create resume' }))

    expect(await screen.findByText('Title is required')).toBeInTheDocument()
    expect(createResume).not.toHaveBeenCalled()
  })
})
