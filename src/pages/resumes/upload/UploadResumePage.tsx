import { Heading1, Subheading } from '@/components/ui'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function UploadResumePage() {
  usePageTitle('Upload resume')

  return (
    <section className="flex flex-col gap-6">
      <header>
        <div className="flex flex-col gap-1">
          <Heading1>Upload Resume</Heading1>
          <Subheading>Import an existing resume.</Subheading>
        </div>
      </header>
    </section>
  )
}
