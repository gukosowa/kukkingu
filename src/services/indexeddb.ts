import { Recipe, WeeklyPlan, ShoppingListItem } from '~src/store/index'
import { optimizeImageFile } from '~src/services/imageOptimization'

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
const DB_VERSION = 7 // Bump to ensure friends store is created on upgrade
const RECIPES_STORE = 'recipes'
const SETTINGS_STORE = 'settings'
const DAILY_PLANS_STORE = 'dailyPlans'
const SHOPPING_LISTS_STORE = 'shoppingLists'
const FRIENDS_STORE = 'friends'

// Database schema
const STORES = {
  [RECIPES_STORE]: { keyPath: 'id', autoIncrement: false },
  [SETTINGS_STORE]: { keyPath: 'key', autoIncrement: false },
  [DAILY_PLANS_STORE]: { keyPath: 'id', autoIncrement: false },
  [SHOPPING_LISTS_STORE]: { keyPath: 'planId', autoIncrement: false },
  [FRIENDS_STORE]: { keyPath: 'token', autoIncrement: false }
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
        console.log('IndexedDB opened successfully, stores:', Array.from(this.db.objectStoreNames))
        resolve(request.result)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        console.log('IndexedDB upgrade needed, old version:', event.oldVersion, 'new version:', event.newVersion)

        // Handle migrations
        if (event.oldVersion < 4) {
          // Migration: rename weeklyPlans to dailyPlans
          if (db.objectStoreNames.contains('weeklyPlans')) {
            console.log('Migrating weeklyPlans store to dailyPlans')

            // Get all data from old store before deleting it
            const transaction = (event.target as IDBOpenDBRequest).transaction!
            const oldStore = transaction.objectStore('weeklyPlans')
            const oldData: WeeklyPlan[] = []

            const getAllRequest = oldStore.getAll()
            getAllRequest.onsuccess = () => {
              oldData.push(...getAllRequest.result)
              console.log('Retrieved', oldData.length, 'plans from old store')
            }

            // Wait for the transaction to complete before creating new store
            transaction.oncomplete = () => {
              // Now create new store and migrate data
              if (!db.objectStoreNames.contains(DAILY_PLANS_STORE)) {
                console.log('Creating dailyPlans store')
                const newStore = db.createObjectStore(DAILY_PLANS_STORE, { keyPath: 'id', autoIncrement: false })

                // Add migrated data to new store
                oldData.forEach(plan => {
                  newStore.add(deepCloneSerializable(plan))
                })
                console.log('Migrated', oldData.length, 'plans to dailyPlans store')
              }
            }
          }
        }

        // Always ensure all stores exist (defensive programming)
        Object.entries(STORES).forEach(([storeName, options]) => {
          if (!db.objectStoreNames.contains(storeName)) {
            console.log('Creating object store:', storeName)
            const store = db.createObjectStore(storeName, options)
            // Create indexes if needed
            if (storeName === RECIPES_STORE) {
              store.createIndex('name', 'name', { unique: false })
            }
          } else {
            console.log('Object store already exists:', storeName)
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
      const request = store.put({ key, value: deepCloneSerializable(value) })

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  // Daily plans operations
  async getDailyPlans(): Promise<WeeklyPlan[]> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DAILY_PLANS_STORE], 'readonly')
      const store = transaction.objectStore(DAILY_PLANS_STORE)
      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result || [])
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  async saveDailyPlan(plan: WeeklyPlan): Promise<void> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DAILY_PLANS_STORE], 'readwrite')
      const store = transaction.objectStore(DAILY_PLANS_STORE)
      const request = store.put(deepCloneSerializable(plan))

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  async deleteDailyPlan(planId: string): Promise<void> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([DAILY_PLANS_STORE], 'readwrite')
      const store = transaction.objectStore(DAILY_PLANS_STORE)
      const request = store.delete(planId)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  // Shopping lists operations
  async getShoppingList(planId: string): Promise<ShoppingListItem[]> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SHOPPING_LISTS_STORE], 'readonly')
      const store = transaction.objectStore(SHOPPING_LISTS_STORE)
      const request = store.get(planId)

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.items || [])
        } else {
          resolve([])
        }
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  async saveShoppingList(planId: string, items: ShoppingListItem[]): Promise<void> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SHOPPING_LISTS_STORE], 'readwrite')
      const store = transaction.objectStore(SHOPPING_LISTS_STORE)
      const request = store.put({
        planId,
        items: deepCloneSerializable(items),
        updatedAt: new Date().toISOString()
      })

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  // Friends operations
  async getFriend(token: string): Promise<{ token: string; name: string } | undefined> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FRIENDS_STORE], 'readonly')
      const store = transaction.objectStore(FRIENDS_STORE)
      const request = store.get(token)

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result as { token: string; name: string })
        } else {
          resolve(undefined)
        }
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  async setFriend(token: string, value: { name: string }): Promise<void> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FRIENDS_STORE], 'readwrite')
      const store = transaction.objectStore(FRIENDS_STORE)
      const request = store.put({ token, name: value.name })

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  async getAllFriends(): Promise<Array<{ token: string; name: string }>> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FRIENDS_STORE], 'readonly')
      const store = transaction.objectStore(FRIENDS_STORE)
      const request = store.getAll()

      request.onsuccess = () => {
        resolve((request.result || []) as Array<{ token: string; name: string }>)
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  async deleteFriend(token: string): Promise<void> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FRIENDS_STORE], 'readwrite')
      const store = transaction.objectStore(FRIENDS_STORE)
      const request = store.delete(token)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
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

// Daily plans helper functions
export const getDailyPlans = () => idbService.getDailyPlans()
export const saveDailyPlan = (plan: WeeklyPlan) => idbService.saveDailyPlan(plan)
export const deleteDailyPlan = (planId: string) => idbService.deleteDailyPlan(planId)

// Shopping lists helper functions
export const getShoppingList = (planId: string) => idbService.getShoppingList(planId)
export const saveShoppingList = (planId: string, items: ShoppingListItem[]) => idbService.saveShoppingList(planId, items)

// Friends helper functions
export const getFriend = (token: string) => idbService.getFriend(token)
export const setFriend = (token: string, value: { name: string }) => idbService.setFriend(token, value)
export const getFriends = () => idbService.getAllFriends()
export const deleteFriend = (token: string) => idbService.deleteFriend(token)

// Image utility functions
export const isValidImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  const maxSize = 50 * 1024 * 1024 // 50MB

  return validTypes.includes(file.type) && file.size <= maxSize
}

export const pasteImageFromClipboard = async (clipboardData?: DataTransfer): Promise<string | null> => {
  // Try modern Clipboard API first
  if (!clipboardData && navigator.clipboard && navigator.clipboard.read) {
    try {
      const clipboardItems = await navigator.clipboard.read()
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type)
            const file = new File([blob], 'pasted-image.png', { type })
            if (isValidImageFile(file)) {
              return await optimizeImageFile(file)
            }
          }
        }
      }
    } catch (error) {
      console.warn('Modern clipboard API failed, trying fallback:', error)
    }
  }

  // Fallback to clipboardData (better mobile support)
  if (clipboardData) {
    try {
      const items = clipboardData.items
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file && isValidImageFile(file)) {
            return await optimizeImageFile(file)
          }
        }
      }
    } catch (error) {
      console.error('Failed to read image from clipboardData:', error)
    }
  }

  return null
}
