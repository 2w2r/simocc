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
import { StatusMessage } from "@/components/ui/status-message"

export function SignUpForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  // loading controls UI state during the request;
  const [loading, setLoading] = useState(false)
  // submitted controls UI state between setLoading(false) and router.push including the post-success delay
  const [submitted, setSubmitted] = useState(false)
  let aborted = false

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})

    // Check and set errors for error messages and input highlighting
    const validationErrors: Record<string, string> = {}

    if (!name.trim()) validationErrors.name = "Please enter a display name."
    if (!email.includes("@"))
      validationErrors.email = "Please enter a valid email address."
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

    setLoading(true) // For conditional loading ux

    // For visual feedback on submit button
    const minDelay = new Promise((resolve) =>
      setTimeout(resolve, MIN_LOADING_DELAY_MS)
    )

    // In case of no connection
    if (!navigator.onLine) {
      minDelay.then(() => {
        setErrors({ general: "Connection error. Please try again." })
        setLoading(false)
      })
      return
    }

    // In case of timeout
    const timeoutId = setTimeout(() => {
      aborted = true
      minDelay.then(() => {
        setErrors({ general: "Request timed out. Please try again." })
        setLoading(false)
      })
    }, AUTH_TIMEOUT_MS)

    // Request with conditionals for errors
    await Promise.all([
      authClient.signUp.email(
        { email, password, name, callbackURL: "/dashboard" },
        {
          onSuccess: async () => {
            await minDelay
            clearTimeout(timeoutId)
            setSubmitted(true)
            setTimeout(() => {
              setLoading(false)
              router.push("/dashboard")
            }, MIN_LOADING_DELAY_MS * 4)
          },
          onError: async (ctx) => {
            await minDelay
            clearTimeout(timeoutId)
            if (aborted) return
            const messages: Record<string, string> = {}
            setErrors({
              general:
                messages[ctx.error.message ?? ""] ??
                "Sign-up failed. Please try again.",
            })
            setLoading(false)
          },
        }
      ),
      minDelay,
    ])
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        <Field>
          <Input
            id="name"
            type="text"
            placeholder="Name"
            required
            className={cn(
              "text-sm",
              errors.name && "border-destructive"
            )}
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setErrors((prev) => ({ ...prev, name: "" }))
            }}
          />
          {errors.name && (
            <StatusMessage variant="error" text={errors.name} />
          )}
        </Field>
        <Field>
          <Input
            id="email"
            type="email"
            placeholder="Email"
            required
            className={cn(
              "text-sm",
              errors.email && "border-destructive"
            )}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setErrors((prev) => ({ ...prev, email: "" }))
            }}
          />
          {errors.email && (
            <StatusMessage variant="error" text={errors.email} />
          )}
        </Field>
        <Field>
          <Input
            id="password"
            type="password"
            autoComplete="off"
            placeholder="Password"
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
            id="confirm"
            type="password"
            autoComplete="new-password"
            placeholder="Confirm password"
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
            {!loading ? <span>Sign up</span> : <Spinner className="size-5" />}
          </Button>
          {errors.general && !submitted && (
            <StatusMessage variant="error" text={errors.general} />
          )}
          <FieldDescription className="text-center flex flex-wrap justify-end gap-2">
            {!loading && !submitted ? (
              <>
                <span>Already a user?</span>
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
              <span>Redirecting to dashboard . . .</span>
            )}
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
