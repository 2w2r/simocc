import { SimoccLogo } from "@/components/simocc-logo"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function AuthCard({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Card className="bg-background @container">
      <CardHeader className="flex flex-col items-center justify-center text-center">
        <a href="/">
          <SimoccLogo className="w-12 h-12 shrink-0 text-foreground" />
        </a>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
