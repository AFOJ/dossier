import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Profile } from '@/db/db'
import { upsertProfile } from '@/db/profile'
import {
  toProfileFormData,
  useEditProfileForm,
} from '@/pages/profile/view/hooks/useEditProfileForm'

vi.mock('@/db/profile', () => ({
  upsertProfile: vi.fn(),
}))

const mockRevalidate = vi.fn()

vi.mock('react-router-dom', () => ({
  useRevalidator: () => ({ revalidate: mockRevalidate }),
}))

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
  role: 'Frontend Engineer',
  email: 'john@doe.com',
  phone: '+1 (555) 000-0000',
  location: 'London, UK',
  links: [{ label: 'GitHub', url: 'https://github.com/johndoe' }],
}

describe('toProfileFormData', () => {
  it('maps a profile to form data with nulls coerced to empty strings', () => {
    expect(
      toProfileFormData({
        id: 2,
        full_name: 'Jane',
        role: null,
        email: null,
        phone: null,
        location: null,
        links: [],
      }),
    ).toEqual({
      fullName: 'Jane',
      jobTitle: '',
      location: '',
      phone: '',
      email: '',
      socials: [],
    })
  })
})

describe('useEditProfileForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('prefills the form from the given profile', () => {
    const { result } = renderHook(() => useEditProfileForm(profile))

    expect(result.current.form.getValues()).toEqual({
      fullName: 'John Doe',
      jobTitle: 'Frontend Engineer',
      location: 'London, UK',
      phone: '+1 (555) 000-0000',
      email: 'john@doe.com',
      socials: [{ label: 'GitHub', url: 'https://github.com/johndoe' }],
    })

    expect(result.current.isDirty).toBe(false)
  })

  it('tracks dirty state and reverts back to the profile values', () => {
    const { result } = renderHook(() => useEditProfileForm(profile))

    act(() => {
      result.current.form.setValue('fullName', 'Jane Doe', {
        shouldDirty: true,
      })
    })

    expect(result.current.isDirty).toBe(true)

    act(() => {
      result.current.revert()
    })

    expect(result.current.form.getValues('fullName')).toBe('John Doe')
    expect(result.current.isDirty).toBe(false)
  })

  it('saves the mapped payload, resets dirty state and revalidates on success', async () => {
    vi.mocked(upsertProfile).mockResolvedValueOnce(1)

    const { result } = renderHook(() => useEditProfileForm(profile))

    act(() => {
      result.current.form.setValue('jobTitle', 'Backend Engineer')
    })

    await act(async () => {
      await result.current.save()
    })

    expect(upsertProfile).toHaveBeenCalledWith({
      full_name: 'John Doe',
      email: 'john@doe.com',
      phone: '+1 (555) 000-0000',
      location: 'London, UK',
      role: 'Backend Engineer',
      links: [{ label: 'GitHub', url: 'https://github.com/johndoe' }],
    })

    expect(result.current.isDirty).toBe(false)
    expect(mockToast.success).toHaveBeenCalledWith(
      'Profile saved',
      'Your changes have been saved.',
    )
    expect(mockRevalidate).toHaveBeenCalled()
    expect(result.current.formError).toBeUndefined()
  })

  it('sets a root error and an error toast when saving fails', async () => {
    vi.mocked(upsertProfile).mockRejectedValueOnce(new Error('Boom'))

    const { result } = renderHook(() => useEditProfileForm(profile))

    act(() => {
      result.current.form.setValue('fullName', 'Jane Doe', {
        shouldDirty: true,
      })
    })

    await act(async () => {
      await result.current.save()
    })

    await waitFor(() => {
      expect(result.current.formError).toBe(
        'Failed to save profile. Please try again.',
      )
    })

    expect(result.current.isDirty).toBe(true)
    expect(mockToast.error).toHaveBeenCalledWith(
      'Failed to save profile',
      'Please try again.',
    )
    expect(mockRevalidate).not.toHaveBeenCalled()
  })

  it('does not submit an invalid form', async () => {
    const { result } = renderHook(() => useEditProfileForm(profile))

    act(() => {
      result.current.form.setValue('email', 'not-an-email')
    })

    await act(async () => {
      await result.current.save()
    })

    expect(upsertProfile).not.toHaveBeenCalled()
    expect(mockRevalidate).not.toHaveBeenCalled()
    expect(
      result.current.form.formState.errors.email?.message,
    ).toBe('Invalid email address')
  })
})
