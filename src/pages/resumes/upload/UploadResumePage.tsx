import { DuplicateResumeDialog } from './components/DuplicateResumeDialog'
import { getResume, createResume, updateResume } from '@/db/resume'
import { Heading1, Subheading } from '@/components/ui'
import { UploadResumeJson } from './UploadResumeJson'
import { useModal } from '@/components/modal'
import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useToast } from '@/components/toast'
import type { Resume } from '@/db/db'

export default function UploadResumePage() {
  usePageTitle('Upload resume')
  const navigate = useNavigate()
  const toast = useToast()

  const { open: openConflictModal } = useModal(DuplicateResumeDialog, {
    contentClassName: 'max-w-lg',
  })

  const handleParsed = async (
    incomingResume: Resume,
    incomingResumeId: string,
  ) => {
    const existingResume = await getResume(incomingResumeId)

    if (!existingResume) {
      await createResume(incomingResume.title, incomingResume.sections, {
        syncProfile: incomingResume.syncProfile,
        contact: incomingResume.contact,
      })
      toast.success(
        'Resume imported',
        `"${incomingResume.title}" was imported successfully.`,
      )
      navigate('/resumes')
      return
    }

    openConflictModal({
      existingResume,
      incomingResume,
      incomingResumeId,
      onOverwrite: async () => {
        await updateResume(existingResume.id!, {
          title: incomingResume.title,
          sections: incomingResume.sections,
          syncProfile: incomingResume.syncProfile,
          contact: incomingResume.contact,
        })
        toast.success(
          'Resume updated',
          `"${incomingResume.title}" was overwritten.`,
        )
        navigate('/resumes')
      },
      onCreateCopy: async () => {
        await createResume(
          `Copy of ${incomingResume.title}`,
          incomingResume.sections,
          {
            syncProfile: incomingResume.syncProfile,
            contact: incomingResume.contact,
          },
        )
        toast.success(
          'Resume imported',
          `"Copy of ${incomingResume.title}" was imported as a copy.`,
        )
        navigate('/resumes')
      },
    })
  }

  return (
    <section className="flex flex-col gap-6">
      <header>
        <div className="flex flex-col gap-1">
          <Heading1>Upload Resume</Heading1>
          <Subheading>Import an existing resume.</Subheading>
        </div>
      </header>
      <UploadResumeJson onParsed={handleParsed} />
    </section>
  )
}
