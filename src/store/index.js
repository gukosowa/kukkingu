import { writable } from 'svelte/store'

const storedRecipes = localStorage.getItem('recipes')
export const recipes = writable(storedRecipes)
recipes.subscribe((value) => {
  localStorage.setItem('recipes', value)
})
