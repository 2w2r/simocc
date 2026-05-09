import type { Metadata } from "next"

import { OpsBreadcrumb } from "@/components/ops/ops-breadcrumb"
import { OpsSidebar } from "@/components/ops/ops-sidebar"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { APP_NAME } from "@/lib/constants"

export const metadata: Metadata = {
  title: {
    template: `%s | ${APP_NAME}`,
    default: APP_NAME,
  },
}

export default function OpsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <SidebarProvider>
      <OpsSidebar />
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
