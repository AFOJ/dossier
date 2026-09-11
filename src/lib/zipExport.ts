import { zip } from "fflate"
import { downloadBlob } from "@/lib/download"
import { toResumeExportPayload } from "@/lib/resumeExport"
import { slugify } from "@/utils"
import type { Resume } from "@/db/db"

function uniqueFilename(taken: Set<string>, base: string): string {
  if (!taken.has(base)) {
    taken.add(base)
    return base
  }

  const dotIndex = base.lastIndexOf(".")
  const stem = base.slice(0, dotIndex)
  const extension = base.slice(dotIndex)
  let counter = 2
  let candidate = `${stem}-${counter}${extension}`
  while (taken.has(candidate)) {
    counter += 1
    candidate = `${stem}-${counter}${extension}`
  }
  taken.add(candidate)
  return candidate
}

export async function exportResumesAsZip(resumes: Resume[]): Promise<void> {
  const files: Record<string, Uint8Array> = {}
  const takenFilenames = new Set<string>()

  for (const resume of resumes) {
    const filename = uniqueFilename(
      takenFilenames,
      `${slugify(resume.title) || "resume"}-resume.json`,
    )
    files[filename] = new TextEncoder().encode(
      JSON.stringify(toResumeExportPayload(resume), null, 2),
    )
  }

  const dateStr = new Date().toISOString().slice(0, 10)
  const zipFilename = `dossier-resumes-export-${dateStr}.zip`

  await new Promise<void>((resolve, reject) => {
    zip(files, (err, data) => {
      if (err) {
        reject(err)
        return
      }
      downloadBlob(zipFilename, new Blob([data], { type: "application/zip" }))
      resolve()
    })
  })
}
