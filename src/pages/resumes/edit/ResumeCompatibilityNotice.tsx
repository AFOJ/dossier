import { useNavigate } from "react-router-dom"
import { Button, Heading1, Subheading } from "@/components/ui"
import type { Resume } from "@/db/db"
import { downloadJson, getExportFilenameWithSettings } from "@/lib/download"
import { toResumeExportPayload } from "@/lib/resumeExport"
import { useSettings } from "@/hooks/useSettings"

type Props = { resume: Resume; unsupported: boolean }

export function ResumeCompatibilityNotice({ resume, unsupported }: Readonly<Props>) {
  const navigate = useNavigate()
  const { settings } = useSettings()
  return (
    <section className="flex max-w-xl flex-col gap-4 py-8">
      <Heading1>
        {unsupported ? "Refresh to edit this document" : "This document cannot be edited safely"}
      </Heading1>
      <Subheading>
        {unsupported
          ? "This document contains a section this version of Dossier doesn't support. Refresh to load the latest version. Your saved document is unchanged."
          : "Some section information is missing or invalid. Your saved document is unchanged. You can download the original JSON for recovery."}
      </Subheading>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => navigate(0)}>Refresh page</Button>
        <Button intent="secondary" onClick={() => navigate("/resumes")}>
          Back to resumes
        </Button>
        <Button
          intent="secondary"
          onClick={() =>
            downloadJson(
              getExportFilenameWithSettings("resume", resume.title, settings),
              toResumeExportPayload(resume),
            )
          }
        >
          Download original JSON
        </Button>
      </div>
    </section>
  )
}
