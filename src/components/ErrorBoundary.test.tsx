import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const GENERIC_MESSAGE =
  'We encountered an unexpected error while rendering this page.'

function ThrowingComponent({ error }: { error: unknown }): never {
  throw error
}

function renderLoaderError(error: unknown, onRetry?: () => void) {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <div />,
        loader: () => {
          throw error
        },
        errorElement: <ErrorBoundary onRetry={onRetry} />,
      },
    ],
    { initialEntries: ['/'] },
  )
  return render(<RouterProvider router={router} />)
}

function renderUnknownRoute() {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <div />,
        errorElement: <ErrorBoundary />,
        children: [{ path: 'home', element: <div /> }],
      },
    ],
    { initialEntries: ['/does-not-exist'] },
  )
  return render(<RouterProvider router={router} />)
}

describe('ErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the boundary UI, surfaces the error, and retries on request', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <ThrowingComponent error={new Error('Render boom')} />,
          errorElement: <ErrorBoundary onRetry={onRetry} />,
        },
      ],
      { initialEntries: ['/'] },
    )
    const { container } = render(<RouterProvider router={router} />)

    expect(
      await screen.findByRole('heading', { name: 'Something went wrong' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Render boom')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('uses the response statusText and body as the heading and subheading', async () => {
    renderLoaderError(
      new Response('That resume does not exist anymore.', {
        status: 404,
        statusText: 'Resume not found',
      }),
    )
    expect(
      await screen.findByRole('heading', { name: 'Resume not found' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('That resume does not exist anymore.'),
    ).toBeInTheDocument()
  })

  it('falls back to the generic heading and message for unspecific errors', async () => {
    renderLoaderError(new Response(null, { status: 503 }))
    expect(
      await screen.findByRole('heading', { name: 'Something went wrong' }),
    ).toBeInTheDocument()
    expect(screen.getByText(GENERIC_MESSAGE)).toBeInTheDocument()

    vi.restoreAllMocks()
    renderLoaderError({ broken: true })
    expect(await screen.findByText(GENERIC_MESSAGE)).toBeInTheDocument()
  })

  it('shows the router-generated 404 statusText and message when no route matches', async () => {
    renderUnknownRoute()
    expect(
      await screen.findByRole('heading', { name: 'Not Found' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/No route matches URL "\/does-not-exist"/),
    ).toBeInTheDocument()
  })
})
