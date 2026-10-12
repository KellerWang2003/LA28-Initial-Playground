import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Camera, Check, ChevronRight, RefreshCw, Sparkles, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ShapeIcon } from '@/components/shape-art'
import { TicketStubArt } from '@/components/ticket-art'
import { SCHEDULE, SPORT_SHAPE, formatDate, formatTime, placeById, type Session } from '@/data/la28'
import { addTicket, type Ticket, type TicketSeat } from '@/lib/tickets'
import { notify } from '@/lib/toasts'

type ScanStep = 'capture' | 'analyzing' | 'confirm' | 'success'

export function TicketScanSheet({
  initialSport,
  onClose,
}: {
  initialSport?: string
  onClose: () => void
}) {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Default detected session:
  // Upcoming session matching initialSport or the premier swimming/athletics session
  const defaultSession =
    SCHEDULE.find((s) => s.status !== 'finished' && (!initialSport || s.sport === initialSport)) ??
    SCHEDULE.find((s) => s.id === 's_swim_0720') ??
    SCHEDULE[0]

  const [step, setStep] = useState<ScanStep>('capture')
  const [selectedSession, setSelectedSession] = useState<Session>(defaultSession)
  const [pickingDifferentSession, setPickingDifferentSession] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | undefined>()
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null)
  const [seat, setSeat] = useState<TicketSeat>({
    section: '108',
    row: '14',
    seat: '6',
  })

  // Escape key closes sheet
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handlePhotoCapture(photoUrl?: string) {
    setPhotoPreview(photoUrl)
    setStep('analyzing')
    // Simulate optical scan/recognition delay
    setTimeout(() => {
      setStep('confirm')
    }, 1100)
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      handlePhotoCapture(url)
    }
  }

  function handleConfirm() {
    const newTicket = addTicket({
      sessionId: selectedSession.id,
      photoUrl: photoPreview,
      seat,
    })
    setCreatedTicket(newTicket)
    notify({
      title: 'Ticket added to Passport',
      body: `${selectedSession.sport}: ${selectedSession.title} at ${placeById(selectedSession.venue).name}`,
      to: '/passport?section=tickets',
    })
    setStep('success')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs" onClick={onClose}>
      <div
        role="dialog"
        aria-modal
        aria-label="Scan Ticket"
        onClick={(e) => e.stopPropagation()}
        className="no-scrollbar m-2 mb-[max(env(safe-area-inset-bottom),12px)] max-h-[calc(100dvh-20px)] w-full max-w-md overflow-y-auto overscroll-contain rounded-3xl border bg-background p-4 shadow-2xl"
      >
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-semibold">
              {step === 'success' ? 'Ticket Saved' : 'Scan Game Ticket'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {step === 'capture' && 'Point camera at your paper or digital ticket'}
              {step === 'analyzing' && 'Reading barcode and event details...'}
              {step === 'confirm' && 'Verify your game and seat'}
              {step === 'success' && 'Saved to your Passport & Game list'}
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}>
            <X className="size-5" />
          </Button>
        </div>

        {/* Step 1: Capture Viewfinder */}
        {step === 'capture' && (
          <div className="space-y-4">
            {/* Viewfinder box */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border-2 border-dashed bg-muted/40 p-4 flex flex-col items-center justify-center text-center">
              {/* Corner brackets */}
              <div className="absolute top-2 left-2 size-4 border-t-2 border-l-2 border-foreground" />
              <div className="absolute top-2 right-2 size-4 border-t-2 border-r-2 border-foreground" />
              <div className="absolute bottom-2 left-2 size-4 border-b-2 border-l-2 border-foreground" />
              <div className="absolute bottom-2 right-2 size-4 border-b-2 border-r-2 border-foreground" />

              {/* Viewfinder center guide */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex size-14 items-center justify-center rounded-full bg-background/80 shadow-xs">
                  <Camera className="size-6 text-foreground" />
                </div>
                <p className="text-xs font-medium text-foreground">Align ticket inside frame</p>
                <p className="text-[11px] text-muted-foreground">Works with LA28 paper tickets or digital screens</p>
              </div>
            </div>

            {/* Shutter / Capture Actions */}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                className="flex-1 h-12 rounded-full font-medium"
                onClick={() => handlePhotoCapture()}
              >
                <Camera data-icon="inline-start" className="size-4" />
                Take ticket photo
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-full px-4"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-4" />
                <span className="sr-only sm:not-sr-only sm:ml-1.5 text-xs">Upload</span>
              </Button>
            </div>

            {/* Quick demo presets */}
            <div className="rounded-2xl border bg-muted/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Or sample ticket:</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {SCHEDULE.filter((s) => s.status !== 'finished').slice(0, 3).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelectedSession(s)
                      handlePhotoCapture()
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted"
                  >
                    <span>{s.sport}: {s.title.split(':')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Analyzing / Scanning */}
        {step === 'analyzing' && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative size-24 flex items-center justify-center rounded-2xl border bg-muted/30 overflow-hidden">
              <Camera className="size-10 text-muted-foreground animate-pulse" />
              {/* Scan laser */}
              <div className="absolute inset-x-0 h-1 bg-foreground animate-bounce opacity-80" />
            </div>
            <div>
              <p className="font-heading font-semibold">Reading ticket details...</p>
              <p className="mt-1 text-xs text-muted-foreground">Verifying LA28 barcode & Olympic session</p>
            </div>
          </div>
        )}

        {/* Step 3: Verification & Confirmation */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 rounded-full bg-muted/70 px-3 py-1 text-xs font-medium w-fit">
              <Sparkles className="size-3.5" />
              <span>Ticket recognized</span>
            </div>

            {/* Ticket preview card */}
            <TicketStubArt
              ticket={{
                id: 'preview',
                sessionId: selectedSession.id,
                scannedAt: '',
                photoUrl: photoPreview,
                seat,
              }}
              session={selectedSession}
            />

            {/* Not this game? selector button */}
            <div className="flex items-center justify-between rounded-xl border p-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Wrong session detected?</p>
                <p className="text-xs font-semibold truncate">{selectedSession.title}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-xs"
                onClick={() => setPickingDifferentSession(true)}
              >
                Not this game?
              </Button>
            </div>

            {/* Dialog to pick another session if OCR picked the wrong one */}
            {pickingDifferentSession && (
              <div className="rounded-2xl border bg-background p-3 shadow-md space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Choose game</p>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setPickingDifferentSession(false)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
                <div className="no-scrollbar max-h-48 overflow-y-auto divide-y">
                  {SCHEDULE.filter((s) => s.status !== 'finished').map((session) => {
                    const shape = SPORT_SHAPE[session.sport]
                    return (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => {
                          setSelectedSession(session)
                          setSeat({
                            section: String(Math.floor(Math.random() * 200) + 101),
                            row: String(Math.floor(Math.random() * 20) + 1),
                            seat: String(Math.floor(Math.random() * 25) + 1),
                          })
                          setPickingDifferentSession(false)
                        }}
                        className="flex w-full items-center gap-2 py-2 text-left hover:bg-muted/50 px-1 rounded-md"
                      >
                        {shape && <ShapeIcon shape={shape} className="size-4 shrink-0" />}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{session.title}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {session.sport} · {formatDate(session.date)} · {formatTime(session.start)}
                          </p>
                        </div>
                        {selectedSession.id === session.id && <Check className="size-4 shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Confirm button */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setStep('capture')}
              >
                <RefreshCw className="size-4 mr-1" />
                Retake
              </Button>
              <Button
                className="flex-1 rounded-full font-medium"
                onClick={handleConfirm}
              >
                Save to Passport
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && createdTicket && (
          <div className="space-y-4 pt-2 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-foreground text-background">
              <Check className="size-8" />
            </div>

            <div>
              <p className="font-heading text-lg font-bold">You're going to the game!</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Your ticket for {selectedSession.title} has been added to your Passport stubs and game schedule with venue access.
              </p>
            </div>

            <div className="text-left">
              <TicketStubArt ticket={createdTicket} session={selectedSession} compact />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                className="w-full rounded-full"
                onClick={() => {
                  onClose()
                  navigate('/passport?section=tickets')
                }}
              >
                View in Passport
                <ChevronRight data-icon="inline-end" />
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-full"
                onClick={onClose}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
