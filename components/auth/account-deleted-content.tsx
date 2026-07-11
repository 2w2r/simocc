"use client"

import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field"
import { StatusMessage } from "@/components/ui/status-message"

export function AccountDeletedContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()

  return (
    <FieldGroup>
      <Field>
        <StatusMessage variant="success" text="Account deleted successfully." />
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
            className="form-link"
          >
            Sign up
          </a>
        </FieldDescription>
      </Field>
    </FieldGroup>
  )
}
