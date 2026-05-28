import type { Metadata } from "next"
import { headers } from "next/headers"

import { OpsBreadcrumb } from "@/components/ops/ops-breadcrumb"
import { OpsNavUser } from "@/components/ops/ops-nav-user"
import { OpsSidebar } from "@/components/ops/ops-sidebar"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { auth } from "@/lib/auth"
import { APP_NAME } from "@/lib/constants"

export const metadata: Metadata = {
  title: {
    template: `%s | ${APP_NAME}`,
    default: APP_NAME,
  },
}

export default async function OpsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  return (
    <SidebarProvider>
      <OpsSidebar
        navUser={
          <OpsNavUser
            user={{
              name: session?.user.name ?? "",
              email: session?.user.email ?? "",
              avatar: session?.user.image ?? "",
            }}
          />
        }
      />
      <SidebarInset className="min-w-px min-h-px">
        {/* HEADER */}
        <header className="flex justify-between h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <OpsBreadcrumb />
          </div>
          <div className="px-4">
            <ModeToggle />
          </div>
        </header>
        {/* CHILDREN */}
        <div className="flex flex-1 flex-col p-4 pt-0">
          <div className="h-full p-2 rounded-xl bg-muted/50">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
