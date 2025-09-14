import { Recipe } from '~src/store/index'

// Utility function to create a deep clone without Vue reactivity
function deepCloneSerializable(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepCloneSerializable(item))
  }

  if (typeof obj === 'object') {
    const cloned: any = {}

    // Only copy own enumerable properties, skip Vue reactivity properties
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && typeof obj[key] !== 'function') {
        // Skip Vue internal properties
        if (!key.startsWith('__v_') && !key.startsWith('$')) {
          cloned[key] = deepCloneSerializable(obj[key])
        }
      }
    }

    return cloned
  }

  return obj
}

const DB_NAME = 'KukkinguDB'
const DB_VERSION = 1
const RECIPES_STORE = 'recipes'
const SETTINGS_STORE = 'settings'

// Database schema
const STORES = {
  [RECIPES_STORE]: { keyPath: 'id', autoIncrement: false },
  [SETTINGS_STORE]: { keyPath: 'key', autoIncrement: false }
}

class IndexedDBService {
  private db: IDBDatabase | null = null
  private dbPromise: Promise<IDBDatabase> | null = null

  constructor() {
    this.initDB()
  }

  private async initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.error('IndexedDB error:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve(request.result)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores if they don't exist
        Object.entries(STORES).forEach(([storeName, options]) => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, options)
            // Create indexes if needed
            if (storeName === RECIPES_STORE) {
              store.createIndex('name', 'name', { unique: false })
            }
          }
        })
      }
    })

    return this.dbPromise
  }

  private async getDB(): Promise<IDBDatabase> {
    if (!this.db) {
      this.db = await this.initDB()
    }
    return this.db
  }

  // Recipes operations
  async getRecipes(): Promise<Recipe[]> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([RECIPES_STORE], 'readonly')
      const store = transaction.objectStore(RECIPES_STORE)
      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result || [])
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  async saveRecipes(recipes: Recipe[]): Promise<void> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([RECIPES_STORE], 'readwrite')
      const store = transaction.objectStore(RECIPES_STORE)

      // Clear existing recipes
      const clearRequest = store.clear()

      clearRequest.onsuccess = () => {
        // Add all recipes
        let completed = 0
        const total = recipes.length

        if (total === 0) {
          resolve()
          return
        }

        recipes.forEach(recipe => {
          const serializableRecipe = deepCloneSerializable(recipe)
          const request = store.add(serializableRecipe)
          request.onsuccess = () => {
            completed++
            if (completed === total) {
              resolve()
            }
          }
          request.onerror = () => {
            reject(request.error)
          }
        })
      }

      clearRequest.onerror = () => {
        reject(clearRequest.error)
      }
    })
  }

  // Settings operations
  async getSetting<T>(key: string, defaultValue?: T): Promise<T> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SETTINGS_STORE], 'readonly')
      const store = transaction.objectStore(SETTINGS_STORE)
      const request = store.get(key)

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.value)
        } else {
          resolve(defaultValue as T)
        }
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  async setSetting<T>(key: string, value: T): Promise<void> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SETTINGS_STORE], 'readwrite')
      const store = transaction.objectStore(SETTINGS_STORE)
      const request = store.put({ key, value })

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  // Migration from localStorage
  async migrateFromLocalStorage(): Promise<void> {
    // Check if migration already happened
    const migrated = await this.getSetting('migratedFromLocalStorage', false)
    if (migrated) {
      return
    }

    try {
      // Migrate recipes
      const recipesData = localStorage.getItem('recipes')
      if (recipesData) {
        const recipes = JSON.parse(recipesData)
        await this.saveRecipes(recipes)
      }

      // Migrate locale
      const locale = localStorage.getItem('locale')
      if (locale) {
        await this.setSetting('locale', locale)
      }

      // Migrate opened recipe
      const openedRecipe = localStorage.getItem('openedRecipe')
      if (openedRecipe) {
        await this.setSetting('openedRecipe', JSON.parse(openedRecipe))
      }

      // Mark migration as complete
      await this.setSetting('migratedFromLocalStorage', true)

      console.log('Migration from localStorage to IndexedDB completed')
    } catch (error) {
      console.error('Migration failed:', error)
      throw error
    }
  }
}

// Export singleton instance
export const idbService = new IndexedDBService()

// Helper functions for easy access
export const getRecipes = () => idbService.getRecipes()
export const saveRecipes = (recipes: Recipe[]) => idbService.saveRecipes(recipes)
export const getSetting = <T>(key: string, defaultValue?: T) => idbService.getSetting(key, defaultValue)
export const setSetting = <T>(key: string, value: T) => idbService.setSetting(key, value)
export const migrateFromLocalStorage = () => idbService.migrateFromLocalStorage()

// Image utility functions
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export const isValidImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB

  return validTypes.includes(file.type) && file.size <= maxSize
}

export const pasteImageFromClipboard = async (): Promise<string | null> => {
  try {
    const clipboardItems = await navigator.clipboard.read()
    for (const item of clipboardItems) {
      for (const type of item.types) {
        if (type.startsWith('image/')) {
          const blob = await item.getType(type)
          const file = new File([blob], 'pasted-image.png', { type })
          if (isValidImageFile(file)) {
            return await fileToBase64(file)
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to read image from clipboard:', error)
  }
  return null
}
