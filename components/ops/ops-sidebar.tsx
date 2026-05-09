"use client"

import * as React from "react"

import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { OPSNAV } from "@/lib/constants"

export function OpsSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      {/* TODO: user profile switcher in sidebar header */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {OPSNAV.main
                .filter((r) => r.enabled)
                .map((main) => (
                  <SidebarMenuItem key={main.title}>
                    <SidebarMenuButton asChild>
                      <a href={main.url}>
                        <main.icon />
                        <span>{main.title}</span>
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
      {/* TODO: user menu in sidebar footer */}
    </Sidebar>
  )
}
