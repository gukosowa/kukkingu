export const syncStorage = (key, value, fallback) => {
  if (value === undefined || value === null) {
    value = getStorage(key) || fallback
  }
  localStorage.setItem(key, JSON.stringify(value))
  dispatchEvent(key, JSON.stringify(value))
  return value
}

export const getStorage = (key, fallback) => {
  let k = localStorage.getItem(key)
  if (!k) {
    k = JSON.stringify(fallback || '')
    localStorage.setItem(key, k)
    dispatchEvent(key, k)
  }
  return JSON.parse(k)
}

export const newRecipe = (name) => {
  let recipes = getStorage('recipes', [])

  if (!name) {
    let defaultNames = recipes
      .filter((r) => r.name.includes('new #'))
      .map((r) => +r.name.replace('new #', ''))
    if (defaultNames.length === 0) {
      defaultNames = [0]
    }
    const max = Math.max(...defaultNames)
    name = 'new #' + (max + 1)
  }

  const recipeObj = {
    name,
    original: 100,
    desired: 100,
    ingredients: [newIngredient()],
  }

  if (recipes.length) {
    recipes.push(recipeObj)
  } else {
    recipes = [recipeObj]
  }

  return syncStorage('recipes', recipes, [])
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
