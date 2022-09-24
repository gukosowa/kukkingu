import { getCurrentUserId } from 'thin-backend/auth.js'
import { setSyncRecipeID, uuidv4 } from '~src/store/index.js'
import App from './App.svelte'

import {
  createRecord,
  getCurrentUser,
  initAuth,
  initThinBackend,
  query,
} from 'thin-backend'
initThinBackend({
  host: 'https://cooker.thinbackend.app',
})

await initAuth()

async function syncRecipe() {
  if (getCurrentUserId()) {
    let queryRecipe = await query('recipes').fetchOne()
    const localRecipeString = localStorage.getItem('recipes') || '[]'
    let changeId = false
    let localRecipes = JSON.parse(localRecipeString).map((r) => {
      if (!r.id) {
        changeId = true
        r.id = uuidv4()
      }
      return r
    })
    if (changeId) {
      localStorage.setItem('recipes', JSON.stringify(localRecipes))
    }

    if (queryRecipe === null) {
      queryRecipe = await createRecord('recipes', {
        recipe: JSON.stringify(localRecipes),
      })
    }
    const recipes = JSON.parse(queryRecipe.recipe)

    setSyncRecipeID(queryRecipe.id)

    const merged = [...recipes, ...localRecipes].reduce((acc, value) => {
      let existingValueIndex = acc.findIndex((obj) => obj.id === value.id)
      if (existingValueIndex === -1) {
        acc.push({ ...value })
        return acc
      }
      acc[existingValueIndex] = {
        ...acc[existingValueIndex],
        ...value,
      }
      return acc
    }, [])

    localStorage.setItem('recipes', JSON.stringify(merged))
  }
}

await syncRecipe()

export const userPromise = getCurrentUser()

const app = new App({
  target: document.body,
})

// noinspection JSUnusedGlobalSymbols
export default app

// Hot Module Replacement (HMR) - Remove this snippet to remove HMR.
// Learn more: https://www.snowpack.dev/concepts/hot-module-replacement
if (import.meta.hot) {
  import.meta.hot.accept()
  import.meta.hot.dispose(() => {
    app.$destroy()
  })
} else {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
  }
}
