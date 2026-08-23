import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Profile, Resume } from '@/db/db'
import { updateResume } from '@/db/resume'
import {
  useEditResumeForm,
} from '@/pages/resumes/edit/hooks/useEditResumeForm'

vi.mock('@/db/resume', () => ({
  updateResume: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
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
  role: 'Engineer',
  email: 'john@doe.com',
  phone: null,
  location: null,
  links: [{ label: 'GitHub', url: 'https://github.com/johndoe' }],
}

function makeResume(overrides: Partial<Resume> = {}): Resume {
  return {
    id: 'resume-1',
    title: 'My Resume',
    sections: [{ type: 'paragraph', text: 'Intro' }],
    createdAt: new Date(),
    updatedAt: new Date(),
    syncProfile: true,
    contact: null,
    ...overrides,
  }
}

describe('useEditResumeForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('prefills from the resume and generates identity keys for nested items', () => {
    const resume = makeResume({
      sections: [
        {
          type: 'education',
          institutions: [
            {
              name: 'Uni',
              degree: 'BSc',
              start_date: '',
              end_date: '',
              location: '',
            },
          ],
        },
      ],
    })

    const { result } = renderHook(() => useEditResumeForm(resume, profile))

    const values = result.current.form.getValues()
    expect(values.title).toBe('My Resume')
    expect(values.fullName).toBe('John Doe') // synced → live profile

    const [section] = result.current.form.getValues(
      'sections',
    ) as unknown as Array<{ _key?: string; institutions: Array<{ _key?: string }> }>
    expect(section._key).toEqual(expect.any(String))
    expect(section.institutions[0]._key).toEqual(expect.any(String))
    expect(result.current.isDirty).toBe(false)
  })

  it('uses the stored contact snapshot when the resume is unsynced', () => {
    const resume = makeResume({
      syncProfile: false,
      contact: {
        full_name: 'Snapshot Person',
        role: null,
        email: null,
        phone: null,
        location: null,
        links: [],
      },
    })

    const { result } = renderHook(() => useEditResumeForm(resume, profile))

    expect(result.current.form.getValues('fullName')).toBe('Snapshot Person')
  })

  it('tracks dirty state and reverts to the saved values', () => {
    const { result } = renderHook(() => useEditResumeForm(makeResume()))

    act(() => {
      result.current.form.setValue('title', 'Renamed', { shouldDirty: true })
    })

    expect(result.current.isDirty).toBe(true)

    act(() => {
      result.current.revert()
    })

    expect(result.current.form.getValues('title')).toBe('My Resume')
    expect(result.current.isDirty).toBe(false)
  })

  it('saves all fields including sync metadata on submit', async () => {
    vi.mocked(updateResume).mockResolvedValueOnce(undefined)
    const { result } = renderHook(() =>
      useEditResumeForm(
        makeResume({
          syncProfile: false,
          contact: {
            full_name: 'Snapshot Person',
            role: null,
            email: null,
            phone: null,
            location: null,
            links: [],
          },
        }),
        profile,
      ),
    )

    act(() => {
      result.current.form.setValue('title', 'Updated Title')
      result.current.form.setValue('syncProfile', false, {
        shouldDirty: true,
      })
    })

    await act(async () => {
      await result.current.onSubmit()
    })

    expect(updateResume).toHaveBeenCalledWith('resume-1', {
      title: 'Updated Title',
      sections: [{ type: 'paragraph', text: 'Intro' }],
      syncProfile: false,
      contact: {
        full_name: 'Snapshot Person',
        email: null,
        phone: null,
        location: null,
        links: [],
        role: null,
      },
    })
    expect(mockToast.success).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/resumes')

    // After a successful save the form is pristine again.
    expect(result.current.isDirty).toBe(false)
  })
})
