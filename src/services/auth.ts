import { ref } from 'vue'
import { uuidv4 } from '~src/store/index'

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

// Thin Backend removed: expose static auth state for UI
export const user = ref<any>(null)
export const userLoading = ref<boolean>(false)

// Ensure local recipes have IDs after startup
ensureRecipesId()
