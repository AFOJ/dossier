import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCreateProfileForm } from './useCreateProfileForm'
import { upsertProfile } from '../../../../db/profile'

vi.mock('../../../../db/profile', () => ({
  upsertProfile: vi.fn(),
}))

const mockNavigate = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

describe('useCreateProfileForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('merges provided default values', () => {
    const { result } = renderHook(() =>
      useCreateProfileForm({
        fullName: 'Jane Doe',
        location: 'Toronto',
      }),
    )

    expect(result.current.form.getValues()).toMatchObject({
      fullName: 'Jane Doe',
      location: 'Toronto',
      email: '',
      phone: '',
      socials: [],
    })
  })

  it('does not submit an invalid form', async () => {
    const { result } = renderHook(() => useCreateProfileForm())

    await act(async () => {
      await result.current.onSubmit()
    })

    expect(upsertProfile).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()

    expect(result.current.form.formState.errors.fullName?.message).toBe(
      'Full name is required',
    )
  })

  it('maps optional empty fields to null before saving', async () => {
    vi.mocked(upsertProfile).mockResolvedValueOnce(1)

    const { result } = renderHook(() => useCreateProfileForm())

    await act(async () => {
      result.current.form.setValue('fullName', 'John Doe')

      await result.current.onSubmit()
    })

    expect(upsertProfile).toHaveBeenCalledWith({
      full_name: 'John Doe',
      email: null,
      phone: null,
      location: null,
      role: null,
      links: [],
    })

    expect(mockNavigate).toHaveBeenCalledWith('/resumes')
  })

  it('preserves multiple social links', async () => {
    vi.mocked(upsertProfile).mockResolvedValueOnce(1)

    const socials = [
      {
        label: 'GitHub',
        url: 'https://github.com/johndoe',
      },
      {
        label: 'LinkedIn',
        url: 'https://linkedin.com/in/johndoe',
      },
    ]

    const { result } = renderHook(() => useCreateProfileForm())

    await act(async () => {
      result.current.form.setValue('fullName', 'John Doe')
      result.current.form.setValue('socials', socials)

      await result.current.onSubmit()
    })

    expect(upsertProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        links: socials,
      }),
    )
  })

  it('toggles isSubmitting during submission', async () => {
    let resolvePromise!: () => void

    vi.mocked(upsertProfile).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePromise = () => resolve(1)
        }),
    )

    const { result } = renderHook(() => useCreateProfileForm())

    act(() => {
      result.current.form.setValue('fullName', 'John Doe')
    })

    let submitPromise!: Promise<void>

    await act(async () => {
      submitPromise = result.current.onSubmit()
    })

    expect(result.current.isSubmitting).toBe(true)

    await act(async () => {
      resolvePromise()
      await submitPromise
    })

    expect(result.current.isSubmitting).toBe(false)
  })

  it('sets a root error when saving fails', async () => {
    vi.mocked(upsertProfile).mockRejectedValueOnce(
      new Error('IndexedDB failure'),
    )

    vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useCreateProfileForm())

    await act(async () => {
      result.current.form.setValue('fullName', 'John Doe')

      await result.current.onSubmit()
    })

    await waitFor(() => {
      expect(result.current.formError).toBe(
        'Failed to save profile. Please try again.',
      )
    })

    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('clears the previous root error after a successful retry', async () => {
    vi.mocked(upsertProfile)
      .mockRejectedValueOnce(new Error('Boom'))
      .mockResolvedValueOnce(1)

    vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useCreateProfileForm())

    await act(async () => {
      result.current.form.setValue('fullName', 'John Doe')
      await result.current.onSubmit()
    })

    expect(result.current.formError).toBe(
      'Failed to save profile. Please try again.',
    )

    await act(async () => {
      await result.current.onSubmit()
    })

    await waitFor(() => {
      expect(result.current.formError).toBeUndefined()
    })

    expect(mockNavigate).toHaveBeenCalledWith('/resumes')
  })
})
