"use client"

import { useState } from "react"

import { Check, CircleAlert, CircleCheck, SquarePen, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"
import { AUTH_TIMEOUT_MS, MIN_LOADING_DELAY_MS } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface ChangeNameFormProps {
  currentName: string
}

export function ChangeNameForm({ currentName }: ChangeNameFormProps) {
  const [newName, setNewName] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [nameChanged, setNameChanged] = useState(false)

  const { data: session } = authClient.useSession()
  const name = session?.user.name ?? currentName

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})

    const trimmed = newName.trim()

    const validationErrors: Record<string, string> = {}
    if (!trimmed) validationErrors.newName = "Please enter a display name."
    else if (trimmed === name)
      validationErrors.newName = "Display name is the same."

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
      authClient.updateUser({ name: trimmed }),
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

    setIsEditing(false)
    setNewName("")
    setErrors({})
    setNameChanged(true)
    setLoading(false)
  }

  return (
    <>
      <CardHeader>
        <CardTitle>Display name</CardTitle>
      </CardHeader>
      <CardContent>
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
                    <div className="text-sm h-8 w-full min-w-8 px-2.5 flex items-center overflow-scroll rounded-lg border border-transparent bg-input dark:bg-input/30">
                      <span>{name}</span>
                    </div>
                    <Button
                      className="aspect-square @max-3xs:grow"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(true)
                        setNameChanged(false)
                      }}
                    >
                      <SquarePen />
                    </Button>
                  </>
                )}
                {isEditing && (
                  <>
                    <Input
                      type="text"
                      placeholder="New display name"
                      autoComplete="nickname"
                      disabled={loading}
                      className={cn(
                        "text-sm min-w-8",
                        (errors.newName || errors.general) &&
                          "border-destructive"
                      )}
                      value={newName}
                      onChange={(e) => {
                        setNewName(e.target.value)
                        setErrors((prev) => ({ ...prev, newName: "" }))
                      }}
                    />
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
                      onClick={() => {
                        setIsEditing(false)
                        setNewName("")
                        setErrors({})
                      }}
                    >
                      <X />
                    </Button>
                  </>
                )}
              </div>
              {(errors.newName || errors.general) && (
                <FieldDescription className="flex gap-2 text-destructive">
                  <span>
                    <CircleAlert className="size-4 shrink-0 grow-0 mb-0.75 inline" />{" "}
                    {errors.newName || errors.general}
                  </span>
                </FieldDescription>
              )}
              {loading && (
                <FieldDescription className="text-left flex flex-wrap justify-end gap-2">
                  <span>Processing . . .</span>
                </FieldDescription>
              )}
              {nameChanged && !isEditing && (
                <FieldDescription className="flex gap-2 text-green-500">
                  <span>
                    <CircleCheck className="size-4 shrink-0 grow-0 mb-0.75 inline" />{" "}
                    Display name updated.
                  </span>
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </>
  )
}
