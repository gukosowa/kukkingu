import { getCurrentUserId } from 'thin-backend/auth.js'
import {
  recipes,
  setSyncRecipeID,
  updateRecipesToStore,
  uuidv4,
} from '~src/store/index.js'
import App from './App.svelte'

import { addMessages, init } from 'svelte-i18n'
import en from './i18n/en.json'
import jp from './i18n/jp.json'
addMessages('en', en)
addMessages('jp', jp)
init({
  fallbackLocale: 'jp',
  initialLocale: 'jp',
})

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

function ensureRecipesId() {
  let recipes = getLocalRecipesArray()
  let changeId = false
  recipes = recipes.map((r) => {
    if (!r.id) {
      changeId = true
      r.id = uuidv4()
    }
    return r
  })
  if (changeId) {
    localStorage.setItem('recipes', JSON.stringify(recipes))
  }
}

export function getLocalRecipesStringified() {
  return localStorage.getItem('recipes') || '[]'
}
export function getLocalRecipesArray() {
  return JSON.parse(getLocalRecipesStringified())
}

async function syncRecipe() {
  await initAuth()

  if (getCurrentUserId()) {
    ensureRecipesId()

    let queryRecipe = await query('recipes').fetchOne()

    if (queryRecipe === null) {
      queryRecipe = await createRecord('recipes', {
        recipe: getLocalRecipesStringified(),
      })
    }
    const fetchedRecipes = JSON.parse(queryRecipe.recipe)

    setSyncRecipeID(queryRecipe.id)

    const mustSync = getLocalRecipesArray().length !== fetchedRecipes.length

    const merged = [...getLocalRecipesArray(), ...fetchedRecipes].reduce(
      (acc, value) => {
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
      []
    )

    localStorage.setItem('recipes', JSON.stringify(merged))

    if (mustSync) {
      updateRecipesToStore(merged)
    }

    recipes.set(merged)
  }

  return getCurrentUser()
}

export const userPromise = syncRecipe()

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
