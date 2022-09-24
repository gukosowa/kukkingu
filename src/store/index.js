import { writable } from 'svelte/store'
import { doSync, fetchBackend } from '~plugins/helper.js'

let initial = false
const storedRecipes = JSON.parse(localStorage.getItem('recipes') || '[]')
export const recipes = writable(storedRecipes)
recipes.subscribe(async (value) => {
  localStorage.setItem('recipes', JSON.stringify(value))
  if (initial === false) {
    initial = true
    await doSync()
  }
  fetchBackend('database', {
    storage: value,
  }).then((res) => console.log('Synced', res.data[0].storage))
})

export const storedOpenedRecipe = JSON.parse(
  localStorage.getItem('openedRecipe') || -1
)
export const openedRecipe = writable(storedOpenedRecipe)
openedRecipe.subscribe((value) => {
  localStorage.setItem('openedRecipe', JSON.stringify(value))
})

export const storedUser = JSON.parse(
  localStorage.getItem('user') || JSON.stringify({ email: '', password: '' })
)
export const storeUser = writable(storedUser)
storeUser.subscribe((value) => {
  localStorage.setItem('user', JSON.stringify(value))
})

export const storedAuth = JSON.parse(
  localStorage.getItem('auth') ||
    JSON.stringify({
      access_token: '',
      expires_in: '',
      refresh_token: '',
      token_type: '',
      type: '',
    })
)
export const storeAuth = writable(storedAuth)
storeAuth.subscribe((value) => {
  localStorage.setItem('auth', JSON.stringify(value))
})

export const route = writable({})
