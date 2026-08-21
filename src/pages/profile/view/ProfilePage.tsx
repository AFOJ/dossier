import { Heading1, Subheading } from '@/components/ui'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function ProfilePage() {
  usePageTitle('Manage your profile')

  return (
    <section className="flex flex-col gap-6">
      <header>
        <div className="flex flex-col gap-1">
          <Heading1>Profile</Heading1>
          <Subheading>Your personal information.</Subheading>
        </div>
      </header>
    </section>
  )
}
