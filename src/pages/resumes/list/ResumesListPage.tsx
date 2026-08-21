import { Heading1, Subheading } from '@/components/ui'
import { useModal } from '@/components/modal'
import { useToast } from '@/components/toast'
import type { Resume } from '@/db/db'
import { createResume } from '@/db/resume'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useResumeTable } from '@/hooks/useResumeTable'
import { ResumeListContent } from '@/pages/resumes/list/components/ResumeListContent'
import { Toolbar } from '@/pages/resumes/list/components/Toolbar'
import { DeleteResumeDialog } from '@/pages/resumes/list/components/DeleteResumeDialog'

export default function ResumesListPage() {
  const table = useResumeTable()
  const deleteModal = useModal(DeleteResumeDialog, {
    closeOnBackdropClick: false,
    closeOnEscape: true,
  })
  const toast = useToast()

  usePageTitle('Resumes')

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
        onDuplicate={handleDuplicate}
        onDelete={deleteModal.open}
      />
    </section>
  )
}
