import { ref } from 'vue'
import en from './en.json'
import jp from './jp.json'
import de from './de.json'

export const messages: Record<string, Record<string, string>> = {
  en,
  jp,
  de,
}

export const defaultLocale = 'jp'
export const currentLocale = ref<string>(localStorage.getItem('locale') || defaultLocale)

export function t(key: string): string {
  const dict = messages[currentLocale.value] || {}
  return dict[key] ?? key
}

export function setLocale(locale: 'en' | 'jp' | 'de') {
  currentLocale.value = locale
  localStorage.setItem('locale', locale)
}

