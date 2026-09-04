import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ResumesListPage from '@/pages/resumes/list/ResumesListPage'
import { createResume, deleteResume } from '@/db/resume'
import type { Resume } from '@/db/db'
import type { ResumeSection } from '@/db/types'
import { useResumeTable } from '@/hooks/useResumeTable'
import { ModalProvider } from '@/components/modal'
import { useProcessedResume } from '@/pages/resumes/list/hooks/useProcessedResume'
import { downloadJson } from '@/lib/download'

vi.mock('@/hooks/useResumeTable', () => ({
  useResumeTable: vi.fn(),
  PAGE_SIZE_OPTIONS: [2, 5, 10, 25],
}))

vi.mock('@/db/resume', () => ({
  createResume: vi.fn(),
  deleteResume: vi.fn(),
}))

vi.mock('@/pages/resumes/list/hooks/useProcessedResume', () => ({
  useProcessedResume: vi.fn(),
}))

vi.mock('@/lib/download', () => ({
  downloadJson: vi.fn(),
  getExportFilename: vi.fn(
    (_kind: string, _date: Date, label?: string) =>
      `dossier-resume${label ? `-${label}` : ''}-export.json`,
  ),
}))

const mockUseResumeTable = vi.mocked(useResumeTable)
const mockUseProcessedResume = vi.mocked(useProcessedResume)

type TableState = ReturnType<typeof useResumeTable>

function makeProcessedState() {
  return {
    status: 'ready' as const,
    // about:blank avoids happy-dom trying to fetch a blob: URL for the iframe.
    url: 'about:blank',
    processedAt: new Date(),
    error: undefined,
    isDownloading: false,
    download: vi.fn().mockResolvedValue(undefined),
  }
}

function makeTableState(overrides: Partial<TableState> = {}): TableState {
  return {
    query: '',
    debouncedQuery: '',
    resultQuery: '',
    isSearchPending: false,
    isInitialLoading: false,
    totalDbCount: 1,
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
    syncProfile: true,
    contact: null,
    ...overrides,
  }
}

function renderPage(state: TableState) {
  mockUseResumeTable.mockReturnValue(state)
  mockUseProcessedResume.mockReturnValue(makeProcessedState())

  render(
    <ModalProvider>
      <MemoryRouter initialEntries={['/resumes']}>
        <Routes>
          <Route path="/resumes" element={<ResumesListPage />} />
          <Route
            path="/resumes/create"
            element={<div>Create resume page</div>}
          />
          <Route
            path="/resumes/:resumeId/edit"
            element={<div>Edit resume page</div>}
          />
        </Routes>
      </MemoryRouter>
    </ModalProvider>,
  )
}

describe('ResumesListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows an empty state with a CTA when there are no resumes', async () => {
    renderPage(makeTableState({ totalDbCount: 0 }))

    expect(await screen.findByText('No resumes yet')).toBeInTheDocument()

    const cta = screen.getByRole('link', {
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

  it('opens the preview modal when a row title is clicked', async () => {
    const user = userEvent.setup()
    renderPage(
      makeTableState({
        totalCount: 1,
        pageItems: [makeResume({ id: 'abc', title: 'My Resume' })],
      }),
    )

    await user.click(await screen.findByText('My Resume'))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('My Resume')
    expect(screen.getByTitle('My Resume preview')).toBeInTheDocument()
  })

  it('opens the preview modal via the view quick action', async () => {
    const user = userEvent.setup()
    renderPage(
      makeTableState({
        totalCount: 1,
        pageItems: [makeResume({ id: 'abc', title: 'My Resume' })],
      }),
    )

    await user.click(await screen.findByRole('button', { name: 'View' }))

    expect(await screen.findByRole('dialog')).toHaveTextContent('My Resume')
  })

  it('exports a resume as JSON from its quick action', async () => {
    const user = userEvent.setup()
    const resume = makeResume({ id: 'exp-1', title: 'Export Me' })
    renderPage(makeTableState({ totalCount: 1, pageItems: [resume] }))

    await user.click(await screen.findByRole('button', { name: 'Export JSON' }))

    await waitFor(() => {
      expect(downloadJson).toHaveBeenCalledWith(
        'dossier-resume-export-me-export.json',
        expect.objectContaining({
          id: 'exp-1',
          title: 'Export Me',
          sections: [],
          syncProfile: true,
        }),
      )
    })
  })

  it('navigates to create via the toolbar "New resume" link', async () => {
    const user = userEvent.setup()
    renderPage(
      makeTableState({
        totalCount: 1,
        pageItems: [makeResume({ id: '1', title: 'Frontend Engineer' })],
      }),
    )

    await user.click(await screen.findByRole('link', { name: 'New resume' }))

    expect(await screen.findByText('Create resume page')).toBeInTheDocument()
  })

  it('duplicates a resume with a copy title and its sections', async () => {
    const user = userEvent.setup()
    const sections: ResumeSection[] = [
      { type: 'paragraph', title: 'Hello', text: 'Hello' },
    ]
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
        { syncProfile: true, contact: null },
      )
    })
  })

  it('confirms before deleting a resume', async () => {
    const user = userEvent.setup()
    renderPage(
      makeTableState({
        totalCount: 1,
        pageItems: [
          makeResume({ id: 'delete-me', title: 'Frontend Engineer' }),
        ],
      }),
    )

    await user.click(await screen.findByRole('button', { name: 'Delete' }))

    expect(await screen.findByRole('dialog')).toHaveTextContent(
      'Delete resume?',
    )
    expect(screen.getByRole('dialog')).toHaveTextContent('Frontend Engineer')
    expect(deleteResume).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Delete resume' }))

    await waitFor(() => {
      expect(deleteResume).toHaveBeenCalledWith('delete-me')
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
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
        resultQuery: 'nope',
        totalCount: 0,
        pageItems: [],
      }),
    )

    expect(await screen.findByText('No matches')).toBeInTheDocument()
  })

  it('shows the skeleton while a cleared search is pending', async () => {
    renderPage(
      makeTableState({
        query: '',
        resultQuery: 'njdfdjfjdnjfnjnfdjdjfjdfnjdfdfjdfnjfnddfnjf',
        isSearchPending: true,
        totalCount: 0,
        pageItems: [],
      }),
    )

    expect(await screen.findByLabelText('Loading resumes')).toBeInTheDocument()
    expect(screen.queryByText('Frontend Engineer')).not.toBeInTheDocument()
    expect(screen.queryByText('No matches')).not.toBeInTheDocument()
    expect(screen.queryByText('No resumes yet')).not.toBeInTheDocument()
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
    // Toolbar link + edit link per row
    expect(screen.getAllByRole('link')).toHaveLength(11)
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

    await user.click(
      await screen.findByRole('combobox', { name: 'Rows per page' }),
    )
    await user.click(await screen.findByRole('option', { name: '2' }))

    expect(setPerPage).toHaveBeenCalledWith(2)
  })
})
