import { Heading1, Subheading } from '@/components/ui'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function CreateResumePage() {
  usePageTitle('Create resume')

  return (
    <section className="flex flex-col gap-6">
      <header>
        <div className="flex flex-col gap-1">
          <Heading1>Create Resume</Heading1>
          <Subheading>Start building a new resume.</Subheading>
        </div>
      </header>
    </section>
  )
}
