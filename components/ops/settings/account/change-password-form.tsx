"use client"
import { useState } from "react"

import { Check, SquarePen, X } from "lucide-react"

import { StatusMessage } from "@/components/ops/settings/status-message"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"
import {
  AUTH_TIMEOUT_MS,
  MIN_LOADING_DELAY_MS,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/lib/constants"
import { cn } from "@/lib/utils"
import { SettingsDescription } from "@/components/ops/settings/settings-description"

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [passwordChanged, setPasswordChanged] = useState(false)

  const handleCancel = () => {
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setIsEditing(false)
    setErrors({})
  }

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})

    const validationErrors: Record<string, string> = {}
    if (!currentPassword)
      validationErrors.currentPassword = `Please enter your current password.`
    if (newPassword.length < PASSWORD_MIN_LENGTH)
      validationErrors.newPassword = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
    if (newPassword.length > PASSWORD_MAX_LENGTH)
      validationErrors.newPassword = `Password must be less than ${PASSWORD_MAX_LENGTH} characters.`
    if (newPassword !== confirmPassword)
      validationErrors.confirmPassword = "Passwords do not match."

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)

    const minDelay = new Promise((resolve) =>
      setTimeout(resolve, MIN_LOADING_DELAY_MS)
    )

    if (!navigator.onLine) {
      minDelay.then(() => {
        setErrors({ general: "Connection error. Please try again." })
        setLoading(false)
      })
      return
    }

    const timeoutId = setTimeout(() => {
      minDelay.then(() => {
        setErrors({ general: "Request timed out. Please try again." })
        setLoading(false)
      })
    }, AUTH_TIMEOUT_MS)

    const [{ error }] = await Promise.all([
      authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      }),
      minDelay,
    ])

    clearTimeout(timeoutId)

    if (error) {
      setErrors({
        general:
          error.code === "INVALID_PASSWORD"
            ? "Current password is incorrect."
            : (error.message ?? "Something went wrong. Please try again."),
      })
      setLoading(false)
      return
    }

    handleCancel()
    setPasswordChanged(true)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        <Field>
          {!isEditing ? (
            <div className="flex flex-row flex-nowrap justify-baseline gap-2 @max-[8rem]:flex-wrap">
              <div className="text-sm h-8 w-full min-w-8 px-2.5 flex items-center rounded-lg border border-transparent bg-input dark:bg-input/30">
                <span className="text-3xl overflow-hidden">
                  ••••••••••••
                </span>
              </div>
              <Button
                type="button"
                className="aspect-square @max-3xs:grow"
                variant="outline"
                onClick={() => {
                  setIsEditing(true)
                  setPasswordChanged(false)
                }}
              >
                <SquarePen />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Field>
                <Input
                  type="password"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="current-password"
                  className={cn(
                    "text-sm",
                    errors.currentPassword && "border-destructive"
                  )}
                />
                {errors.currentPassword && (
                  <StatusMessage
                    variant="error"
                    text={errors.currentPassword}
                  />
                )}
              </Field>
              <Field>
                <Input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    setErrors((prev) => ({ ...prev, newPassword: "" }))
                  }}
                  disabled={loading}
                  required
                  autoComplete="new-password"
                  className={cn(
                    "text-sm",
                    (errors.newPassword || errors.confirmPassword) &&
                    "border-destructive"
                  )}
                />
                {errors.newPassword && (
                  <StatusMessage
                    variant="error"
                    text={errors.newPassword}
                  />
                )}
              </Field>
              <Field>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setErrors((prev) => ({ ...prev, confirmPassword: "" }))
                  }}
                  disabled={loading}
                  required
                  autoComplete="new-password"
                  className={cn(
                    "text-sm",
                    (errors.newPassword || errors.confirmPassword) &&
                    "border-destructive"
                  )}
                />
                {errors.confirmPassword && (
                  <StatusMessage
                    variant="error"
                    text={errors.confirmPassword}
                  />
                )}
              </Field>
              <Field>
                <div className="flex flex-row justify-end gap-2 @max-3xs:flex-wrap">
                  <Button
                    type={!loading ? "submit" : "button"}
                    className={cn(
                      "aspect-square @max-3xs:grow",
                      loading &&
                      "text-primary border-border! no-underline! hover:pointer-events-none"
                    )}
                    variant={loading ? "ghost" : "default"}
                    disabled={loading}
                  >
                    {!loading ? <Check /> : <Spinner className="size-5" />}
                  </Button>
                  <Button
                    type="button"
                    className={cn(
                      "aspect-square @max-3xs:grow",
                      loading &&
                      "text-primary border-border! no-underline! hover:pointer-events-none"
                    )}
                    variant={loading ? "ghost" : "outline"}
                    disabled={loading}
                    onClick={handleCancel}
                  >
                    <X />
                  </Button>
                </div>
                {errors.general && (
                  <StatusMessage variant="error" text={errors.general} />
                )}
                {isEditing && (
                  <SettingsDescription loading={loading} message="Enter your current and new password." />
                )}
              </Field>
            </div>
          )}
          {passwordChanged && (
            <StatusMessage
              variant="success"
              text="Password changed successfully."
            />
          )}
        </Field>
      </FieldGroup>
    </form>
  )
}
