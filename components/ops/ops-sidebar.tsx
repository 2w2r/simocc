"use client"

import * as React from "react"

import { usePathname } from "next/navigation"

import { ChevronsRight } from "lucide-react"

import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { OPSNAV, SETTINGSNAV } from "@/lib/constants"

export function OpsSidebar({
  navUser,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  navUser: React.ReactNode
}) {
  const pathname = usePathname()
  const isSettings = pathname.startsWith("/settings")

  const items = isSettings
    ? SETTINGSNAV.main
    : OPSNAV.main.filter((r) => r.enabled)

  const navHeader = isSettings ? (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" asChild>
            <a href="/dashboard">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                <ChevronsRight className="size-4 rotate-180" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">RETURN</span>
                <span className="truncate text-xs">to dashboard</span>
              </div>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  ) : (
    // TODO: profile switcher in sidebar header
    <></>
  )

  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <div className="h-full overflow-y-scroll">
        {navHeader}
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
              <Separator
                orientation="horizontal"
                className="my-2 group-data-[state=expanded]:collapse"
              />
            </SidebarGroupContent>
          </SidebarGroup>
          {/* TODO: further sidebar groups */}
        </SidebarContent>
      </div>
      <SidebarFooter>{navUser}</SidebarFooter>
    </Sidebar>
  )
}
