import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session) redirect("/dashboard")

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-sidebar p-6 md:p-10 overflow-scroll">
      <div className="flex w-full m-auto min-w-48 max-w-sm flex-col gap-6">
        {children}
      </div>
    </div>
  )
}
