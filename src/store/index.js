import { writable } from 'svelte/store'
import { updateRecord } from 'thin-backend'

const storedRecipes = JSON.parse(localStorage.getItem('recipes') || '[]')

export let syncRecipeID = null
export function setSyncRecipeID(id) {
  syncRecipeID = id
}

export const recipes = writable(storedRecipes)
let timeoutDidSynced = null
export const didSynced = writable(false)

recipes.subscribe((value) => {
  updateRecipesToStore(value)
})

export function updateRecipesToStore(value) {
  value = value.map((r) => {
    if (r.ingredients) {
      r.ingredients.map((i) => {
        // noinspection JSUnresolvedVariable
        delete i._inputAmountType
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
    didSynced.set(true)
    updateRecord('recipes', syncRecipeID, {
      recipe: stringified,
    }).then((result) => {
      // finished update
      console.log('finished sync', result)

      if (timeoutDidSynced) {
        clearTimeout(timeoutDidSynced)
        timeoutDidSynced = null
      }
      timeoutDidSynced = setTimeout(() => {
        didSynced.set(false)
      }, 100)
    })
  }
}

export const storedOpenedRecipe = JSON.parse(
  localStorage.getItem('openedRecipe') || -1
)
export const openedRecipe = writable(storedOpenedRecipe)
openedRecipe.subscribe((value) => {
  localStorage.setItem('openedRecipe', JSON.stringify(value))
})

export const route = writable({})

export function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  )
}
