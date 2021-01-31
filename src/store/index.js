import { writable } from 'svelte/store'

const storedRecipes = JSON.parse(localStorage.getItem('recipes') || '[]')
export const recipes = writable(storedRecipes)
recipes.subscribe((value) => {
  localStorage.setItem('recipes', JSON.stringify(value))
})

export const storedOpenedRecipe = JSON.parse(
  localStorage.getItem('openedRecipe') || -1
)
export const openedRecipe = writable(storedOpenedRecipe)
openedRecipe.subscribe((value) => {
  localStorage.setItem('openedRecipe', JSON.stringify(value))
})
