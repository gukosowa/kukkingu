import { ref, Ref, watch } from 'vue'
import { migrateRecipeUnits, normalizeAmountType } from '~src/services/units'

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
  ingredients: Ingredient[]
}

const storedRecipes: Recipe[] = JSON.parse(localStorage.getItem('recipes') || '[]')
  .map((r: any) => migrateRecipeUnits(r))

// Thin Backend removed: no remote sync

export const recipes: Ref<Recipe[]> = ref(storedRecipes)

// persist changes to local storage and backend
watch(recipes, (val) => {
  updateRecipesToStore(val)
}, { deep: true })

// Keep localStorage and backend in sync whenever recipes changes
export function updateRecipesToStore(value: Recipe[]) {
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
  const stringified = JSON.stringify(value)
  localStorage.setItem('recipes', stringified)
}

export const storedOpenedRecipe = JSON.parse(
  localStorage.getItem('openedRecipe') || '-1'
)
export const openedRecipe = ref<number>(storedOpenedRecipe)
watch(openedRecipe, (val) => {
  localStorage.setItem('openedRecipe', JSON.stringify(val))
})

export const routeState = ref<Record<string, any>>({})

export function uuidv4() {
  return ([1e7] as any + -1e3 + -4e3 + -8e3 + -1e11).replace(
    /[018]/g,
    (c: any) => (
      c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  )
}

// no-op
