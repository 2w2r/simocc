"use client"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"
import { MIN_LOADING_DELAY_MS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { StatusMessage } from "@/components/ui/status-message"

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  // loading controls UI state during the request
  const [loading, setLoading] = useState(false)
  // submitted controls UI state after a successful request
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})

    // Match structure of sign up for consistency despite only validating email
    const validationErrors: Record<string, string> = {}
    if (!email.includes("@"))
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

    // Request without errors to prevent enumeration
    await Promise.all([
      authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      }),
      minDelay,
    ])

    setSubmitted(true)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        <Field>
          <Input
            type="email"
            placeholder="Email"
            disabled={loading || submitted}
            required
            className={cn("text-sm", errors.email && "border-destructive")}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setErrors((prev) => ({ ...prev, email: "" }))
            }}
          />
          {errors.email && (
            <StatusMessage variant="error" text={errors.email} />
          )}
          {submitted && (
            <StatusMessage variant="info" text="Check your inbox." />
          )}
        </Field>
        <Field>
          <Button
            type={!submitted ? "submit" : "button"}
            className={cn(
              "hover:bg-primary/80",
              (loading || submitted) &&
              "border-border!"
            )}
            variant={(loading || submitted) ? "ghost" : "default"}
            disabled={loading}
          >
            {!loading && !submitted ? (
              <span>Request reset</span>
            ) : loading && !submitted ? (
              <Spinner className="size-5" />
            ) : (
              <a href="/sign-in" className="form-link">Return to sign-in</a>
            )}
          </Button>
          {errors.general && (
            <StatusMessage variant="error" text={errors.general} />
          )}
          <FieldDescription className="text-center flex flex-wrap justify-end gap-2">
            {!loading && !submitted ? (
              <>
                <span>Remember password?</span>
                <a
                  href="/sign-in"
                  className="form-link"
                >
                  Sign in
                </a>
              </>
            ) : loading && !submitted ? (
              <span>Processing . . .</span>
            ) : (
              <>
                <span>No success?</span>
                <a
                  href="/forgot-password"
                  className="form-link"
                >
                  Try again
                </a>
              </>
            )}
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
