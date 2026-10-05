import { cn } from '@/lib/utils'

const N = 29

// QR-style mark built from the id: three finder squares, timing, and a data
// pattern that stays the same for the same id. Not a camera-decodable QR.
function codeMatrix(value: string) {
  const grid = Array.from({ length: N }, () => Array<boolean>(N).fill(false))
  const reserved = Array.from({ length: N }, () => Array<boolean>(N).fill(false))

  const mark = (x: number, y: number, on: boolean) => {
    if (x < 0 || y < 0 || x >= N || y >= N) return
    grid[y][x] = on
    reserved[y][x] = true
  }

  const finder = (fx: number, fy: number) => {
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const lx = x
        const ly = y
        const inGraphic = x < 7 && y < 7
        const edge = lx === 0 || ly === 0 || lx === 6 || ly === 6
        const core = lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4
        mark(fx + x, fy + y, inGraphic && (edge || core))
      }
    }
  }

  finder(0, 0)
  finder(N - 8, 0)
  finder(0, N - 8)

  for (let i = 8; i <= N - 9; i++) {
    mark(i, 6, i % 2 === 0)
    mark(6, i, i % 2 === 0)
  }

  const cx = 22
  const cy = 22
  for (let y = cy - 2; y <= cy + 2; y++) {
    for (let x = cx - 2; x <= cx + 2; x++) {
      const dx = Math.abs(x - cx)
      const dy = Math.abs(y - cy)
      mark(x, y, dx === 2 || dy === 2 || (dx === 0 && dy === 0))
    }
  }

  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  let xorshift = h >>> 0
  let bit = 32

  const nextBit = () => {
    if (bit >= 32) {
      xorshift ^= xorshift << 13
      xorshift ^= xorshift >>> 17
      xorshift ^= xorshift << 5
      xorshift >>>= 0
      bit = 0
    }
    return ((xorshift >>> bit++) & 1) === 1
  }

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (reserved[y][x]) continue
      grid[y][x] = nextBit()
    }
  }

  return grid
}

export function FanCode({ value, className }: { value: string; className?: string }) {
  const cells = codeMatrix(value)
  const quiet = 4
  const dark: { x: number; y: number }[] = []
  cells.forEach((row, y) => {
    row.forEach((on, x) => {
      if (on) dark.push({ x, y })
    })
  })

  return (
    <svg
      viewBox={`0 0 ${N + quiet * 2} ${N + quiet * 2}`}
      className={cn('bg-white text-neutral-950', className)}
      role="img"
      aria-label={`Code for ${value}`}
      shapeRendering="crispEdges"
    >
      <rect width={N + quiet * 2} height={N + quiet * 2} fill="white" />
      {dark.map(({ x, y }) => (
        <rect key={`${x}-${y}`} x={x + quiet} y={y + quiet} width={1.08} height={1.08} fill="currentColor" />
      ))}
    </svg>
  )
}
