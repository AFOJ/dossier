import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCreateResumeForm } from '@/pages/resumes/create/hooks/useCreateResumeForm'
import { createResume } from '@/db/resume'

vi.mock('@/db/resume', () => ({
  createResume: vi.fn(),
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

function getSections(result: {
  current: ReturnType<typeof useCreateResumeForm>
}) {
  return result.current.form.getValues('sections')
}

describe('useCreateResumeForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('starts with an empty title and no sections', () => {
    const { result } = renderHook(() => useCreateResumeForm())

    expect(result.current.form.getValues()).toEqual({
      title: '',
      syncProfile: true,
      fullName: '',
      jobTitle: '',
      location: '',
      phone: '',
      email: '',
      socials: [],
      sections: [],
    })
  })

  it('adds default sections per type', () => {
    const { result } = renderHook(() => useCreateResumeForm())

    act(() => {
      result.current.addSection('summary')
      result.current.addSection('experience')
    })

    const sections = getSections(result)
    expect(sections).toEqual([
      { type: 'summary', text: '' },
      {
        type: 'experience',
        companies: [
          { company_name: '', start_date: '', end_date: undefined, roles: [] },
        ],
      },
    ])
  })

  it('removes and reorders sections', () => {
    const { result } = renderHook(() => useCreateResumeForm())

    act(() => {
      result.current.addSection('summary')
      result.current.addSection('skills')
      result.current.addSection('education')
    })

    act(() => {
      result.current.moveSection(2, -1)
    })

    expect(getSections(result).map((s) => s.type)).toEqual([
      'summary',
      'education',
      'skills',
    ])

    act(() => {
      result.current.removeSection(0)
    })

    expect(getSections(result).map((s) => s.type)).toEqual([
      'education',
      'skills',
    ])
  })

  it('updates a section in place preserving position', () => {
    const { result } = renderHook(() => useCreateResumeForm())

    act(() => {
      result.current.addSection('summary')
      result.current.addSection('education')
    })

    act(() => {
      result.current.updateSection(0, { type: 'summary', text: 'Hello' })
    })

    const sections = getSections(result)
    expect(sections[0]).toEqual({ type: 'summary', text: 'Hello' })
    expect(sections[1]?.type).toBe('education')
  })

  it('does not submit without a title', async () => {
    const { result } = renderHook(() => useCreateResumeForm())

    await act(async () => {
      await result.current.onSubmit()
    })

    expect(createResume).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(result.current.form.formState.errors.title?.message).toBe(
      'Title is required',
    )
  })

  it('creates the resume with the entered data on submit', async () => {
    vi.mocked(createResume).mockResolvedValueOnce('new-id')

    const { result } = renderHook(() => useCreateResumeForm())

    act(() => {
      result.current.form.setValue('title', 'My Resume')
      result.current.addSection('summary')
      result.current.updateSection(0, { type: 'summary', text: 'Hello' })
    })

    await act(async () => {
      await result.current.onSubmit()
    })

    expect(createResume).toHaveBeenCalledWith(
      'My Resume',
      [{ type: 'summary', text: 'Hello' }],
      { syncProfile: true, contact: null },
    )
    expect(mockToast.success).toHaveBeenCalledWith(
      'Resume created',
      '"My Resume" has been created.',
    )
    expect(mockNavigate).toHaveBeenCalledWith('/resumes')
  })

  it('shows an error toast when creation fails', async () => {
    vi.mocked(createResume).mockRejectedValueOnce(new Error('Boom'))

    const { result } = renderHook(() => useCreateResumeForm())

    act(() => {
      result.current.form.setValue('title', 'My Resume')
      result.current.form.setValue('sections', [
        { type: 'summary', text: 'Hi' },
      ])
    })

    await act(async () => {
      await result.current.onSubmit()
    })

    await waitFor(() => {
      expect(result.current.formError).toBe(
        'Failed to create resume. Please try again.',
      )
    })

    expect(mockToast.error).toHaveBeenCalledWith(
      'Failed to create resume',
      'Please try again.',
    )
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('passes contact details when profile sync is off', async () => {
    vi.mocked(createResume).mockResolvedValueOnce('new-id')

    const profile = {
      id: 1,
      full_name: 'John Doe',
      role: 'Engineer',
      email: 'john@doe.com',
      phone: null,
      location: null,
      links: [{ label: 'GitHub', url: 'https://github.com/johndoe' }],
    }

    const { result } = renderHook(() => useCreateResumeForm(profile))

    act(() => {
      result.current.form.setValue('title', 'My Resume')
      result.current.setSyncProfile(false)
    })

    await act(async () => {
      await result.current.onSubmit()
    })

    expect(createResume).toHaveBeenCalledWith('My Resume', [], {
      syncProfile: false,
      contact: {
        full_name: 'John Doe',
        email: 'john@doe.com',
        phone: null,
        location: null,
        links: [{ label: 'GitHub', url: 'https://github.com/johndoe' }],
        role: 'Engineer',
      },
    })
  })

  it('resets contact edits when sync is turned back on', () => {
    const profile = {
      id: 1,
      full_name: 'John Doe',
      role: null,
      email: null,
      phone: null,
      location: null,
      links: [],
    }

    const { result } = renderHook(() => useCreateResumeForm(profile))

    act(() => {
      result.current.setSyncProfile(false)
      result.current.form.setValue('fullName', 'Locally Edited')
      result.current.setSyncProfile(true)
    })

    expect(result.current.form.getValues('syncProfile')).toBe(true)
    expect(result.current.form.getValues('fullName')).toBe('John Doe')
  })
})
