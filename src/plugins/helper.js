export const getStorage = (key, fallback) => {
  let k = localStorage.getItem(key)
  if (!k) {
    k = JSON.stringify(fallback || '')
    localStorage.setItem(key, k)
    dispatchEvent(key, k)
  }
  return JSON.parse(k)
}

function setAuthToken(token) {
  localStorage.setItem('access_token', token)
}

function getAuthToken() {
  return localStorage.getItem('access_token') ?? ''
}

export async function syncDB() {
  return await fetch('http://localhost:9999/netlify/functions/db', {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
      "Authorization": 'Bearer ' + getAuthToken()
    }
  }).then(res => res.json())
}

export async function endpointUser(endpoint, data) {
  return fetch('http://localhost:9999/.netlify/functions/' + endpoint, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    }
  })
}

export async function test() {
  return fetch('http://localhost:9999/netlify/functions/db', {
  method: "POST",
  body: JSON.stringify(_data),
  headers: {
    "Content-type": "application/json; charset=UTF-8",
    "Authorization": 'Bearer'
  }
})
}

export const newRecipe = (name) => {
  let localRecipes = getStorage('recipes', [])

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
    name,
    edit: true,
    original: 100,
    desired: 100,
    note: '',
    url: '',
    ingredients: [newIngredient('人', '2', '個')],
  }

  if (localRecipes.length) {
    return [...localRecipes, recipeObj]
  } else {
    return [recipeObj]
  }
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
