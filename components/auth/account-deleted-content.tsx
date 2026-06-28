"use client"

import { useRouter } from "next/navigation"

import { CircleCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field"

export function AccountDeletedContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()

  return (
    <FieldGroup>
      <Field>
        <FieldDescription className="flex gap-2 items-center text-green-500">
          <CircleCheck className="size-4" />{" "}
          <span>Account deleted successfully.</span>
        </FieldDescription>
      </Field>
      <Field>
        <Button
          type="button"
          className="hover:bg-primary/80"
          onClick={() => router.push("/")}
        >
          <span>Exit to SIMOCC</span>
        </Button>
        <FieldDescription className="text-center flex flex-wrap justify-end gap-2">
          <span>Want a new account?</span>
          <a
            href="/sign-up"
            className="text-primary no-underline! hover:underline!"
          >
            Sign up
          </a>
        </FieldDescription>
      </Field>
    </FieldGroup>
  )
}
