import { ref, Ref, watch } from 'vue'
import { migrateRecipeUnits, normalizeAmountType } from '~src/services/units'
import { getRecipes, saveRecipes, getSetting, setSetting } from '~src/services/indexeddb'

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
  ingredients: Ingredient[]
}

// Initialize recipes from IndexedDB
export const recipes: Ref<Recipe[]> = ref([])

// Load recipes from IndexedDB on initialization
getRecipes().then(storedRecipes => {
  recipes.value = storedRecipes.map((r: any) => migrateRecipeUnits(r))
}).catch(error => {
  console.error('Failed to load recipes from IndexedDB:', error)
  // Fallback to empty array
  recipes.value = []
})

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

export function uuidv4() {
  return ([1e7] as any + -1e3 + -4e3 + -8e3 + -1e11).replace(
    /[018]/g,
    (c: any) => (
      c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  )
}

// no-op
