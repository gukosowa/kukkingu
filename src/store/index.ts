import { ref, Ref, watch } from 'vue'
import { updateRecord } from 'thin-backend'

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
  ingredients: Ingredient[]
}

const storedRecipes: Recipe[] = JSON.parse(localStorage.getItem('recipes') || '[]')

export let syncRecipeID: string | null = null
export function setSyncRecipeID(id: string) {
  syncRecipeID = id
}

export const recipes: Ref<Recipe[]> = ref(storedRecipes)
let timeoutDidSynced: any = null
export const didSynced = ref(false)

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
      })
      if (!r.id) {
        r.id = uuidv4()
      }
    }
    return r
  })
  const stringified = JSON.stringify(value)
  localStorage.setItem('recipes', stringified)

  if (syncRecipeID) {
    didSynced.value = true
    updateRecord('recipes', syncRecipeID, {
      recipe: stringified,
    }).then((result) => {
      console.log('finished sync', result)
      if (timeoutDidSynced) {
        clearTimeout(timeoutDidSynced)
        timeoutDidSynced = null
      }
      timeoutDidSynced = setTimeout(() => {
        didSynced.value = false
      }, 100)
    })
  }
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
