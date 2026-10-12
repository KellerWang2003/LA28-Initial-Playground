import { FanCode } from '@/components/fan-code'
import { ImagePlaceholder } from '@/components/image-placeholder'
import { COUNTRIES, useProfile } from '@/lib/profile'
import { ME_ID, fanCode } from '@/data/mock'
import { flag } from '@/data/la28'
import { Paper, ScaledPage } from './book'
import { passportLines } from './book-pages'
import { useLook } from './look'
import { StickerLayer } from './stickers'

// The fan's ID page turned into their add-me card: their passport style, photo and stickers,
// with their code in the middle. The code sits above the stickers so it always scans.
export function PassportCodePage() {
  const profile = useProfile()
  const { photo } = useLook()
  const code = fanCode(ME_ID)
  const country = COUNTRIES.find((c) => c.code === profile.country)?.name ?? profile.country

  return (
    <ScaledPage>
      <Paper label="Fan code" overlay={<StickerLayer editing={false} selected={null} onSelect={() => {}} />}>
        <div className="flex min-h-full flex-col">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">LA28 Fan Passport</p>

          <div className="mt-3 flex items-center gap-3">
            <span className="aspect-[3/4] w-12 shrink-0 overflow-hidden rounded-md">
              {photo ? <img src={photo} alt="" className="size-full object-cover grayscale" /> : <ImagePlaceholder className="size-full rounded-md" />}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-heading text-lg leading-tight font-semibold">{profile.name || 'LA28 fan'}</span>
              <span className="block truncate text-sm text-muted-foreground">
                {flag(profile.country)} {country}
              </span>
            </span>
          </div>

          {/* Above the sticker layer (z-10), so nothing covers the code */}
          <div className="relative z-20 mx-auto mt-5 rounded-2xl border bg-white p-2.5 shadow-sm">
            <FanCode value={code} className="w-52 rounded-lg" />
          </div>
          <p className="relative z-20 mx-auto mt-2 rounded-full bg-background px-2 text-center font-mono text-xs text-muted-foreground">{code}</p>
          <p className="mt-1 text-center text-sm font-medium">Scan to add me</p>

          <div aria-hidden className="mt-auto pt-2 font-mono text-[9.5px] leading-snug tracking-[0.1em] text-muted-foreground/70">
            {passportLines(profile.name, profile.country).map((l) => (
              <p key={l} className="truncate">
                {l}
              </p>
            ))}
          </div>
        </div>
      </Paper>
    </ScaledPage>
  )
}
