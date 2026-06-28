import { ChangeEmailForm } from "@/components/ops/settings/account/change-email-form"
import { ChangeNameForm } from "@/components/ops/settings/account/change-name-form"
import { ChangePasswordForm } from "@/components/ops/settings/account/change-password-form"
import { DeleteAccountContent } from "@/components/ops/settings/account/delete-account-content"
import SettingsCard from "@/components/ops/settings/settings-card"
import { getSession } from "@/lib/get-session"

export default async function AccountPage() {
  const session = await getSession()
  if (!session) return null

  return (
    <div className="flex flex-col gap-6">
      <SettingsCard title="Display name">
        <ChangeNameForm currentName={session.user.name} />
      </SettingsCard>
      <SettingsCard title="Email">
        <ChangeEmailForm currentEmail={session.user.email} />
      </SettingsCard>
      <SettingsCard title="Password">
        <ChangePasswordForm />
      </SettingsCard>
      <SettingsCard title="Delete account">
        <DeleteAccountContent />
      </SettingsCard>
    </div>
  )
}
