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
      result.current.addSection('paragraph')
      result.current.addSection('experience')
    })

    const sections = getSections(result)
    expect(sections).toEqual([
      { type: 'paragraph', text: '' },
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
      result.current.addSection('paragraph')
      result.current.addSection('skills')
      result.current.addSection('education')
    })

    act(() => {
      result.current.moveSection(2, -1)
    })

    expect(getSections(result).map((s) => s.type)).toEqual([
      'paragraph',
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
      result.current.addSection('paragraph')
      result.current.addSection('education')
    })

    act(() => {
      result.current.updateSection(0, { type: 'paragraph', text: 'Hello' })
    })

    const sections = getSections(result)
    expect(sections[0]).toEqual({ type: 'paragraph', text: 'Hello' })
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
      result.current.addSection('paragraph')
      result.current.updateSection(0, { type: 'paragraph', text: 'Hello' })
    })

    await act(async () => {
      await result.current.onSubmit()
    })

    expect(createResume).toHaveBeenCalledWith(
      'My Resume',
      [{ type: 'paragraph', text: 'Hello' }],
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
        { type: 'paragraph', text: 'Hi' },
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

  describe('section guardrails', () => {
    it('blocks an empty paragraph section', async () => {
      const { result } = renderHook(() => useCreateResumeForm())

      act(() => {
        result.current.form.setValue('title', 'My Resume')
        result.current.addSection('paragraph')
      })

      await act(async () => {
        await result.current.onSubmit()
      })

      expect(createResume).not.toHaveBeenCalled()
      expect(
        result.current.form.getFieldState(
          'sections.0.text',
          result.current.form.formState,
        ).error?.message,
      ).toBe('Paragraph cannot be empty')
    })

    it('blocks an education section without institutions', async () => {
      const { result } = renderHook(() => useCreateResumeForm())

      act(() => {
        result.current.form.setValue('title', 'My Resume')
        result.current.addSection('education')
      })

      await act(async () => {
        await result.current.onSubmit()
      })

      expect(createResume).not.toHaveBeenCalled()
      expect(
        result.current.form.getFieldState(
          'sections.0.institutions',
          result.current.form.formState,
        ).error?.message,
      ).toBe('Add at least one school to this section')
    })

    it('requires school and degree on each institution', async () => {
      const { result } = renderHook(() => useCreateResumeForm())

      act(() => {
        result.current.form.setValue('title', 'My Resume')
        result.current.addSection('education')
        result.current.updateSection(0, {
          type: 'education',
          institutions: [
            {
              name: '',
              degree: '',
              start_date: '',
              end_date: '',
              location: '',
            },
          ],
        })
      })

      await act(async () => {
        await result.current.onSubmit()
      })

      expect(createResume).not.toHaveBeenCalled()

      const formState = result.current.form.formState
      expect(
        result.current.form.getFieldState(
          'sections.0.institutions.0.name',
          formState,
        ).error?.message,
      ).toBe('School is required')
      expect(
        result.current.form.getFieldState(
          'sections.0.institutions.0.degree',
          formState,
        ).error?.message,
      ).toBe('Degree is required')
    })

    it('requires a group title and at least one skill', async () => {
      const { result } = renderHook(() => useCreateResumeForm())

      act(() => {
        result.current.form.setValue('title', 'My Resume')
        result.current.addSection('skills')
      })

      await act(async () => {
        await result.current.onSubmit()
      })

      expect(createResume).not.toHaveBeenCalled()

      const formState = result.current.form.formState
      expect(
        result.current.form.getFieldState(
          'sections.0.groups.0.title',
          formState,
        ).error?.message,
      ).toBe('Group title is required')
      expect(
        result.current.form.getFieldState(
          'sections.0.groups.0.items',
          formState,
        ).error?.message,
      ).toBe('Add at least one skill')
    })

    it('requires added bullets to be filled', async () => {
      const { result } = renderHook(() => useCreateResumeForm())

      act(() => {
        result.current.form.setValue('title', 'My Resume')
        result.current.addSection('experience')
        result.current.updateSection(0, {
          type: 'experience',
          companies: [
            {
              company_name: 'Spotify',
              start_date: '',
              roles: [
                {
                  job_title: 'Dev',
                  bullets: [
                    { type: 'text', text: '' },
                    { type: 'text-with-title', title: '', text: '' },
                  ],
                },
              ],
            },
          ],
        })
      })

      await act(async () => {
        await result.current.onSubmit()
      })

      expect(createResume).not.toHaveBeenCalled()

      const formState = result.current.form.formState
      expect(
        result.current.form.getFieldState(
          'sections.0.companies.0.roles.0.bullets.0.text',
          formState,
        ).error?.message,
      ).toBe('Bullet cannot be empty')
      expect(
        result.current.form.getFieldState(
          'sections.0.companies.0.roles.0.bullets.1.title',
          formState,
        ).error?.message,
      ).toBe('Bullet heading is required')
      expect(
        result.current.form.getFieldState(
          'sections.0.companies.0.roles.0.bullets.1.text',
          formState,
        ).error?.message,
      ).toBe('Bullet text is required')
    })

    it('blocks a role end date without a start date', async () => {
      const { result } = renderHook(() => useCreateResumeForm())

      act(() => {
        result.current.form.setValue('title', 'My Resume')
        result.current.addSection('experience')
        result.current.updateSection(0, {
          type: 'experience',
          companies: [
            {
              company_name: 'Spotify',
              start_date: '2020-01',
              roles: [
                {
                  job_title: 'Dev',
                  bullets: [],
                  end_date: '2021-01',
                },
              ],
            },
          ],
        })
      })

      await act(async () => {
        await result.current.onSubmit()
      })

      expect(createResume).not.toHaveBeenCalled()

      const formState = result.current.form.formState
      expect(
        result.current.form.getFieldState(
          'sections.0.companies.0.roles.0.start_date',
          formState,
        ).error?.message,
      ).toBe('Start date is required when an end date is set')
    })

    it('blocks a company end date before its start date', async () => {
      const { result } = renderHook(() => useCreateResumeForm())

      act(() => {
        result.current.form.setValue('title', 'My Resume')
        result.current.addSection('experience')
        result.current.updateSection(0, {
          type: 'experience',
          companies: [
            {
              company_name: 'Spotify',
              start_date: '2022-01',
              end_date: '2020-01',
              roles: [],
            },
          ],
        })
      })

      await act(async () => {
        await result.current.onSubmit()
      })

      expect(createResume).not.toHaveBeenCalled()

      const formState = result.current.form.formState
      expect(
        result.current.form.getFieldState(
          'sections.0.companies.0.end_date',
          formState,
        ).error?.message,
      ).toBe('End date cannot be before start date')
    })

    it('blocks a role end date before its start date', async () => {
      const { result } = renderHook(() => useCreateResumeForm())

      act(() => {
        result.current.form.setValue('title', 'My Resume')
        result.current.addSection('experience')
        result.current.updateSection(0, {
          type: 'experience',
          companies: [
            {
              company_name: 'Spotify',
              start_date: '2020-01',
              roles: [
                {
                  job_title: 'Dev',
                  bullets: [],
                  start_date: '2022-01',
                  end_date: '2020-01',
                },
              ],
            },
          ],
        })
      })

      await act(async () => {
        await result.current.onSubmit()
      })

      expect(createResume).not.toHaveBeenCalled()

      const formState = result.current.form.formState
      expect(
        result.current.form.getFieldState(
          'sections.0.companies.0.roles.0.end_date',
          formState,
        ).error?.message,
      ).toBe('End date cannot be before start date')
    })

    it('allows an experience section with valid company and role dates', async () => {
      vi.mocked(createResume).mockResolvedValueOnce('ok')

      const { result } = renderHook(() => useCreateResumeForm())

      act(() => {
        result.current.form.setValue('title', 'My Resume')
        result.current.addSection('experience')
        result.current.updateSection(0, {
          type: 'experience',
          companies: [
            {
              company_name: 'Spotify',
              start_date: '2020-01',
              end_date: '2024-06',
              roles: [
                {
                  job_title: 'Dev',
                  bullets: [],
                  start_date: '2020-01',
                  end_date: '2022-05',
                },
                {
                  job_title: 'Senior Dev',
                  bullets: [],
                },
                {
                  job_title: 'Undated role',
                  bullets: [],
                  start_date: undefined,
                  end_date: '',
                },
              ],
            },
          ],
        })
      })

      await act(async () => {
        await result.current.onSubmit()
      })

      expect(createResume).toHaveBeenCalled()
      expect(mockToast.success).toHaveBeenCalled()
    })

    it('allows a fully valid resume through', async () => {
      vi.mocked(createResume).mockResolvedValueOnce('ok')

      const { result } = renderHook(() => useCreateResumeForm())

      act(() => {
        result.current.form.setValue('title', 'My Resume')
        result.current.addSection('education')
        result.current.updateSection(0, {
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
        })
      })

      await act(async () => {
        await result.current.onSubmit()
      })

      expect(createResume).toHaveBeenCalled()
      expect(mockToast.success).toHaveBeenCalled()
    })
  })
})
