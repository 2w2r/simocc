import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/lib/auth"

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Exclude all non-public routes to cover (ops) until e.g. subdomain is implemented
  matcher: [
    "/((?!$|sign-in|sign-up|forgot-password|reset-password|api|_next/static|_next/image|favicon.ico|manifest|icons).*)",
  ],
}
