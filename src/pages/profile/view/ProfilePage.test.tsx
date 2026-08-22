import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { deleteProfile, upsertProfile, exportProfile } from '@/db/profile'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { downloadJson, getExportFilename } from '@/lib/download'
import { ModalProvider } from '@/components/modal'
import { render, screen, waitFor } from '@testing-library/react'
import ProfilePage from '@/pages/profile/view/ProfilePage'
import type { Profile } from '@/db/db'
import useProtectedRouteData from '@/hooks/useProtectedRouteData'
import userEvent from '@testing-library/user-event'

vi.mock('@/hooks/useProtectedRouteData', () => ({
  default: vi.fn(),
}))

vi.mock('@/db/profile', () => ({
  upsertProfile: vi.fn(),
  deleteProfile: vi.fn(),
  exportProfile: vi.fn(),
}))

vi.mock('@/lib/download', () => ({
  downloadJson: vi.fn(),
  getExportFilename: vi.fn(
    (kind: string) => `dossier-${kind}-export-2026-08-23.json`,
  ),
}))

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
}

vi.mock('@/components/toast', () => ({
  useToast: () => mockToast,
}))

const mockUseProtectedRouteData = vi.mocked(useProtectedRouteData)

const profile: Profile = {
  id: 1,
  full_name: 'John Doe',
  role: 'Frontend Engineer',
  email: 'john@doe.com',
  phone: '',
  location: '',
  links: [],
}

function renderPage() {
  const router = createMemoryRouter(
    [
      {
        path: '/profile',
        element: (
          <ModalProvider>
            <ProfilePage />
          </ModalProvider>
        ),
      },
      { path: '/setup', element: <div>Setup page</div> },
    ],
    { initialEntries: ['/profile'] },
  )

  return render(<RouterProvider router={router} />)
}

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseProtectedRouteData.mockReturnValue({ profile })
  })

  it('prefills the form with the profile data', () => {
    renderPage()

    expect(screen.getByLabelText(/full name/i)).toHaveValue('John Doe')
    expect(screen.getByLabelText('Job Title')).toHaveValue('Frontend Engineer')
    expect(screen.getByLabelText('Email')).toHaveValue('john@doe.com')
  })

  it('keeps save disabled until the form changes', async () => {
    const user = userEvent.setup()
    renderPage()

    const saveButton = screen.getByRole('button', { name: 'Save changes' })
    expect(saveButton).toBeDisabled()

    await user.type(screen.getByLabelText(/full name/i), '!')

    expect(saveButton).toBeEnabled()
  })

  it('saves the changes and clears the dirty state', async () => {
    const user = userEvent.setup()
    vi.mocked(upsertProfile).mockResolvedValueOnce(1)
    renderPage()

    const fullName = screen.getByLabelText(/full name/i)
    await user.clear(fullName)
    await user.type(fullName, 'Jane Doe')

    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(upsertProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          full_name: 'Jane Doe',
          role: 'Frontend Engineer',
          email: 'john@doe.com',
          phone: null,
          location: null,
          links: [],
        }),
      )
    })

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Save changes' }),
      ).toBeDisabled()
    })
  })

  it('reverts unsaved changes back to the profile values', async () => {
    const user = userEvent.setup()
    renderPage()

    const fullName = screen.getByLabelText(/full name/i)
    await user.clear(fullName)
    await user.type(fullName, 'Jane Doe')

    await user.click(screen.getByRole('button', { name: 'Revert' }))

    expect(screen.getByLabelText(/full name/i)).toHaveValue('John Doe')
    expect(upsertProfile).not.toHaveBeenCalled()
  })

  it('exports the profile and resumes as a downloaded JSON file', async () => {
    const user = userEvent.setup()
    const exportData = {
      version: 1 as const,
      exportedAt: '2026-08-23T00:00:00.000Z',
      profile,
      resumes: [],
    }
    vi.mocked(exportProfile).mockResolvedValueOnce(exportData)
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Export data' }))

    await waitFor(() => {
      expect(exportProfile).toHaveBeenCalled()
      expect(getExportFilename).toHaveBeenCalledWith('profile')
      expect(downloadJson).toHaveBeenCalledWith(
        'dossier-profile-export-2026-08-23.json',
        exportData,
      )
    })
  })

  it('shows an error toast when exporting fails', async () => {
    const user = userEvent.setup()
    vi.mocked(exportProfile).mockRejectedValueOnce(new Error('Boom'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Export data' }))

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        'Failed to export data',
        'Please try again.',
      )
    })

    consoleSpy.mockRestore()
  })

  it('opens a confirmation dialog and deletes the profile on confirm', async () => {
    const user = userEvent.setup()
    vi.mocked(deleteProfile).mockResolvedValueOnce(undefined)
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Delete' }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Delete profile?')
    expect(dialog).toHaveTextContent('export it first')
    expect(deleteProfile).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Delete profile' }))

    await waitFor(() => {
      expect(deleteProfile).toHaveBeenCalled()
    })

    expect(await screen.findByText('Setup page')).toBeInTheDocument()
  })

  it('closes the dialog without deleting on cancel', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await screen.findByRole('dialog')

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(deleteProfile).not.toHaveBeenCalled()
  })

  it('keeps the dialog open and shows an error when deletion fails', async () => {
    const user = userEvent.setup()
    vi.mocked(deleteProfile).mockRejectedValueOnce(new Error('Boom'))
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await screen.findByRole('dialog')

    await user.click(screen.getByRole('button', { name: 'Delete profile' }))

    expect(
      await screen.findByText(
        'Unable to delete your profile. Please try again.',
      ),
    ).toBeInTheDocument()
    expect(mockToast.error).toHaveBeenCalledWith(
      'Failed to delete profile',
      'Please try again.',
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Delete profile' }),
      ).toBeEnabled()
    })
  })
})
