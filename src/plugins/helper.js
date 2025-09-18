import { getRecipes } from '~src/services/indexeddb'
import { uuidv4 } from '~src/store/index'

export const newRecipe = async (name) => {
  let localRecipes = await getRecipes()

  if (!name) {
    let defaultNames = localRecipes
      .filter((r) => r.name.includes('new #'))
      .map((r) => +r.name.replace('new #', ''))
    if (defaultNames.length === 0) {
      defaultNames = [0]
    }
    const max = Math.max(...defaultNames)
    name = 'new #' + (max + 1)
  }

  const recipeObj = {
    id: uuidv4(),
    name,
    edit: true,
    original: 100,
    desired: 100,
    note: '',
    url: '',
    ingredients: [newIngredient('', '', 'g')],
  }

  return [...localRecipes, recipeObj]
}

export const dispatchEvent = (event, body) => {
  const ev = new CustomEvent(event, { detail: body })
  document.dispatchEvent(ev)
}

export const newIngredient = (
  name = '',
  amount = '',
  amountType = 'g',
  note = ''
) => {
  return { name, amount, amountType, note }
}
