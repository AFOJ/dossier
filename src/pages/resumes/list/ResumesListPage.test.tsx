import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ResumesListPage from './ResumesListPage'
import { createResume } from '../../../db/resume'
import type { Resume } from '../../../db/db'
import type { ResumeSection } from '../../../db/types'
import { useResumeTable } from '../../../hooks/useResumeTable'

vi.mock('../../../hooks/useResumeTable', () => ({
  useResumeTable: vi.fn(),
  PAGE_SIZE_OPTIONS: [2, 5, 10, 25],
}))

vi.mock('../../../db/resume', () => ({
  createResume: vi.fn(),
}))

const mockUseResumeTable = vi.mocked(useResumeTable)

type TableState = ReturnType<typeof useResumeTable>

function makeTableState(overrides: Partial<TableState> = {}): TableState {
  return {
    query: '',
    setQuery: vi.fn(),
    page: 1,
    setPage: vi.fn(),
    perPage: 10,
    setPerPage: vi.fn(),
    totalCount: 0,
    totalPages: 1,
    pageItems: [],
    isLoading: false,
    ...overrides,
  }
}

function makeResume(overrides: Partial<Resume> = {}): Resume {
  return {
    id: crypto.randomUUID(),
    title: 'Untitled',
    sections: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

function renderPage(state: TableState) {
  mockUseResumeTable.mockReturnValue(state)

  render(
    <MemoryRouter initialEntries={['/resumes']}>
      <Routes>
        <Route path="/resumes" element={<ResumesListPage />} />
        <Route path="/resumes/create" element={<div>Create resume page</div>} />
        <Route path="/resumes/:id" element={<div>Resume detail page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ResumesListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows an empty state with a CTA when there are no resumes', async () => {
    renderPage(makeTableState())

    expect(await screen.findByText('No resumes yet')).toBeInTheDocument()

    const cta = screen.getByRole('button', {
      name: 'Create your first resume',
    })
    await userEvent.setup().click(cta)

    expect(await screen.findByText('Create resume page')).toBeInTheDocument()
  })

  it('renders a row for each resume', async () => {
    renderPage(
      makeTableState({
        totalCount: 2,
        pageItems: [
          makeResume({ id: '1', title: 'Frontend Engineer' }),
          makeResume({ id: '2', title: 'Backend Engineer' }),
        ],
      }),
    )

    expect(await screen.findByText('Frontend Engineer')).toBeInTheDocument()
    expect(screen.getByText('Backend Engineer')).toBeInTheDocument()
  })

  it('navigates to the resume detail when a row is clicked', async () => {
    const user = userEvent.setup()
    renderPage(
      makeTableState({
        totalCount: 1,
        pageItems: [makeResume({ id: 'abc', title: 'My Resume' })],
      }),
    )

    await user.click(await screen.findByText('My Resume'))

    expect(await screen.findByText('Resume detail page')).toBeInTheDocument()
  })

  it('navigates to create via the toolbar "New resume" button', async () => {
    const user = userEvent.setup()
    renderPage(
      makeTableState({
        totalCount: 1,
        pageItems: [makeResume({ id: '1', title: 'Frontend Engineer' })],
      }),
    )

    await user.click(await screen.findByRole('button', { name: 'New resume' }))

    expect(await screen.findByText('Create resume page')).toBeInTheDocument()
  })

  it('duplicates a resume with a copy title and its sections', async () => {
    const user = userEvent.setup()
    const sections: ResumeSection[] = [{ type: 'summary', text: 'Hello' }]
    renderPage(
      makeTableState({
        totalCount: 1,
        pageItems: [
          makeResume({ id: '1', title: 'Frontend Engineer', sections }),
        ],
      }),
    )

    await user.click(await screen.findByRole('button', { name: 'Duplicate' }))

    await waitFor(() => {
      expect(createResume).toHaveBeenCalledWith(
        'Copy of Frontend Engineer',
        sections,
      )
    })
  })

  it('delegates query changes to the hook', async () => {
    const user = userEvent.setup()
    const setQuery = vi.fn()
    renderPage(
      makeTableState({
        query: '',
        setQuery,
        totalCount: 3,
        pageItems: [
          makeResume({ id: '1', title: 'Frontend Engineer' }),
          makeResume({ id: '2', title: 'Backend Engineer' }),
          makeResume({ id: '3', title: 'Product Designer' }),
        ],
      }),
    )

    await screen.findByText('Product Designer')

    await user.type(screen.getByPlaceholderText('Search resumes'), 'engineer')

    expect(setQuery).toHaveBeenCalled()
  })

  it('shows only matching rows when a query is set', async () => {
    renderPage(
      makeTableState({
        query: 'engineer',
        totalCount: 2,
        pageItems: [
          makeResume({ id: '1', title: 'Frontend Engineer' }),
          makeResume({ id: '2', title: 'Backend Engineer' }),
        ],
      }),
    )

    expect(await screen.findByText('Frontend Engineer')).toBeInTheDocument()
    expect(screen.getByText('Backend Engineer')).toBeInTheDocument()
    expect(screen.queryByText('Product Designer')).not.toBeInTheDocument()
  })

  it('shows a no-results state when a query has no matches', async () => {
    renderPage(
      makeTableState({
        query: 'nope',
        totalCount: 0,
        pageItems: [],
      }),
    )

    expect(await screen.findByText('No matches')).toBeInTheDocument()
  })

  it('shows the visible range and page buttons', async () => {
    renderPage(
      makeTableState({
        totalCount: 12,
        totalPages: 2,
        pageItems: Array.from({ length: 10 }, (_, i) =>
          makeResume({ id: String(i), title: `Resume ${i}` }),
        ),
      }),
    )

    expect(await screen.findByText('Resume 0')).toBeInTheDocument()
    expect(screen.getByText('1 - 10 of 12')).toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(10)
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled()
  })

  it('requests the next page via the pagination controls', async () => {
    const user = userEvent.setup()
    const setPage = vi.fn()
    renderPage(
      makeTableState({
        totalCount: 12,
        totalPages: 2,
        pageItems: Array.from({ length: 10 }, (_, i) =>
          makeResume({ id: String(i), title: `Resume ${i}` }),
        ),
        setPage,
      }),
    )

    await screen.findByText('Resume 0')

    await user.click(screen.getByRole('button', { name: 'Next page' }))
    expect(setPage).toHaveBeenCalledWith(2)
  })

  it('changes rows per page via the selector', async () => {
    const user = userEvent.setup()
    const setPerPage = vi.fn()
    renderPage(
      makeTableState({
        perPage: 2,
        totalCount: 12,
        totalPages: 6,
        pageItems: Array.from({ length: 2 }, (_, i) =>
          makeResume({ id: String(i), title: `Resume ${i}` }),
        ),
        setPerPage,
      }),
    )

    await user.click(await screen.findByRole('combobox', { name: 'Rows per page' }))
    await user.click(await screen.findByRole('option', { name: '2' }))

    expect(setPerPage).toHaveBeenCalledWith(2)
  })
})