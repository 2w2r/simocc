import { ChangeEmailForm } from "@/components/ops/settings/account/change-email-form"
import { ChangeNameForm } from "@/components/ops/settings/account/change-name-form"
import { ChangePasswordForm } from "@/components/ops/settings/account/change-password-form"
import { DeleteAccountContent } from "@/components/ops/settings/account/delete-account-content"
import SettingsAccountCard from "@/components/ops/settings/account/settings-account-card"
import { getSession } from "@/lib/get-session"

export default async function AccountPage() {
  const session = await getSession()
  if (!session) return null

  return (
    <div className="flex flex-col gap-6">
      <SettingsAccountCard>
        <ChangeNameForm currentName={session.user.name} />
      </SettingsAccountCard>
      <SettingsAccountCard>
        <ChangeEmailForm currentEmail={session.user.email} />
      </SettingsAccountCard>
      <SettingsAccountCard>
        <ChangePasswordForm />
      </SettingsAccountCard>
      <SettingsAccountCard>
        <DeleteAccountContent />
      </SettingsAccountCard>
    </div>
  )
}
