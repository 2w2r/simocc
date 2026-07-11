"use client"
import { useState } from "react"

import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field"
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
import { StatusMessage } from "@/components/ops/settings/status-message"

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  // loading controls UI state during the request
  const [loading, setLoading] = useState(false)
  // submitted controls UI state between setLoading(false) and router.push including the post-success delay
  const [submitted, setSubmitted] = useState(false)

  let aborted = false

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})

    const validationErrors: Record<string, string> = {}
    if (password.length < PASSWORD_MIN_LENGTH)
      validationErrors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
    if (password.length > PASSWORD_MAX_LENGTH)
      validationErrors.password = `Password must be less than ${PASSWORD_MAX_LENGTH} characters.`
    if (password !== confirm)
      validationErrors.confirm = "Passwords do not match."

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    const token = new URLSearchParams(window.location.search).get("token")
    if (!token) {
      setErrors({ invalid: "Reset link is invalid." })
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
      aborted = true
      minDelay.then(() => {
        setErrors({ general: "Request timed out. Please try again." })
        setLoading(false)
      })
    }, AUTH_TIMEOUT_MS)

    const [{ error }] = await Promise.all([
      authClient.resetPassword({
        newPassword: password,
        token,
      }),
      minDelay,
    ])

    clearTimeout(timeoutId)
    if (aborted) return

    if (error) {
      const message = error.message ?? ""
      setErrors(
        message === "Invalid token"
          ? { invalid: "Reset link is invalid or expired." }
          : { general: "Reset failed. Please try again." }
      )
      setLoading(false)
      return
    }

    setSubmitted(true)
    setTimeout(() => {
      setLoading(false)
      router.push("/sign-in")
    }, MIN_LOADING_DELAY_MS * 4)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        <Field>
          <Input
            type="password"
            placeholder="New password"
            disabled={loading || submitted}
            required
            className={cn(
              "text-sm",
              (errors.password || errors.confirm) && "border-destructive"
            )}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setErrors((prev) => ({
                ...prev,
                password: "",
                confirm: "",
              }))
            }}
          />
          {errors.password && (
            <StatusMessage variant="error" text={errors.password} />
          )}
        </Field>
        <Field>
          <Input
            type="password"
            placeholder="Confirm password"
            disabled={loading || submitted}
            required
            className={cn(
              "text-sm",
              (errors.password || errors.confirm) && "border-destructive"
            )}
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value)
              setErrors((prev) => ({ ...prev, confirm: "" }))
            }}
          />
          {errors.confirm && (
            <StatusMessage variant="error" text={errors.confirm} />
          )}
          {submitted && (
            <StatusMessage variant="success" text="Password reset successful." />
          )}
        </Field>
        <Field>
          <Button
            type="submit"
            className={cn(
              "hover:bg-primary/80",
              (loading || submitted) &&
              "border-border!"
            )}
            variant={(loading || submitted) ? "ghost" : "default"}
            disabled={(loading || submitted)}
          >
            {!loading && !submitted ? (
              <span>Reset</span>
            ) : (
              <Spinner className="size-5" />
            )}
          </Button>
          {(errors.invalid || errors.general) && (
            <StatusMessage variant="error" text={errors.invalid || errors.general} />
          )}
          <FieldDescription className="text-center flex flex-wrap justify-end gap-2">
            {errors.invalid ? (
              <>
                <span>Need a new link?</span>
                <a
                  href="/forgot-password"
                  className="form-link"
                >
                  Request one
                </a>
              </>
            ) : !loading && !submitted ? (
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
              <span>Redirecting to sign-in . . .</span>
            )}
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
