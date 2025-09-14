import { ref } from 'vue'
import { uuidv4 } from '~src/store/index'
import { getRecipes, saveRecipes } from '~src/services/indexeddb'

export async function getLocalRecipesStringified() {
  const recipes = await getRecipes()
  return JSON.stringify(recipes)
}
export async function getLocalRecipesArray() {
  return await getRecipes()
}

async function ensureRecipesId() {
  let recs = await getLocalRecipesArray()
  let changeId = false
  recs = recs.map((r: any) => {
    if (!r.id) {
      changeId = true
      r.id = uuidv4()
    }
    return r
  })
  if (changeId) {
    await saveRecipes(recs)
  }
}

// Thin Backend removed: expose static auth state for UI
export const user = ref<any>(null)
export const userLoading = ref<boolean>(false)

// Ensure local recipes have IDs after startup
ensureRecipesId().catch(console.error)
