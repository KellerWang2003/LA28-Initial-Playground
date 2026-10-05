import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Check, ChevronLeft } from 'lucide-react'
import { FanCode } from '@/components/fan-code'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { addConnection, useConnections } from '@/lib/connections'
import { ME_ID, fanCode, idFromFanCode, meetable, personById, type Person } from '@/data/mock'

type Tab = 'code' | 'scan'

const initials = (p: Person) => p.name.slice(0, 2).toUpperCase()

export default function PeopleAddPage() {
  const navigate = useNavigate()
  const connections = useConnections()
  const [tab, setTab] = useState<Tab>('code')
  const [scanning, setScanning] = useState(false)
  const [found, setFound] = useState<Person | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [entry, setEntry] = useState('')
  const connectionsRef = useRef(connections)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    connectionsRef.current = connections
  }, [connections])

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    }
  }, [])

  const available = meetable.filter((p) => !connections.includes(p.id))

  function cancelScan() {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
    setScanning(false)
  }

  function finish(person: Person) {
    cancelScan()
    if (!addConnection(person.id)) {
      setNotice(`${person.name} is already in your people.`)
      return
    }
    setNotice(null)
    setEntry('')
    setFound(person)
  }

  function startScan() {
    if (scanning || available.length === 0) return
    setNotice(null)
    setScanning(true)
    timer.current = window.setTimeout(() => {
      timer.current = null
      setScanning(false)
      const next = meetable.find((p) => !connectionsRef.current.includes(p.id))
      if (!next) {
        setNotice('Everyone nearby is already in your people.')
        return
      }
      if (!addConnection(next.id)) {
        setNotice(`${next.name} is already in your people.`)
        return
      }
      setFound(next)
    }, 700)
  }

  function submitCode(e: FormEvent) {
    e.preventDefault()
    const id = idFromFanCode(entry)
    if (!id) {
      setNotice('Enter a code like la28:lina.')
      return
    }
    if (id === ME_ID) {
      setNotice('That’s your code. Show it so someone else can add you.')
      return
    }
    const person = personById(id)
    if (!person) {
      setNotice('That code doesn’t match a fan.')
      return
    }
    finish(person)
  }

  return (
    <div className="flex h-dvh flex-col bg-background pt-[env(safe-area-inset-top)]">
      <header className="flex h-14 shrink-0 items-center gap-2 px-2">
        <Button variant="ghost" size="icon-lg" aria-label="Back" onClick={() => navigate(-1)}>
          <ChevronLeft className="size-5" />
        </Button>
        <h1 className="font-heading text-lg font-semibold">Add someone</h1>
      </header>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2 pb-[max(env(safe-area-inset-bottom),24px)]">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList className="w-full">
            <TabsTrigger value="code">My code</TabsTrigger>
            <TabsTrigger value="scan">Scan</TabsTrigger>
          </TabsList>

          <TabsContent value="code" className="pt-6">
            <div className="mx-auto flex max-w-sm flex-col items-center text-center">
              <h2 className="font-heading text-xl font-semibold">Your code</h2>
              <p className="mt-1 text-sm text-muted-foreground">Show this so another fan can add you.</p>
              <div className="mt-5 rounded-3xl border bg-white p-3">
                <FanCode value={fanCode(ME_ID)} className="w-56 rounded-2xl" />
              </div>
              <p className="mt-3 font-mono text-sm text-muted-foreground">{fanCode(ME_ID)}</p>
            </div>
          </TabsContent>

          <TabsContent value="scan" className="pt-6">
            {found ? (
              <AddedResult person={found} onDone={() => navigate('/people')} />
            ) : (
              <div className="mx-auto max-w-sm">
                <ScanFrame scanning={scanning} />
                <Button type="button" size="lg" className="mt-4 w-full" disabled={scanning || available.length === 0} onClick={startScan}>
                  {scanning ? 'Scanning…' : 'Scan'}
                </Button>
                <p className="mt-2 text-center text-sm text-muted-foreground">Hold their code in the frame, then scan.</p>

                <h2 className="mt-8 font-heading font-semibold">Or choose a fan</h2>
                {available.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">You’ve added everyone you can scan here.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {available.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          disabled={scanning}
                          onClick={() => finish(p)}
                          className="flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left disabled:opacity-50"
                        >
                          <Avatar>
                            <AvatarFallback>{initials(p)}</AvatarFallback>
                          </Avatar>
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium">
                              {p.flag} {p.name}
                            </span>
                            <span className="block font-mono text-xs text-muted-foreground">{fanCode(p.id)}</span>
                          </span>
                          <span className="text-xs text-muted-foreground">{p.pins} pins</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <form onSubmit={submitCode} className="mt-4 flex gap-2">
                  <Input
                    aria-label="Their code"
                    value={entry}
                    onChange={(e) => setEntry(e.target.value)}
                    placeholder="la28:lina"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                  <Button type="submit" variant="outline">
                    Add
                  </Button>
                </form>
                {notice && (
                  <p role="status" className="mt-3 text-sm text-muted-foreground">
                    {notice}
                  </p>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function ScanFrame({ scanning }: { scanning: boolean }) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-56">
      <div className="absolute inset-6 rounded-2xl bg-muted" />
      {scanning && <span className="absolute inset-x-10 top-1/2 h-0.5 -translate-y-1/2 animate-pulse bg-foreground" />}
      <span className="absolute top-0 left-0 size-8 rounded-tl-3xl border-t-4 border-l-4 border-foreground" />
      <span className="absolute top-0 right-0 size-8 rounded-tr-3xl border-t-4 border-r-4 border-foreground" />
      <span className="absolute bottom-0 left-0 size-8 rounded-bl-3xl border-b-4 border-l-4 border-foreground" />
      <span className="absolute right-0 bottom-0 size-8 rounded-br-3xl border-r-4 border-b-4 border-foreground" />
    </div>
  )
}

function AddedResult({ person, onDone }: { person: Person; onDone: () => void }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center py-8 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-muted">
        <Check className="size-7" />
      </span>
      <Avatar className="mt-4 size-16">
        <AvatarFallback>{initials(person)}</AvatarFallback>
      </Avatar>
      <h2 className="mt-3 font-heading text-xl font-semibold">
        {person.flag} {person.name}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Added to your people</p>
      <Button type="button" size="lg" className="mt-6 w-full" onClick={onDone}>
        Done
      </Button>
    </div>
  )
}
