"use client"
import { useEffect, useState } from "react"

import { useRouter, useSearchParams } from "next/navigation"

import { Check, RotateCcw, SquarePen, X } from "lucide-react"

import { SettingsDescription } from "@/components/ops/settings/settings-description"
import { StatusMessage } from "@/components/ops/settings/status-message"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"
import { AUTH_TIMEOUT_MS, MIN_LOADING_DELAY_MS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { ensurePeriod } from "@/lib/utils/ensure-period"

interface ChangeEmailCardProps {
  currentEmail: string
}

export function ChangeEmailForm({ currentEmail }: ChangeEmailCardProps) {
  const [newEmail, setNewEmail] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [emailChanged, setEmailChanged] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  // Change email with a verification link via Better Auth using a callbackURL which appends ?changed=email. The useEffect cleans the param from the URL and triggers the success state for a visual confirmation.
  useEffect(() => {
    if (searchParams.get("changed") === "email") {
      setEmailChanged(true)
      router.replace("/settings/account")
    }
  }, [])

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})

    const validationErrors: Record<string, string> = {}
    if (!newEmail.includes("@"))
      validationErrors.email = "Please enter a valid email address."

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
      setLoading(false)
      setErrors({ general: "Request timed out. Please try again." })
    }, AUTH_TIMEOUT_MS)

    const [{ error }] = await Promise.all([
      authClient.changeEmail({
        newEmail,
        callbackURL: "/settings/account?changed=email",
      }),
      minDelay,
    ])

    clearTimeout(timeoutId)

    if (error) {
      setErrors({
        general: ensurePeriod(
          error.message ?? "Something went wrong. Please try again."
        ),
      })
      setLoading(false)
      return
    }

    // Submitted state sets ui on a valid change attempt to a retry option to allow the user to re-enter the email if necessary (e.g., typo noticed, no link received, etc.).
    setSubmitted(true)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        <Field>
          <div
            className={cn(
              "flex flex-row flex-nowrap justify-baseline gap-2",
              isEditing ? "@max-3xs:flex-wrap" : "@max-[8rem]:flex-wrap"
            )}
          >
            {!isEditing && (
              <>
                <div
                  className={cn(
                    "text-sm h-8 w-full min-w-8 px-2.5 flex items-center overflow-scroll rounded-lg border border-transparent bg-input dark:bg-input/30"
                  )}
                >
                  <span>{currentEmail}</span>
                </div>
                <Button
                  className="aspect-square @max-3xs:grow"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(true)
                    setEmailChanged(false)
                  }}
                >
                  <SquarePen />
                </Button>
              </>
            )}
            {isEditing && (
              <>
                <Input
                  type="email"
                  placeholder={
                    isEditing
                      ? "New Email"
                      : submitted
                        ? newEmail
                        : currentEmail
                  }
                  disabled={!isEditing || loading || submitted}
                  required
                  className={cn(
                    "text-sm min-w-8",
                    (errors.email || errors.general) && "border-destructive"
                  )}
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value)
                    setErrors((prev) => ({ ...prev, email: "" }))
                  }}
                />
                {!submitted && (
                  <>
                    <Button
                      type={!loading ? "submit" : "button"}
                      className={cn(
                        "aspect-square @max-3xs:grow",
                        loading &&
                        "text-primary border-border! no-underline! hover:pointer-events-none"
                      )}
                      variant={loading ? "ghost" : "default"}
                      disabled={loading || submitted}
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
                      disabled={loading || submitted}
                      onClick={() => {
                        setIsEditing(false)
                        setNewEmail("")
                        setErrors({})
                      }}
                    >
                      <X />
                    </Button>
                  </>
                )}
                {submitted && (
                  <Button
                    className={cn(
                      "aspect-square @max-3xs:grow",
                      loading &&
                      "text-primary border-border! no-underline! hover:pointer-events-none"
                    )}
                    disabled={loading}
                    variant={loading ? "ghost" : "outline"}
                    onClick={() => {
                      setSubmitted(false)
                    }}
                  >
                    <RotateCcw />
                  </Button>
                )}
              </>
            )}
          </div>
          {!emailChanged && (
            <>
              {(errors.email || errors.general) && (
                <StatusMessage
                  variant="error"
                  text={errors.email || errors.general}
                />
              )}
              {submitted && (
                <StatusMessage variant="info" text="Check your inbox." />
              )}
              {isEditing && !submitted && (
                <SettingsDescription
                  loading={loading}
                  message="A verification link will be sent."
                />
              )}
            </>
          )}
          {emailChanged && (
            <StatusMessage
              variant="success"
              text="Email changed successfully."
            />
          )}
        </Field>
      </FieldGroup>
    </form>
  )
}
