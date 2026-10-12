import { useRef } from 'react'
import { Check, ImagePlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { COUNTRIES, setBio, setCountry, setName, useProfile } from '@/lib/profile'
import { cn } from '@/lib/utils'
import { flag } from '@/data/la28'
import { STICKERS, STYLES, addSticker, setPhoto, setStyle, useLook } from './look'
import { CoverArt } from './book'
import { StickerArtView } from './stickers'

export type EditTab = 'stickers' | 'photo' | 'details' | 'style'

const TABS: { id: EditTab; label: string }[] = [
  { id: 'stickers', label: 'Stickers' },
  { id: 'photo', label: 'Photo' },
  { id: 'details', label: 'Details' },
  { id: 'style', label: 'Style' },
]

// Sample photos for the ID page, alongside uploading your own
const PRESET_PHOTOS = ['/camera/person-a.jpg', '/camera/person-b.jpg', '/camera/person-c.jpg', '/camera/pair.jpg']

// Tray under the Passport while customizing the ID page
export function IdEditor({
  tab,
  onTab,
  onAdded,
  onDone,
}: {
  tab: EditTab
  onTab: (tab: EditTab) => void
  // A new sticker lands selected, ready to drag
  onAdded: (id: string) => void
  onDone: () => void
}) {
  return (
    <div className="shrink-0 animate-in rounded-t-3xl border-t bg-background shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.2)] duration-300 slide-in-from-bottom">
      <div className="flex items-center gap-2 px-3 pt-3">
        <div className="flex flex-1 gap-1 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onTab(t.id)}
              className={cn(
                'h-9 shrink-0 rounded-full px-3 text-sm font-medium transition-colors',
                t.id === tab ? 'bg-foreground text-background' : 'text-muted-foreground active:bg-muted',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Button size="sm" className="rounded-full" onClick={onDone}>
          <Check data-icon="inline-start" />
          Done
        </Button>
      </div>
      <div className="h-44 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)]">
        {tab === 'stickers' && <StickerTray onAdded={onAdded} />}
        {tab === 'photo' && <PhotoTray />}
        {tab === 'details' && <DetailsTray />}
        {tab === 'style' && <StyleTray />}
      </div>
    </div>
  )
}

function StickerTray({ onAdded }: { onAdded: (id: string) => void }) {
  return (
    <div className="no-scrollbar h-full overflow-y-auto">
      <p className="mb-2 text-xs text-muted-foreground">Tap to add. Drag to move, use the corner to resize and turn.</p>
      <div className="grid grid-cols-6 gap-2">
        {STICKERS.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-label={s.art.type === 'text' ? s.art.text : s.art.shape}
            onClick={() => onAdded(addSticker(s.id))}
            className={cn(
              'flex aspect-square items-center justify-center rounded-xl bg-muted p-1.5 transition-transform active:scale-90',
              s.art.type === 'text' && 'col-span-2 aspect-auto',
            )}
            style={{ ['--sticker-w' as string]: s.art.type === 'text' ? '84px' : '40px' }}
          >
            <span className={s.art.type === 'text' ? 'w-[84px]' : 'w-9'}>
              <StickerArtView art={s.art} />
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function PhotoTray() {
  const { photo } = useLook()
  const input = useRef<HTMLInputElement>(null)
  return (
    <div className="flex h-full flex-col">
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex aspect-[3/4] w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-muted-foreground active:bg-muted"
        >
          <ImagePlus className="size-5" />
          <span className="text-[11px] font-medium">Upload</span>
        </button>
        {PRESET_PHOTOS.map((src) => (
          <button
            key={src}
            type="button"
            onClick={() => setPhoto(src)}
            className={cn('aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-xl', photo === src && 'ring-2 ring-foreground ring-offset-2 ring-offset-background')}
          >
            <img src={src} alt="" className="size-full object-cover" />
          </button>
        ))}
      </div>
      {photo && (
        <Button variant="ghost" size="sm" className="mt-auto self-start text-muted-foreground" onClick={() => setPhoto(null)}>
          <Trash2 data-icon="inline-start" />
          Remove photo
        </Button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) setPhoto(URL.createObjectURL(file))
          e.target.value = ''
        }}
      />
    </div>
  )
}

function DetailsTray() {
  const profile = useProfile()
  return (
    <div className="no-scrollbar h-full space-y-3 overflow-y-auto">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted-foreground">Name on your Passport</span>
        <Input value={profile.name} maxLength={28} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted-foreground">About</span>
        <Input value={profile.bio} maxLength={80} onChange={(e) => setBio(e.target.value)} placeholder="Say something about your Games" />
      </label>
      <div>
        <span className="mb-1 block text-xs font-medium text-muted-foreground">Country</span>
        <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => setCountry(c.code)}
              className={cn(
                'h-8 shrink-0 rounded-full border px-3 text-sm whitespace-nowrap',
                profile.country === c.code ? 'border-foreground bg-foreground text-background' : 'active:bg-muted',
              )}
            >
              {flag(c.code)} {c.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function StyleTray() {
  const { style } = useLook()
  return (
    <div className="no-scrollbar -mx-4 flex h-full gap-3 overflow-x-auto px-4">
      {STYLES.map((s) => (
        <button key={s.id} type="button" onClick={() => setStyle(s.id)} className="flex shrink-0 flex-col items-center gap-1.5">
          <span
            className={cn(
              'relative block h-28 w-20 rounded-r-lg rounded-l-sm transition-shadow',
              style === s.id && 'ring-2 ring-foreground ring-offset-2 ring-offset-background',
            )}
          >
            <CoverArt styleId={s.id} small />
          </span>
          <span className={cn('text-xs', style === s.id ? 'font-semibold' : 'text-muted-foreground')}>{s.name}</span>
        </button>
      ))}
    </div>
  )
}
