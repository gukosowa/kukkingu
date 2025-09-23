import { ref, watch } from 'vue'
import type { Ref } from 'vue'
import { migrateRecipeUnits, normalizeAmountType } from '../services/units'
import { currentLocale } from '~src/i18n'
import { getRecipes, saveRecipes, getSetting, setSetting, migrateFromLocalStorage, getDailyPlans, saveDailyPlan, deleteDailyPlan, getShoppingList, saveShoppingList } from '../services/indexeddb'

export type Ingredient = {
  name: string
  amount: number | string
  amountType: string
  note?: string
  checked?: boolean
}

export type CookedEntry = {
  cookedAt: string
  note?: string
}

export type Recipe = {
  id?: string
  name: string
  edit?: boolean
  original: number
  desired: number
  servings?: number // Number of servings for the recipe
  note: string
  url?: string
  checklist?: boolean
  rename?: boolean
  // Timestamp of last export (ISO string)
  exportedAt?: string
  image?: string // Base64 encoded image data
  showAsBackground?: boolean // Whether to display image as background
  backgroundArea?: { xPct: number; yPct: number; wPct: number; hPct: number } | null
  tags?: string[]
  ingredients: Ingredient[]
  cooked?: CookedEntry[]
}

export type DayPlan = {
  recipes: RecipePlan[]
  note?: string
}

export type RecipePlan = {
  recipeId: string
  recipe?: Recipe // populated when loaded
  servings: number
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
}

export type WeeklyPlan = {
  id: string
  name: string
  days: DayPlan[]
  createdAt: string
  updatedAt: string
  notes?: string
  servings?: number // General servings for the entire plan
}

export type ShoppingListItem = {
  name: string
  amount: number
  amountType: string
  checked?: boolean
  recipes: string[] // recipe IDs that use this ingredient
  notes?: string[]
}

// Initialize recipes from IndexedDB
export const recipes: Ref<Recipe[]> = ref([])
export const recipesInitialized = ref(false)

// Load recipes from IndexedDB on initialization, but wait for migration first
async function initializeRecipes() {
  try {
    // Wait for migration to complete before loading recipes
    await migrateFromLocalStorage()
    const storedRecipes = await getRecipes()
    // Apply unit migration and ensure servings field exists
    const migratedRecipes = storedRecipes.map((r: any) => {
      const migrated = migrateRecipeUnits(r)
      // Ensure servings field exists and has a default value
      if (migrated.servings === undefined) {
        migrated.servings = 2 // Default to 2 servings
      }
      if (!Array.isArray(migrated.cooked)) {
        migrated.cooked = []
      } else {
        migrated.cooked = migrated.cooked
          .filter((entry: any) => entry && typeof entry.cookedAt === 'string')
          .map((entry: any) => {
            const cookedEntry: CookedEntry = { cookedAt: entry.cookedAt }
            if (typeof entry.note === 'string' && entry.note.trim()) {
              cookedEntry.note = entry.note
            }
            return cookedEntry
          })
      }
      return migrated
    })
    recipes.value = migratedRecipes
  } catch (error) {
    console.error('Failed to load recipes from IndexedDB:', error)
    // Fallback to empty array
    recipes.value = []
  } finally {
    recipesInitialized.value = true
  }
}

// Start initialization
initializeRecipes()

// persist changes to IndexedDB
watch(recipes, async (val) => {
  await updateRecipesToStore(val)
}, { deep: true })

// Keep IndexedDB in sync whenever recipes changes
export async function updateRecipesToStore(value: Recipe[]) {
  const sanitized = value.map((recipe) => {
    const cleaned: Recipe = { ...recipe }

    if (Array.isArray(cleaned.ingredients)) {
      cleaned.ingredients = cleaned.ingredients.map((ingredient: any) => {
        const normalizedIngredient = { ...ingredient }
        delete (normalizedIngredient as any)._inputAmountType
        normalizedIngredient.amountType = normalizeAmountType(normalizedIngredient.amountType)
        return normalizedIngredient
      })
    }

    if (!cleaned.id) {
      cleaned.id = uuidv4()
    }

    if (!Array.isArray(cleaned.cooked)) {
      cleaned.cooked = []
    } else {
      cleaned.cooked = cleaned.cooked
        .filter((entry: any) => entry && typeof entry.cookedAt === 'string')
        .map((entry: any) => {
          const cookedEntry: CookedEntry = { cookedAt: entry.cookedAt }
          if (typeof entry.note === 'string' && entry.note.trim()) {
            cookedEntry.note = entry.note
          }
          return cookedEntry
        })
    }

    if (cleaned.servings === undefined) {
      cleaned.servings = 2
    }

    return cleaned
  })

  try {
    await saveRecipes(sanitized)
  } catch (error) {
    console.error('Failed to save recipes to IndexedDB:', error)
  }
}

// Initialize opened recipe from IndexedDB
export const openedRecipe = ref<number>(-1)

// Load opened recipe from IndexedDB
getSetting<number>('openedRecipe', -1).then(value => {
  openedRecipe.value = value
}).catch(error => {
  console.error('Failed to load opened recipe from IndexedDB:', error)
  openedRecipe.value = -1
})

watch(openedRecipe, async (val) => {
  try {
    await setSetting('openedRecipe', val)
  } catch (error) {
    console.error('Failed to save opened recipe to IndexedDB:', error)
  }
})

export const routeState = ref<Record<string, any>>({})

// Global modal states for cross-component communication
export const modalStates = ref({
  showImportJson: false
})

// Global search state for cross-component search functionality
export const globalSearchFilter = ref('')

// Overview (Storage) edit mode toggle, controlled from header
export const storageEditMode = ref(false)

// Recipe view settings stored globally in IndexedDB
export const recipeViewSettings = ref({
  denseMode: false,
  showNotes: false
})

// Load recipe view settings from IndexedDB
getSetting('recipeViewSettings', { denseMode: false, showNotes: false }).then(settings => {
  recipeViewSettings.value = { ...recipeViewSettings.value, ...settings }
}).catch(error => {
  console.error('Failed to load recipe view settings from IndexedDB:', error)
})

// Persist recipe view settings changes to IndexedDB
watch(recipeViewSettings, async (settings) => {
  try {
    await setSetting('recipeViewSettings', settings)
  } catch (error) {
    console.error('Failed to save recipe view settings to IndexedDB:', error)
  }
}, { deep: true })

export function uuidv4() {
  return ([1e7] as any + -1e3 + -4e3 + -8e3 + -1e11).replace(
    /[018]/g,
    (c: any) => (
      c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  )
}

// Japanese text sorting function that handles mixed kanji/kana/romaji
export function sortJapaneseText(a: string, b: string): number {
  if (!a && !b) return 0
  if (!a) return 1
  if (!b) return -1

  // Normalize the strings for better comparison
  const normalize = (str: string) => str
    .toLowerCase()
    .trim()
    // Convert full-width characters to half-width
    .replace(/[\uff01-\uff5e]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    // Normalize spaces
    .replace(/\s+/g, ' ')

  const normalizedA = normalize(a)
  const normalizedB = normalize(b)

  // First try Japanese locale comparison
  const jaCompare = normalizedA.localeCompare(normalizedB, 'ja')
  if (jaCompare !== 0) return jaCompare

  // If Japanese comparison returns equal, try general unicode comparison
  return normalizedA.localeCompare(normalizedB, 'en', { numeric: true, sensitivity: 'base' })
}

// Get all unique tags from all recipes, sorted alphabetically with Japanese support
export function getAllTags(): string[] {
  const allTags = new Set<string>()

  recipes.value.forEach(recipe => {
    if (recipe.tags) {
      recipe.tags.forEach(tag => allTags.add(tag))
    }
  })

  return Array.from(allTags).sort(sortJapaneseText)
}

// Daily plans store
export const dailyPlans: Ref<WeeklyPlan[]> = ref([])

// Load daily plans from IndexedDB on initialization
getDailyPlans().then(storedPlans => {
  dailyPlans.value = storedPlans
}).catch(error => {
  console.error('Failed to load daily plans from IndexedDB:', error)
  dailyPlans.value = []
})

// Persist daily plans changes to IndexedDB
watch(dailyPlans, async (plans) => {
  // The individual save operations will handle persistence
  // This watch is mainly for external changes
}, { deep: true })

// Daily plans management functions
export async function createWeeklyPlan(name: string, dayLength: number = 7): Promise<WeeklyPlan> {
  const plan: WeeklyPlan = {
    id: uuidv4(),
    name,
    days: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  // Initialize days based on dayLength
  for (let i = 0; i < dayLength; i++) {
    plan.days.push({
      recipes: []
    })
  }

  await saveDailyPlan(plan)
  dailyPlans.value.push(plan)
  return plan
}

export async function updateWeeklyPlan(plan: WeeklyPlan): Promise<void> {
  plan.updatedAt = new Date().toISOString()
  await saveDailyPlan(plan)

  const index = dailyPlans.value.findIndex(p => p.id === plan.id)
  if (index !== -1) {
    dailyPlans.value[index] = plan
  }
}

export async function removeWeeklyPlan(planId: string): Promise<void> {
  await deleteDailyPlan(planId)
  dailyPlans.value = dailyPlans.value.filter(p => p.id !== planId)
}

// Helper function to get populated recipes for a plan
export function getPopulatedPlan(plan: WeeklyPlan): WeeklyPlan {
  const populatedPlan = { ...plan }
  populatedPlan.days = populatedPlan.days.map(day => ({
    ...day,
    recipes: day.recipes.map(recipePlan => ({
      ...recipePlan,
      recipe: recipes.value.find(r => r.id === recipePlan.recipeId)
    }))
  }))
  return populatedPlan
}

// Shopping list management functions
export async function getShoppingListForPlan(planId: string): Promise<ShoppingListItem[]> {
  try {
    const shoppingListData = await getShoppingList(planId)
    return shoppingListData || []
  } catch (error) {
    console.error('Failed to load shopping list for plan:', planId, error)
    return []
  }
}

export async function updateShoppingListItem(planId: string, item: ShoppingListItem): Promise<void> {
  try {
    // Get current shopping list for the plan
    const currentList = await getShoppingListForPlan(planId)

    // Find and update the item
    const itemIndex = currentList.findIndex(existingItem =>
      existingItem.name.toLowerCase() === item.name.toLowerCase() &&
      existingItem.amountType === item.amountType
    )

    if (itemIndex !== -1) {
      currentList[itemIndex] = { ...item }
    } else {
      currentList.push({ ...item })
    }

    // Save updated list
    await saveShoppingList(planId, currentList)
  } catch (error) {
    console.error('Failed to update shopping list item:', error)
  }
}

export async function saveShoppingListForPlan(planId: string, shoppingList: ShoppingListItem[]): Promise<void> {
  try {
    await saveShoppingList(planId, shoppingList)
  } catch (error) {
    console.error('Failed to save shopping list for plan:', planId, error)
  }
}
