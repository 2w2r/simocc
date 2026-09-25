import Image from "next/image"

import { Image as ImageIcon } from "lucide-react"

// 16:9 hero above the Identity rows, centred crop. No URL = muted icon placeholder.
// `unoptimized`: imageUrl is user-entered; optimiser would be open resize
// proxy for any host. Browser loads origin directly.
export function AircraftHeroImage({ imageUrl, alt }: { imageUrl: string | null; alt: string }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden bg-muted/30">
      {imageUrl ? (
        <Image src={imageUrl} alt={alt} fill unoptimized className="object-cover" />
      ) : (
        <ImageIcon className="absolute inset-0 m-auto size-8 text-muted-foreground/50" aria-hidden />
      )}
    </div>
  )
}
