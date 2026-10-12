// Where each component is used and how often each class appears, read from the app's
// own source. The sources load only when the design page opens, so the app bundle
// stays the same.

const loaders = import.meta.glob<string>('/src/**/*.{ts,tsx}', { query: '?raw', import: 'default' })

// This page's own files would count themselves
const SELF = '/src/features/design-system/'

export type Usage = {
  // Files (as 'pages/explore') that import `file`, the importer itself excluded
  importers: (file: string) => string[]
  // How many times a class appears across the app, variants included (`md:text-sm`)
  classCount: (cls: string) => number
  // Every distinct class matching `pattern` (a global regex) with its count, most used first
  classesMatching: (pattern: RegExp) => [cls: string, count: number][]
}

let usage: Promise<Usage> | null = null

export function loadUsage() {
  usage ??= read()
  return usage
}

async function read(): Promise<Usage> {
  const entries = await Promise.all(
    Object.entries(loaders)
      .filter(([path]) => !path.startsWith(SELF))
      .map(async ([path, load]) => [path, await load()] as const),
  )

  // imported file → files importing it, all as 'components/page-header'
  const importedBy = new Map<string, Set<string>>()
  for (const [path, source] of entries) {
    const from = short(path)
    for (const [, spec] of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      const to = resolve(path, spec)
      if (!to || to === from) continue
      if (!importedBy.has(to)) importedBy.set(to, new Set())
      importedBy.get(to)!.add(from)
    }
  }

  const all = entries.map(([, source]) => source).join('\n')
  const counts = new Map<string, number>()

  return {
    importers: (file) => [...(importedBy.get(file) ?? [])].sort(),
    classCount(cls) {
      if (!counts.has(cls)) {
        const escaped = cls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        counts.set(cls, all.match(new RegExp(`(?<![\\w-])${escaped}(?![\\w-])`, 'g'))?.length ?? 0)
      }
      return counts.get(cls)!
    },
    classesMatching(pattern) {
      const found = new Map<string, number>()
      for (const [cls] of all.matchAll(pattern)) found.set(cls, (found.get(cls) ?? 0) + 1)
      return [...found].sort((a, b) => b[1] - a[1])
    },
  }
}

// '/src/components/page-header.tsx' → 'components/page-header'
function short(path: string) {
  return path.replace(/^\/src\//, '').replace(/\.(tsx?|jsx?)$/, '').replace(/\/index$/, '')
}

// An import specifier as a short path, or null for packages
function resolve(importer: string, spec: string) {
  if (spec.startsWith('@/')) return short(`/src/${spec.slice(2)}`)
  if (!spec.startsWith('.')) return null
  const parts = importer.split('/').slice(0, -1)
  for (const part of spec.split('/')) {
    if (part === '..') parts.pop()
    else if (part !== '.') parts.push(part)
  }
  return short(parts.join('/'))
}
