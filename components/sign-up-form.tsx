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

export function SignUpForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    await authClient.signUp.email(
      {
        email,
        password,
        name,
        callbackURL: "/dashboard",
      },
      {
        onRequest: () => setLoading(true),
        onSuccess: () => router.push("/dashboard"),
        onError: (ctx) => {
          setError(ctx.error.message ?? "Sign up failed")
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
                id="name"
                type="text"
                placeholder="Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
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
              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  required
                  className="text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  required
                  className="text-sm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </Field>
            <Field>
              <Button
                type="submit"
                className="hover:bg-primary/80"
                disabled={loading}
              >
                {loading ? <span>Signing up...</span> : <span>Sign up</span>}
              </Button>
              <FieldDescription className="text-center flex flex-wrap justify-end gap-2">
                <span>Already a user?</span>
                <a
                  href="/sign-in"
                  className="text-primary no-underline! hover:underline!"
                >
                  Sign in
                </a>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
