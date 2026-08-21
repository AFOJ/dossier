import { useParams } from 'react-router-dom'
import { Heading1, Subheading } from '@/components/ui'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function EditResumePage() {
  const { resumeId } = useParams()

  usePageTitle('Edit resume')

  return (
    <section className="flex flex-col gap-6">
      <header>
        <div className="flex flex-col gap-1">
          <Heading1>Edit Resume</Heading1>
          <Subheading>Resume ID: {resumeId}</Subheading>
        </div>
      </header>
    </section>
  )
}
