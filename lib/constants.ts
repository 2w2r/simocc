import { Metadata } from "next"

import { LayoutGrid } from "lucide-react"

export const APP_NAME = "SIMOCC"
export const APP_DESCRIPTION = "(Flight) Simulation Operations Control Centre"
export const APP_URL = "https://simocc.com"

// Types for OPSNAV items for sidebar sections and icons, url, and whether enabled
type OpsNavItem = {
  title: string
  url: string
  icon: React.ComponentType
  enabled: boolean
}

// Future sections to be added here including sub-sections as required
export const OPSNAV = {
  main: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutGrid, enabled: true },
  ],
} as const

// Flatten array of routes for metadata page titles
const ROUTES: Record<string, OpsNavItem> = Object.fromEntries(
  Object.values(OPSNAV)
    .flat()
    .filter((r) => r.enabled)
    .map((r) => [r.title.toLowerCase(), r])
)

// Receive flat array of page titles for page metadata, e.g. for breadcrumbs
export function pageMetadata(route: string): Metadata {
  return { title: ROUTES[route]?.title }
}
