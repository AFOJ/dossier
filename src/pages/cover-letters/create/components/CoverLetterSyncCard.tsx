import { useWatch, type Control } from "react-hook-form"
import { Card } from "@/components/ui"
import { SyncSwitch } from "@/pages/resumes/create/components/SyncSwitch"
import { PersonalInfoFields } from "@/pages/profile/components/PersonalInfoFields"
import { SocialLinksFields } from "@/pages/profile/components/SocialLinksFields"
import type { CoverLetterFormData } from "@/pages/cover-letters/create/hooks/useCreateCoverLetterForm"

type CoverLetterSyncCardProps = {
  control: Control<CoverLetterFormData>
  onSyncChange: (sync: boolean) => void
}

export function CoverLetterSyncCard(props: Readonly<CoverLetterSyncCardProps>) {
  const { control, onSyncChange } = props

  const syncProfile = useWatch({ control, name: "syncProfile" })

  return (
    <Card>
      <div className="flex items-center gap-3">
        <SyncSwitch
          checked={syncProfile}
          onCheckedChange={onSyncChange}
          label="Use my profile information"
        />
        <span className="text-sm font-medium text-gray-900">Use my profile information</span>
      </div>
      <p className="text-sm text-gray-700">
        {syncProfile
          ? "This cover letter will always reflect your current profile details."
          : "This cover letter uses its own contact details, independent of your profile."}
      </p>

      {!syncProfile && (
        <Card tone="plain" className="gap-6">
          <PersonalInfoFields />
          <SocialLinksFields />
        </Card>
      )}
    </Card>
  )
}
