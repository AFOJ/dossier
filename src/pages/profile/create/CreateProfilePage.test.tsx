import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CreateProfilePage from '@/pages/profile/create/CreateProfilePage'
import { upsertProfile } from '@/db/profile'

// Only mock the network boundary and router — everything else (zod validation,
// react-hook-form, useFieldArray reordering) runs for real.
vi.mock('@/db/profile', () => ({
  upsertProfile: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

function setup() {
  const user = userEvent.setup()
  render(<CreateProfilePage />)
  return { user }
}

function getSubmitButton() {
  return screen.getByRole('button', { name: /create my profile/i })
}

async function fillRequiredFullName(
  user: ReturnType<typeof userEvent.setup>,
  name = 'John Doe',
) {
  const fullName = screen.getByPlaceholderText('John Doe')
  await user.clear(fullName)
  await user.type(fullName, name)
}

describe('CreateProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('blocks submission and surfaces the real zod error when full name is empty', async () => {
    const { user } = setup()

    await user.click(getSubmitButton())

    expect(await screen.findByText('Full name is required')).toBeInTheDocument()
    expect(upsertProfile).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('enforces the min-length rule (not just required) and clears the error once fixed', async () => {
    const { user } = setup()
    const fullName = screen.getByPlaceholderText('John Doe')

    await user.type(fullName, 'J')
    await user.click(getSubmitButton())
    expect(
      await screen.findByText('Full name must be at least 2 characters'),
    ).toBeInTheDocument()

    await user.type(fullName, 'ohn')
    await user.click(getSubmitButton())

    await waitFor(() => {
      expect(
        screen.queryByText('Full name must be at least 2 characters'),
      ).not.toBeInTheDocument()
    })
  })

  it('only validates email format when a value is present (optional-or-valid rule)', async () => {
    const { user } = setup()
    await fillRequiredFullName(user)

    const email = screen.getByPlaceholderText('john@doe.com')

    // empty email is valid -> submitting should not complain about email
    await user.click(getSubmitButton())
    await waitFor(() => expect(upsertProfile).toHaveBeenCalled())
    expect(screen.queryByText(/invalid email/i)).not.toBeInTheDocument()

    vi.clearAllMocks()

    // invalid, non-empty email should now fail
    await user.type(email, 'not-an-email')
    await user.click(getSubmitButton())
    expect(await screen.findByText('Invalid email address')).toBeInTheDocument()
    expect(upsertProfile).not.toHaveBeenCalled()
  })

  it('validates each social link row (label required, url must be a valid URL) and submits correct payload once fixed', async () => {
    vi.mocked(upsertProfile).mockResolvedValueOnce(1)
    const { user } = setup()
    await fillRequiredFullName(user)

    await user.click(screen.getByRole('button', { name: /add social link/i }))
    await user.click(getSubmitButton())

    expect(await screen.findByText('Label is required')).toBeInTheDocument()
    expect(await screen.findByText('Must be a valid URL')).toBeInTheDocument()
    expect(upsertProfile).not.toHaveBeenCalled()

    const label = screen.getByPlaceholderText('Label (e.g. GitHub)')
    const url = screen.getByPlaceholderText('URL')
    await user.type(label, 'GitHub')
    await user.type(url, 'not-a-url')
    await user.click(getSubmitButton())
    expect(await screen.findByText('Must be a valid URL')).toBeInTheDocument()

    await user.clear(url)
    await user.type(url, 'https://github.com/johndoe')
    await user.click(getSubmitButton())

    await waitFor(() => {
      expect(upsertProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          full_name: 'John Doe',
          links: [{ label: 'GitHub', url: 'https://github.com/johndoe' }],
        }),
      )
    })
    expect(mockNavigate).toHaveBeenCalledWith('/resumes')
  })

  it('removes the correct row when there are multiple social links (index integrity)', async () => {
    const { user } = setup()
    const addButton = screen.getByRole('button', { name: /add social link/i })

    await user.click(addButton)
    await user.click(addButton)
    await user.click(addButton)

    const labels = screen.getAllByPlaceholderText('Label (e.g. GitHub)')
    const urls = screen.getAllByPlaceholderText('URL')
    await user.type(labels[0], 'GitHub')
    await user.type(urls[0], 'https://github.com/a')
    await user.type(labels[1], 'LinkedIn')
    await user.type(urls[1], 'https://linkedin.com/b')
    await user.type(labels[2], 'Twitter')
    await user.type(urls[2], 'https://twitter.com/c')

    // remove the middle row
    await user.click(screen.getByRole('button', { name: 'Remove link 2' }))

    const remainingLabels = screen.getAllByPlaceholderText(
      'Label (e.g. GitHub)',
    )
    expect(remainingLabels).toHaveLength(2)
    expect(remainingLabels[0]).toHaveValue('GitHub')
    expect(remainingLabels[1]).toHaveValue('Twitter')
  })

  it('reorders social links via the up/down controls and disables controls at the boundaries', async () => {
    const { user } = setup()
    const addButton = screen.getByRole('button', { name: /add social link/i })
    await user.click(addButton)
    await user.click(addButton)

    const labels = screen.getAllByPlaceholderText('Label (e.g. GitHub)')
    await user.type(labels[0], 'First')
    await user.type(labels[1], 'Second')

    // first row's "up" is disabled, last row's "down" is disabled
    expect(
      screen.getByRole('button', { name: 'Move link 1 up' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Move link 2 down' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Move link 1 down' }),
    ).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Move link 1 down' }))

    const reordered = screen.getAllByPlaceholderText('Label (e.g. GitHub)')
    expect(reordered[0]).toHaveValue('Second')
    expect(reordered[1]).toHaveValue('First')

    // boundary state should now be flipped for row 1
    expect(
      screen.getByRole('button', { name: 'Move link 1 up' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Move link 2 down' }),
    ).toBeDisabled()
  })

  it('disables the submit button while the save is in flight and re-enables it after', async () => {
    let resolvePromise!: (value: number) => void
    vi.mocked(upsertProfile).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve
        }),
    )
    const { user } = setup()
    await fillRequiredFullName(user)

    const submit = getSubmitButton()
    await user.click(submit)

    await waitFor(() => expect(submit).toBeDisabled())

    resolvePromise(1)

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/resumes'))
  })

  it('shows the root error banner on a failed save and does not navigate away', async () => {
    vi.mocked(upsertProfile).mockRejectedValueOnce(
      new Error('IndexedDB failure'),
    )
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { user } = setup()
    await fillRequiredFullName(user)

    await user.click(getSubmitButton())

    expect(
      await screen.findByText('Failed to save profile. Please try again.'),
    ).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
