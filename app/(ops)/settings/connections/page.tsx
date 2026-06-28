import SettingsConnectionsCard from "@/components/ops/settings/connections/settings-connections-card"
import { SimbriefFormWrapper } from "@/components/ops/settings/connections/simbrief-form-wrapper"

export default async function AccountPage() {
  return (
    <div className="flex flex-col gap-6">
      <SettingsConnectionsCard title="">
        <SimbriefFormWrapper />
      </SettingsConnectionsCard>
    </div>
  )
}
