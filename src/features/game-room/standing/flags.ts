import { CROWD_COUNTRIES } from '../crowd'

// Countries that show up in the Standing fixtures but are not in the room's crowd list
const EXTRA: Record<string, { name: string; flag: string }> = {
  SRB: { name: 'Serbia', flag: '🇷🇸' },
  ROU: { name: 'Romania', flag: '🇷🇴' },
  NOR: { name: 'Norway', flag: '🇳🇴' },
  QAT: { name: 'Qatar', flag: '🇶🇦' },
  HUN: { name: 'Hungary', flag: '🇭🇺' },
  GRE: { name: 'Greece', flag: '🇬🇷' },
  POL: { name: 'Poland', flag: '🇵🇱' },
  ISR: { name: 'Israel', flag: '🇮🇱' },
  LTU: { name: 'Lithuania', flag: '🇱🇹' },
  SEN: { name: 'Senegal', flag: '🇸🇳' },
}

const lookup = (code: string) => CROWD_COUNTRIES.find((c) => c.code === code) ?? EXTRA[code]

export const flagOf = (code: string) => lookup(code)?.flag ?? '🏳️'
export const countryName = (code: string) => lookup(code)?.name ?? code
