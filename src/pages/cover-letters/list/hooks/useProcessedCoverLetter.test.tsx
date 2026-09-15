import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createCoverLetter, updateCoverLetter } from "@/db/coverLetter"
import { db } from "@/db/db"
import type { CoverLetter } from "@/db/db"
import { processCoverLetter } from "@/lib/api"
import { useProcessedCoverLetter } from "@/pages/cover-letters/list/hooks/useProcessedCoverLetter"

vi.mock("@/lib/api", () => ({
  ApiError: class ApiError extends Error {
    code: string
    constructor(code: string, message: string) {
      super(message)
      this.code = code
    }
  },
  processCoverLetter: vi.fn(),
}))

const mockProcessCoverLetter = vi.mocked(processCoverLetter)

const PDF = () => new Blob(["%PDF-fake"], { type: "application/pdf" })

async function makeLetter(): Promise<CoverLetter> {
  const id = await createCoverLetter(
    {
      title: "Acme Application",
      subject: "Support Engineer",
      body: "<p>Hello</p>",
    },
    { syncProfile: false, contact: null },
  )
  return (await db.coverLetters.get(id))!
}

beforeEach(async () => {
  vi.clearAllMocks()
  await db.profiles.clear()
  await db.coverLetters.clear()
  await db.entityCache.clear()

  mockProcessCoverLetter.mockImplementation(() => Promise.resolve(PDF()))
})

describe("useProcessedCoverLetter", () => {
  it("processes the letter on mount and exposes a preview URL", async () => {
    const letter = await makeLetter()

    const { result } = renderHook(() => useProcessedCoverLetter(letter))

    expect(result.current.status).toBe("loading")

    await waitFor(() => {
      expect(result.current.status).toBe("ready")
    })

    expect(mockProcessCoverLetter).toHaveBeenCalledTimes(1)
    expect(result.current.url).toMatch(/^blob:/)
    expect(result.current.processedAt).toBeInstanceOf(Date)
  })

  it("sends the full letter content (including body) in the payload", async () => {
    const letter = await makeLetter()

    renderHook(() => useProcessedCoverLetter(letter))
    await waitFor(() => expect(mockProcessCoverLetter).toHaveBeenCalledTimes(1))

    const payload = mockProcessCoverLetter.mock.calls[0][0]
    expect(payload).toMatchObject({
      title: letter.title,
      subject: letter.subject,
      body: letter.body,
    })
  })

  it("serves subsequent mounts from the cache without refetching", async () => {
    const letter = await makeLetter()

    const first = renderHook(() => useProcessedCoverLetter(letter))
    await waitFor(() => expect(first.result.current.status).toBe("ready"))
    first.unmount()

    const second = renderHook(() => useProcessedCoverLetter(letter))
    await waitFor(() => expect(second.result.current.status).toBe("ready"))

    expect(mockProcessCoverLetter).toHaveBeenCalledTimes(1)
  }, 20_000)

  it("discards an in-flight result when the letter changes and refetches", async () => {
    const firstLetter = await makeLetter()
    let release!: (blob: Blob) => void
    const gate = new Promise<Blob>((resolve) => {
      release = resolve
    })
    mockProcessCoverLetter.mockReturnValueOnce(gate)

    const { result, rerender } = renderHook(
      ({ letter }: { letter: CoverLetter }) => useProcessedCoverLetter(letter),
      { initialProps: { letter: firstLetter } },
    )

    expect(result.current.status).toBe("loading")

    const secondLetter = await makeLetter()
    mockProcessCoverLetter.mockResolvedValueOnce(PDF())
    rerender({ letter: secondLetter })

    release(PDF())

    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(mockProcessCoverLetter).toHaveBeenCalledTimes(2)
    expect(mockProcessCoverLetter.mock.calls[0][0].title).toBe(firstLetter.title)
    expect(mockProcessCoverLetter.mock.calls[1][0].title).toBe(secondLetter.title)
  }, 20_000)

  it("refetches when the cached copy has expired", async () => {
    const { CACHE_TTL_MS } = await import("@/db/entityCache")
    const letter = await makeLetter()

    // Seed an already-expired cache entry.
    await db.entityCache.put({
      id: `coverLetter:${letter.id!}`,
      entityType: "coverLetter",
      entityId: letter.id!,
      data: await PDF().arrayBuffer(),
      contentType: "application/pdf",
      processedAt: new Date(Date.now() - CACHE_TTL_MS - 5_000),
      expiresAt: new Date(Date.now() - 1_000),
    })

    const { result } = renderHook(() => useProcessedCoverLetter(letter))

    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(mockProcessCoverLetter).toHaveBeenCalledTimes(1)
  }, 20_000)

  it("refetches after the letter is updated (cache invalidated)", async () => {
    const letter = await makeLetter()

    const first = renderHook(() => useProcessedCoverLetter(letter))
    await waitFor(() => expect(first.result.current.status).toBe("ready"))
    first.unmount()

    await updateCoverLetter(letter.id!, { body: "<p>Updated</p>" })
    const updated = (await db.coverLetters.get(letter.id!))!

    const second = renderHook(() => useProcessedCoverLetter(updated))
    await waitFor(() => expect(second.result.current.status).toBe("ready"))

    expect(mockProcessCoverLetter).toHaveBeenCalledTimes(2)
  }, 20_000)

  it("reports errors from processing and recovers via retry", async () => {
    mockProcessCoverLetter.mockRejectedValueOnce(
      new Error("Something went wrong while preparing the cover letter."),
    )

    const letter = await makeLetter()
    const { result } = renderHook(() => useProcessedCoverLetter(letter))

    await waitFor(() => expect(result.current.status).toBe("error"))
    expect(result.current.error?.message).toContain("Something went wrong")

    // Retry (same path as the download action) recovers.
    mockProcessCoverLetter.mockResolvedValueOnce(PDF())
    await result.current.download()

    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(mockProcessCoverLetter).toHaveBeenCalledTimes(2)
  }, 20_000)
})