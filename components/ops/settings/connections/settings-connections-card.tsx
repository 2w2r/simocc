import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup } from "@/components/ui/field"

export default function SettingsConnectionsCard({
  title,
  children,
}: Readonly<{
  title: string
  children: React.ReactNode
}>) {
  return (
    <Card className="bg-card @container min-w-fit max-w-lg overflow-scroll">
      {title && (
        <CardHeader>
          <CardTitle className="whitespace-nowrap">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <FieldGroup>{children}</FieldGroup>
      </CardContent>
    </Card>
  )
}
