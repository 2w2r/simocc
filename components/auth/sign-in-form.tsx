"use client"
import { useState } from "react"

import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"
import { AUTH_TIMEOUT_MS, MIN_LOADING_DELAY_MS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { StatusMessage } from "@/components/ops/settings/status-message"

export function SignInForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  // loading controls UI state for the request processing time
  const [loading, setLoading] = useState(false)
  // submitted controls UI state between setLoading(false) and router.push including the post-success delay
  const [submitted, setSubmitted] = useState(false)
  let aborted = false

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

    const timeoutId = setTimeout(() => {
      aborted = true
      minDelay.then(() => {
        setErrors({ form: "Request timed out. Please try again." })
        setLoading(false)
      })
    }, AUTH_TIMEOUT_MS)

    await Promise.all([
      authClient.signIn.email(
        {
          email,
          password,
          callbackURL: "/dashboard",
          rememberMe: true,
        },
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
            const message = ctx.error.message ?? ""
            setErrors(
              message === "Invalid email or password"
                ? { invalid: "Invalid email or password." }
                : { general: "Sign-in failed. Please try again." }
            )
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
            id="email"
            type="email"
            placeholder="Email"
            required
            className={`text-sm ${(errors.email || errors.invalid) && "border-destructive"}`}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setErrors((prev) => ({ ...prev, email: "", invalid: "" }))
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
            placeholder="Password"
            required
            className={`text-sm ${errors.invalid && "border-destructive"}`}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setErrors((prev) => ({ ...prev, invalid: "" }))
            }}
          />
          {errors.invalid && (
            <StatusMessage variant="error" text={errors.invalid} />
          )}
          <FieldDescription className="text-center flex flex-wrap justify-end gap-2">
            <span>Forgot password?</span>
            <a
              href="/forgot-password"
              className="form-link"
            >
              Reset
            </a>
          </FieldDescription>
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
            {!loading ? <span>Sign in</span> : <Spinner className="size-5" />}
          </Button>
          {errors.general && (
            <StatusMessage variant="error" text={errors.general} />
          )}
          <FieldDescription className="text-center flex flex-wrap justify-end gap-2">
            {!loading && !submitted ? (
              <>
                <span>Not yet a user?</span>
                <a
                  href="/sign-up"
                  className="form-link"
                >
                  Sign up
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
