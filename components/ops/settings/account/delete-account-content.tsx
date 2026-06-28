"use client"

import { useState } from "react"

import { Check, RotateCcw, X } from "lucide-react"

import { StatusMessage } from "@/components/ops/settings/status-message"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"
import { AUTH_TIMEOUT_MS, MIN_LOADING_DELAY_MS } from "@/lib/constants"
import { cn } from "@/lib/utils"

export function DeleteAccountContent() {
  const [isConfirming, setIsConfirming] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleConfirm = async () => {
    setErrors({})
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
      authClient.deleteUser({ callbackURL: "/account-deleted" }),
      minDelay,
    ])

    clearTimeout(timeoutId)

    if (error) {
      setErrors({
        general: error.message ?? "Something went wrong. Please try again.",
      })
      setLoading(false)
      return
    }

    setSubmitted(true)
    setLoading(false)
  }

  return (
    <FieldGroup>
      <Field>
        <div className="flex flex-row flex-nowrap @max-3xs:flex-wrap justify-baseline gap-2">
          <Button
            type="button"
            variant={!isConfirming ? "destructive" : "secondary"}
            className="w-full shrink"
            disabled={isConfirming || loading || submitted}
            onClick={() => setIsConfirming(true)}
          >
            <span className="truncate">Delete account</span>
          </Button>
          {isConfirming && !submitted && (
            <>
              <Button
                type="button"
                className={cn(
                  "aspect-square @max-3xs:grow",
                  loading &&
                  "text-primary border-border! no-underline! hover:pointer-events-none"
                )}
                variant={loading ? "ghost" : "destructive"}
                disabled={loading}
                onClick={handleConfirm}
              >
                {loading ? <Spinner className="size-5" /> : <Check />}
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
                onClick={() => {
                  setIsConfirming(false)
                  setErrors({})
                }}
              >
                <X />
              </Button>
            </>
          )}
          {submitted && (
            <Button
              type="button"
              className="aspect-square @max-3xs:grow"
              variant="outline"
              onClick={() => {
                setSubmitted(false)
              }}
            >
              <RotateCcw />
            </Button>
          )}
        </div>
        {errors.general && (
          <StatusMessage variant="error" text={errors.general} />
        )}
        {submitted && (
          <StatusMessage variant="info" text="Check your inbox." />
        )}
        {isConfirming && (
          <FieldDescription className="text-left flex flex-wrap justify-end gap-2">
            {!loading ? (
              <span>An account deletion link will be sent.</span>
            ) : (
              <span>Processing . . .</span>
            )}
          </FieldDescription>
        )}
      </Field>
    </FieldGroup>
  )
}
