import { Card, CardContent } from "@/components/ui/card"

export default function SettingsAccountCard({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Card className="bg-card @container min-w-fit max-w-lg overflow-scroll">
      {children}
    </Card>
  )
}
