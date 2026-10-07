import Image from "next/image"

import { Image as ImageIcon } from "lucide-react"

import { AIRCRAFT_EDIT_FORM_ID, isHttpUrl } from "@/components/ops/fleet/aircraft/editing/shared"
import { StatusMessage } from "@/components/ui/status-message"
import { cn } from "@/lib/utils"

// http(s) only; else (mid-typing, invalid) placeholder.
const httpUrl = (value: string | null) => (value && isHttpUrl(value) ? value : null)

type HeroImageValues = { imageUrl: string; imagePageUrl: string; imageAuthor: string }

const EDIT_FIELDS: { key: keyof HeroImageValues; placeholder: string; type: "url" | "text" }[] = [
  { key: "imageUrl", placeholder: "Image URL", type: "url" },
  { key: "imagePageUrl", placeholder: "Source page URL", type: "url" },
  { key: "imageAuthor", placeholder: "Author", type: "text" },
]

// 16:9 hero above the Identity rows, centred crop. No URL = muted icon placeholder.
// `unoptimized`: imageUrl is user-entered; optimiser would be open resize
// proxy for any host. Browser loads origin directly.
export function AircraftHeroImage({
  imageUrl,
  imagePageUrl,
  imageAuthor,
  alt,
  edit,
}: {
  imageUrl: string | null
  imagePageUrl: string | null
  imageAuthor: string | null
  alt: string
  edit?: {
    values: HeroImageValues
    onChange: (patch: Partial<HeroImageValues>) => void
    error?: string
    invalidField?: keyof HeroImageValues
  }
}) {
  const src = httpUrl(edit ? edit.values.imageUrl : imageUrl)
  const pageUrl = !edit ? httpUrl(imagePageUrl) : null

  const image = src && (
    <Image src={src} alt={alt} fill unoptimized className={cn("object-cover", edit && "blur-sm")} />
  )

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-muted/30">
      {image ? (
        pageUrl ? (
          <a href={pageUrl} target="_blank" rel="noopener noreferrer" title="Open image source">
            {image}
          </a>
        ) : (
          image
        )
      ) : (
        !edit && <ImageIcon className="absolute inset-0 m-auto size-8 text-muted-foreground/50" aria-hidden />
      )}
      {!edit && src && imageAuthor && (
        <span className="pointer-events-none absolute right-0 bottom-0 bg-black/50 px-1.5 text-[10px] leading-4 text-white">
          © {imageAuthor}
        </span>
      )}
      {edit && (
        <div className="absolute inset-0 flex flex-col justify-center gap-1.5 px-8">
          {EDIT_FIELDS.map(({ key, placeholder, type }) => (
            <input
              key={key}
              form={AIRCRAFT_EDIT_FORM_ID}
              type={type}
              value={edit.values[key]}
              onChange={(e) => edit.onChange({ [key]: e.target.value })}
              placeholder={placeholder}
              aria-label={placeholder}
              data-field={key}
              data-error={`${placeholder} format error`}
              aria-invalid={edit.invalidField === key || undefined}
              className={cn(
                "h-9 w-full min-w-0 rounded-md border border-white/25 bg-background/35 px-3 text-sm shadow-sm backdrop-blur-md outline-none transition-colors placeholder:text-foreground/60 hover:bg-background/45 focus:border-white/50 focus:bg-background/55",
                edit.invalidField === key && "border-destructive focus:border-destructive"
              )}
            />
          ))}
        </div>
      )}
      {edit?.error && (
        // Medium weight: contrast over photo.
        <div
          role="alert"
          className="absolute inset-x-0 top-0 border-b border-white/25 bg-background/35 px-3 py-1.5 shadow-sm backdrop-blur-md [&_p]:font-medium"
        >
          <StatusMessage variant="error" text={edit.error} />
        </div>
      )}
    </div>
  )
}
