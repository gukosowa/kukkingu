import { ref } from 'vue'
import { getCurrentUserId } from 'thin-backend/auth.js'
import {
  createRecord,
  getCurrentUser,
  initAuth,
  query,
} from 'thin-backend'
import {
  recipes,
  setSyncRecipeID,
  updateRecipesToStore,
  uuidv4,
} from '~src/store/index'

export function getLocalRecipesStringified() {
  return localStorage.getItem('recipes') || '[]'
}
export function getLocalRecipesArray() {
  return JSON.parse(getLocalRecipesStringified())
}

function ensureRecipesId() {
  let recs = getLocalRecipesArray()
  let changeId = false
  recs = recs.map((r: any) => {
    if (!r.id) {
      changeId = true
      r.id = uuidv4()
    }
    return r
  })
  if (changeId) {
    localStorage.setItem('recipes', JSON.stringify(recs))
  }
}

export const user = ref<any>(null)
export const userLoading = ref<boolean>(true)

export async function syncRecipe() {
  await initAuth()

  if (getCurrentUserId()) {
    ensureRecipesId()

    let queryRecipe: any = await query('recipes').fetchOne()

    if (queryRecipe === null) {
      queryRecipe = await createRecord('recipes', {
        recipe: getLocalRecipesStringified(),
      })
    }
    const fetchedRecipes = JSON.parse(queryRecipe.recipe)

    setSyncRecipeID(queryRecipe.id)

    const mustSync = getLocalRecipesArray().length !== fetchedRecipes.length

    const merged = [...getLocalRecipesArray(), ...fetchedRecipes].reduce(
      (acc: any[], value: any) => {
        let existingValueIndex = acc.findIndex((obj) => obj.id === value.id)
        if (existingValueIndex === -1) {
          acc.push({ ...value })
          return acc
        }
        acc[existingValueIndex] = {
          ...acc[existingValueIndex],
          ...value,
          edit: false,
        }
        return acc
      },
      [] as any[]
    )

    localStorage.setItem('recipes', JSON.stringify(merged))

    if (mustSync) {
      updateRecipesToStore(merged as any)
    }

    recipes.value = merged as any
  }

  const u = await getCurrentUser()
  user.value = u
  userLoading.value = false
  return u
}

export const userPromise = syncRecipe()

