import { createResume } from '@/db/resume'
import { DeleteResumeDialog } from '@/pages/resumes/list/components/DeleteResumeDialog'
import { downloadJson, getExportFilename } from '@/lib/download'
import { Heading1, Subheading } from '@/components/ui'
import { ResumeListContent } from '@/pages/resumes/list/components/ResumeListContent'
import { ResumePreviewDialog } from '@/pages/resumes/list/components/ResumePreviewDialog'
import { slugify } from '@/utils'
import { Toolbar } from '@/pages/resumes/list/components/Toolbar'
import { toResumePayload } from '@/lib/resumePayload'
import { useModal } from '@/components/modal'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useResumeTable } from '@/hooks/useResumeTable'
import { useToast } from '@/components/toast'
import type { Resume } from '@/db/db'

export default function ResumesListPage() {
  const table = useResumeTable()
  const deleteModal = useModal(DeleteResumeDialog, {
    closeOnBackdropClick: false,
    closeOnEscape: true,
  })
  const previewModal = useModal(ResumePreviewDialog, {
    contentClassName: 'max-w-none sm:max-w-2xl',
  })
  const toast = useToast()

  usePageTitle('Resumes')

  const handlePreview = (resume: Resume) => previewModal.open(resume)

  const handleExport = async (resume: Resume) => {
    try {
      const filename = getExportFilename(
        'resume',
        new Date(),
        slugify(resume.title),
      )
      downloadJson(filename, await toResumePayload(resume))
      toast.success('Resume exported', `Saved ${filename}.`)
    } catch {
      toast.error('Could not export resume', 'Please try again.')
    }
  }

  const handleDuplicate = async (resume: Resume) => {
    try {
      await createResume(`Copy of ${resume.title}`, resume.sections)
      toast.success('Resume duplicated', `"${resume.title}" was duplicated.`)
    } catch {
      toast.error('Failed to duplicate resume', 'Please try again.')
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <header>
        <div className="flex flex-col gap-1">
          <Heading1>Resumes</Heading1>
          <Subheading>All your resumes in one place.</Subheading>
        </div>
      </header>

      <Toolbar query={table.query} onQueryChange={table.setQuery} />

      <ResumeListContent
        table={table}
        onPreview={handlePreview}
        onExport={handleExport}
        onDuplicate={handleDuplicate}
        onDelete={deleteModal.open}
      />
    </section>
  )
}
