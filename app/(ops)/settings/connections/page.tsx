import SettingsCard from "@/components/ops/settings/settings-card"
import { SimbriefFormWrapper } from "@/components/ops/settings/connections/simbrief-form-wrapper"

export default async function AccountPage() {
  return (
    <div className="flex flex-col gap-6">
      <SettingsCard title="">
        <SimbriefFormWrapper />
      </SettingsCard>
    </div>
  )
}
