"use client"
import { useState } from "react"

import { useRouter } from "next/navigation"

import { SimoccLogo } from "@/components/simocc-logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"

export function SignInForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    await authClient.signIn.email(
      {
        email,
        password,
        callbackURL: "/dashboard",
        rememberMe: true,
      },
      {
        onRequest: () => setLoading(true),
        onSuccess: () => router.push("/dashboard"),
        onError: (ctx) => {
          setError(ctx.error.message ?? "Sign in failed")
          setLoading(false)
        },
      }
    )
  }

  return (
    <Card className="bg-background @container">
      <CardHeader className="flex flex-col items-center justify-center text-center">
        <SimoccLogo className="w-12 h-12 shrink-0 text-foreground" />
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          {error && <p className="text-sm text-destructive mb-4">{error}</p>}
          <FieldGroup>
            <Field>
              <Input
                id="email"
                type="email"
                placeholder="Email"
                required
                className="text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                required
                className="text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {/* <a href="#" className=" flex-0 bg-secondary hover:bg-secondary/80 border rounded-md aspect-square text-center content-center">
                ?
              </a> */}
              <FieldDescription className="flex items-end">
                <a
                  href="#"
                  className="ml-auto text-sm text-right text-primary no-underline! hover:underline!"
                >
                  Forgot password?
                </a>
              </FieldDescription>
            </Field>
            <Field>
              <Button
                type="submit"
                className="hover:bg-primary/80"
                disabled={loading}
              >
                {loading ? <span>Signing in...</span> : <span>Sign in</span>}
              </Button>
              <FieldDescription className="text-center flex flex-wrap justify-end gap-2">
                <span>Not yet a user?</span>
                <a
                  href="/sign-up"
                  className="text-primary no-underline! hover:underline!"
                >
                  Sign up
                </a>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
