import { useSyncExternalStore } from 'react'

// In-memory, like the rest of the demo: a reload restores this default.
export type Profile = {
  name: string
  // ISO 3166-1 alpha-2, so the header can show a flag
  country: string
  // Languages they speak, separate from the display language
  spoken: string[]
  bio: string
  // Display language id. The rest of the app stays in English.
  language: string
}

export const DISPLAY_LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'es', label: 'Español' },
  { id: 'zh', label: '中文' },
  { id: 'ja', label: '日本語' },
] as const

export const SPOKEN_LANGUAGES = ['English', 'Español', '中文', '日本語', 'Français', 'Deutsch', 'Português', '한국어']

export const COUNTRIES: { code: string; name: string }[] = [
  { code: 'US', name: 'United States' },
  { code: 'MX', name: 'Mexico' },
  { code: 'CN', name: 'China' },
  { code: 'JP', name: 'Japan' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'KR', name: 'South Korea' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'DE', name: 'Germany' },
  { code: 'CA', name: 'Canada' },
  { code: 'BR', name: 'Brazil' },
  { code: 'KE', name: 'Kenya' },
  { code: 'JM', name: 'Jamaica' },
  { code: 'NZ', name: 'New Zealand' },
]

const DEFAULT: Profile = {
  name: 'Alex Rivera',
  country: 'US',
  spoken: ['English', 'Español'],
  bio: 'In LA for the Games, collecting pins between sessions.',
  language: 'en',
}

let profile: Profile = { ...DEFAULT, spoken: [...DEFAULT.spoken] }
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function update(next: Profile) {
  profile = next
  listeners.forEach((l) => l())
}

export function useProfile() {
  return useSyncExternalStore(subscribe, () => profile)
}

export function setCountry(code: string) {
  if (profile.country === code) return
  update({ ...profile, country: code })
}

export function setDisplayLanguage(id: string) {
  if (profile.language === id) return
  update({ ...profile, language: id })
}

export function toggleSpokenLanguage(language: string) {
  const spoken = profile.spoken.includes(language)
    ? profile.spoken.filter((item) => item !== language)
    : [...profile.spoken, language]
  update({ ...profile, spoken })
}

export function countryName(code: string) {
  return COUNTRIES.find((country) => country.code === code)?.name ?? code
}

export function displayLanguageLabel(id: string) {
  return DISPLAY_LANGUAGES.find((language) => language.id === id)?.label ?? id
}
