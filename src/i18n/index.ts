import { ref } from 'vue'
import en from './en.json'
import jp from './jp.json'
import de from './de.json'
import { getSetting, setSetting } from '~src/services/indexeddb'

export const messages: Record<string, Record<string, string>> = {
  en,
  jp,
  de,
}

export const defaultLocale = 'jp'
export const currentLocale = ref<string>(defaultLocale)

// Initialize locale from IndexedDB
getSetting<string>('locale', defaultLocale).then(value => {
  currentLocale.value = value
}).catch(error => {
  console.error('Failed to load locale from IndexedDB:', error)
  currentLocale.value = defaultLocale
})

export function t(key: string): string {
  const dict = messages[currentLocale.value] || {}
  return dict[key] ?? key
}

export async function setLocale(locale: 'en' | 'jp' | 'de') {
  currentLocale.value = locale
  try {
    await setSetting('locale', locale)
  } catch (error) {
    console.error('Failed to save locale to IndexedDB:', error)
  }
}

