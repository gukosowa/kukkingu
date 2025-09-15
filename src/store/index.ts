import { ref, Ref, watch } from 'vue'
import { migrateRecipeUnits, normalizeAmountType } from '~src/services/units'
import { getRecipes, saveRecipes, getSetting, setSetting, migrateFromLocalStorage, getWeeklyPlans, saveWeeklyPlan, deleteWeeklyPlan } from '~src/services/indexeddb'

export type Ingredient = {
  name: string
  amount: number | string
  amountType: string
  note?: string
  checked?: boolean
}

export type Recipe = {
  id?: string
  name: string
  edit?: boolean
  original: number
  desired: number
  note: string
  url?: string
  checklist?: boolean
  rename?: boolean
  // Timestamp of last export (ISO string)
  exportedAt?: string
  image?: string // Base64 encoded image data
  tags?: string[]
  ingredients: Ingredient[]
}

export type DayPlan = {
  date: string // ISO date string (YYYY-MM-DD)
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
  startDate: string // ISO date string (YYYY-MM-DD)
  days: DayPlan[]
  createdAt: string
  updatedAt: string
  notes?: string
}

export type ShoppingListItem = {
  name: string
  amount: number
  amountType: string
  checked?: boolean
  recipes: string[] // recipe IDs that use this ingredient
}

// Initialize recipes from IndexedDB
export const recipes: Ref<Recipe[]> = ref([])

// Load recipes from IndexedDB on initialization, but wait for migration first
async function initializeRecipes() {
  try {
    // Wait for migration to complete before loading recipes
    await migrateFromLocalStorage()
    const storedRecipes = await getRecipes()
    recipes.value = storedRecipes.map((r: any) => migrateRecipeUnits(r))
  } catch (error) {
    console.error('Failed to load recipes from IndexedDB:', error)
    // Fallback to empty array
    recipes.value = []
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
  value = value.map((r) => {
    if (r.ingredients) {
      r.ingredients.forEach((i: any) => {
        delete (i as any)._inputAmountType
        // Normalize units before persisting
        i.amountType = normalizeAmountType(i.amountType)
      })
      if (!r.id) {
        r.id = uuidv4()
      }
    }
    return r
  })

  try {
    await saveRecipes(value)
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

// Weekly plans store
export const weeklyPlans: Ref<WeeklyPlan[]> = ref([])

// Load weekly plans from IndexedDB on initialization
getWeeklyPlans().then(storedPlans => {
  weeklyPlans.value = storedPlans
}).catch(error => {
  console.error('Failed to load weekly plans from IndexedDB:', error)
  weeklyPlans.value = []
})

// Persist weekly plans changes to IndexedDB
watch(weeklyPlans, async (plans) => {
  // The individual save operations will handle persistence
  // This watch is mainly for external changes
}, { deep: true })

// Weekly plans management functions
export async function createWeeklyPlan(name: string, startDate: string, dayLength: number = 7): Promise<WeeklyPlan> {
  const plan: WeeklyPlan = {
    id: uuidv4(),
    name,
    startDate,
    days: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  // Initialize days based on dayLength
  for (let i = 0; i < dayLength; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)

    plan.days.push({
      date: date.toISOString().split('T')[0],
      recipes: []
    })
  }

  await saveWeeklyPlan(plan)
  weeklyPlans.value.push(plan)
  return plan
}

export async function updateWeeklyPlan(plan: WeeklyPlan): Promise<void> {
  plan.updatedAt = new Date().toISOString()
  await saveWeeklyPlan(plan)

  const index = weeklyPlans.value.findIndex(p => p.id === plan.id)
  if (index !== -1) {
    weeklyPlans.value[index] = plan
  }
}

export async function removeWeeklyPlan(planId: string): Promise<void> {
  await deleteWeeklyPlan(planId)
  weeklyPlans.value = weeklyPlans.value.filter(p => p.id !== planId)
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
