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

  it('adds and edits a paragraph section via the add-section menu, then creates the resume', async () => {
    const user = userEvent.setup()
    vi.mocked(createResume).mockResolvedValueOnce('resume-1')
    renderPage()

    await addSectionViaMenu(user, 'Paragraph')

    const sectionTitle = screen.getByLabelText('Section title')
    await user.type(sectionTitle, 'Summary')

    const paragraph = screen.getByRole('textbox', { name: 'Summary text' })
    await user.type(paragraph, 'Seasoned engineer.')

    await user.type(screen.getByLabelText(/^Title/), 'My Resume')
    await user.click(screen.getByRole('button', { name: 'Create resume' }))

    await waitFor(() => {
      expect(createResume).toHaveBeenCalledWith(
        'My Resume',
        [{ type: 'paragraph', text: 'Seasoned engineer.', title: 'Summary' }],
        { syncProfile: true, contact: null },
      )
    })
    expect(await screen.findByText('Resumes list')).toBeInTheDocument()
  })

  it('lets the company switch be toggled off and back on beside the end date', async () => {
    const user = userEvent.setup()
    renderPage()

    await addSectionViaMenu(user, 'Experience')

    const currentSwitch = screen.getByRole('switch', {
      name: 'I currently work here',
    })
    expect(currentSwitch).toBeChecked()

    const endInput = screen.getByLabelText(/^End date/)
    expect(endInput).toBeDisabled()

    await user.click(currentSwitch)

    expect(currentSwitch).not.toBeChecked()
    expect(endInput).not.toBeDisabled()
    expect(endInput).toHaveValue('')

    await user.click(currentSwitch)

    expect(currentSwitch).toBeChecked()
    expect(endInput).toBeDisabled()
  })

  it('gives each role its own current-work switch', async () => {
    const user = userEvent.setup()
    renderPage()

    await addSectionViaMenu(user, 'Experience')
    await user.click(screen.getByRole('button', { name: /Add role/i }))

    const switches = screen.getAllByRole('switch', {
      name: 'I currently work here',
    })
    expect(switches).toHaveLength(2)
    expect(switches[0]).toBeChecked()
    expect(switches[1]).not.toBeChecked()

    const endInputs = screen.getAllByLabelText(/^End date/)
    expect(endInputs[0]).toBeDisabled()
    expect(endInputs[1]).not.toBeDisabled()

    await user.click(switches[1])

    expect(switches[1]).toBeChecked()
    expect(endInputs[1]).toBeDisabled()
  })

  it('blocks submission without a title', async () => {
    const user = userEvent.setup()
    renderPage()

    await addSectionViaMenu(user, 'Paragraph')
    const paragraph = screen.getByRole('textbox', { name: 'Paragraph text' })
    await user.type(paragraph, 'Some text')

    await user.click(screen.getByRole('button', { name: 'Create resume' }))

    // Find the error message for the resume title (inputId="resume-title"), not the section title
    const resumeTitleInput = screen.getByRole('textbox', { name: 'Title *' })
    const describedBy = resumeTitleInput.getAttribute('aria-describedby') || ''
    const resumeTitleError = await screen.findByText('Title is required', {
      selector: describedBy.split(' ').map((id) => `[id="${id}"]`).join(','),
    })
    expect(resumeTitleError).toBeInTheDocument()
    expect(createResume).not.toHaveBeenCalled()
  })
})
