import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createResume, updateResume } from "@/db/resume"
import { db } from "@/db/db"
import type { Resume } from "@/db/db"
import { processResume } from "@/lib/api"
import { downloadBlob } from "@/lib/download"
import { upsertSettings } from "@/db/settings"
import { useProcessedResume } from "@/pages/resumes/list/hooks/useProcessedResume"

vi.mock("@/lib/api", () => ({
  ApiError: class ApiError extends Error {
    code: string
    constructor(code: string, message: string) {
      super(message)
      this.code = code
    }
  },
  processResume: vi.fn(),
}))

vi.mock("@/lib/download", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/download")>()
  return { ...actual, downloadBlob: vi.fn() }
})

const mockProcessResume = vi.mocked(processResume)

const PDF = () => new Blob(["%PDF-fake"], { type: "application/pdf" })

async function makeResume(): Promise<Resume> {
  const id = await createResume("Frontend Engineer", [
    { type: "paragraph", title: "Summary", text: "Summary" },
  ])
  return (await db.resumes.get(id))!
}

beforeEach(async () => {
  vi.clearAllMocks()
  await db.profiles.clear()
  await db.resumes.clear()
  await db.entityCache.clear()

  mockProcessResume.mockImplementation(() => Promise.resolve(PDF()))
})

describe("useProcessedResume", () => {
  it("processes the resume on mount and exposes a preview URL", async () => {
    const resume = await makeResume()

    const { result } = renderHook(() => useProcessedResume(resume))

    expect(result.current.status).toBe("loading")

    await waitFor(() => {
      expect(result.current.status).toBe("ready")
    })

    expect(mockProcessResume).toHaveBeenCalledTimes(1)
    expect(result.current.url).toMatch(/^blob:/)
    expect(result.current.processedAt).toBeInstanceOf(Date)
  })

  it("serves subsequent mounts from the cache without refetching", async () => {
    const resume = await makeResume()

    const first = renderHook(() => useProcessedResume(resume))
    await waitFor(() => expect(first.result.current.status).toBe("ready"))
    first.unmount()

    const second = renderHook(() => useProcessedResume(resume))
    await waitFor(() => expect(second.result.current.status).toBe("ready"))

    expect(mockProcessResume).toHaveBeenCalledTimes(1)
  }, 20_000)

  it("discards an in-flight result when the resume changes and refetches", async () => {
    const firstResume = await makeResume()
    let release!: (blob: Blob) => void
    const gate = new Promise<Blob>((resolve) => {
      release = resolve
    })
    mockProcessResume.mockReturnValueOnce(gate)

    const { result, rerender } = renderHook(
      ({ resume }: { resume: Resume }) => useProcessedResume(resume),
      { initialProps: { resume: firstResume } },
    )

    expect(result.current.status).toBe("loading")

    const secondResume = await makeResume()
    mockProcessResume.mockResolvedValueOnce(PDF())
    rerender({ resume: secondResume })

    release(PDF())

    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(mockProcessResume).toHaveBeenCalledTimes(2)
    expect(mockProcessResume.mock.calls[0][0].title).toBe(firstResume.title)
    expect(mockProcessResume.mock.calls[1][0].title).toBe(secondResume.title)
  }, 20_000)

  it("refetches when the cached copy has expired", async () => {
    const { CACHE_TTL_MS } = await import("@/db/entityCache")
    const resume = await makeResume()

    // Seed an already-expired cache entry.
    await db.entityCache.put({
      id: `resume:${resume.id!}`,
      entityType: "resume",
      entityId: resume.id!,
      data: await PDF().arrayBuffer(),
      contentType: "application/pdf",
      processedAt: new Date(Date.now() - CACHE_TTL_MS - 5_000),
      expiresAt: new Date(Date.now() - 1_000),
    })

    const { result } = renderHook(() => useProcessedResume(resume))

    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(mockProcessResume).toHaveBeenCalledTimes(1)
  }, 20_000)

  it("refetches after the resume is updated (cache invalidated)", async () => {
    const resume = await makeResume()

    const first = renderHook(() => useProcessedResume(resume))
    await waitFor(() => expect(first.result.current.status).toBe("ready"))
    first.unmount()

    await updateResume(resume.id!, {
      sections: [{ type: "paragraph", title: "Updated", text: "Updated" }],
    })
    const updated = (await db.resumes.get(resume.id!))!

    const second = renderHook(() => useProcessedResume(updated))
    await waitFor(() => expect(second.result.current.status).toBe("ready"))

    expect(mockProcessResume).toHaveBeenCalledTimes(2)
  }, 20_000)

  it("reports errors from processing and recovers via retry", async () => {
    mockProcessResume.mockRejectedValueOnce(
      new Error("Something went wrong while preparing the resume."),
    )

    const resume = await makeResume()
    const { result } = renderHook(() => useProcessedResume(resume))

    await waitFor(() => expect(result.current.status).toBe("error"))
    expect(result.current.error?.message).toContain("Something went wrong")

    // Retry (same path as the download action) recovers.
    mockProcessResume.mockResolvedValueOnce(PDF())
    await result.current.download()

    await waitFor(() => expect(result.current.status).toBe("ready"))
    expect(mockProcessResume).toHaveBeenCalledTimes(2)
  }, 20_000)

  it("names the PDF download from the resume filename format", async () => {
    const resume = await makeResume()
    const { result } = renderHook(() => useProcessedResume(resume))
    await waitFor(() => expect(result.current.status).toBe("ready"))

    await result.current.download()

    expect(vi.mocked(downloadBlob)).toHaveBeenCalledWith(
      "frontend-engineer-resume.pdf",
      expect.any(Blob),
    )
  }, 20_000)

  it("honors a custom resume filename format", async () => {
    await upsertSettings({ defaultResumePdfFilenameFormat: "{title}-CV.pdf" })
    try {
      const resume = await makeResume()
      const { result } = renderHook(() => useProcessedResume(resume))
      await waitFor(() => expect(result.current.status).toBe("ready"))

      await result.current.download()

      expect(vi.mocked(downloadBlob)).toHaveBeenCalledWith(
        "frontend-engineer-CV.pdf",
        expect.any(Blob),
      )
    } finally {
      await db.settings.clear()
    }
  }, 20_000)

  it("uses the shared format when the pattern is shared", async () => {
    await upsertSettings({
      pdfFilenamePattern: "shared",
      defaultPdfFilenameFormat: "{kind}-{title}.pdf",
    })
    try {
      const resume = await makeResume()
      const { result } = renderHook(() => useProcessedResume(resume))
      await waitFor(() => expect(result.current.status).toBe("ready"))

      await result.current.download()

      expect(vi.mocked(downloadBlob)).toHaveBeenCalledWith(
        "resume-frontend-engineer.pdf",
        expect.any(Blob),
      )
    } finally {
      await db.settings.clear()
    }
  }, 20_000)
})
