import { useWatch, type Control } from 'react-hook-form'
import { SyncSwitch } from '@/pages/resumes/create/components/SyncSwitch'
import { PersonalInfoFields } from '@/pages/profile/components/PersonalInfoFields'
import { SocialLinksFields } from '@/pages/profile/components/SocialLinksFields'
import type { ResumeFormData } from '@/pages/resumes/create/hooks/useCreateResumeForm'

type ProfileSyncCardProps = {
  control: Control<ResumeFormData>
  onSyncChange: (sync: boolean) => void
}

export function ProfileSyncCard(props: Readonly<ProfileSyncCardProps>) {
  const { control, onSyncChange } = props

  const syncProfile = useWatch({ control, name: 'syncProfile' })

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center gap-3">
        <SyncSwitch
          checked={syncProfile}
          onCheckedChange={onSyncChange}
          label="Use my profile information"
        />
        <span className="text-sm font-medium text-gray-900">
          Use my profile information
        </span>
      </div>
      <p className="text-sm text-gray-700">
        {syncProfile
          ? 'This resume will always reflect your current profile details.'
          : 'This resume uses its own contact details, independent of your profile.'}
      </p>

      {!syncProfile && (
        <div className="flex flex-col gap-6 rounded-lg border border-gray-200 bg-white p-4">
          <PersonalInfoFields />
          <SocialLinksFields />
        </div>
      )}
    </div>
  )
}
