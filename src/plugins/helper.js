import { recipes, storedAuth } from '~src/store/index.js'

export const isDevelopment = () => import.meta.env.MODE === 'development'

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

export function backendUrl(endpoint) {
  let port = 9000
  return import.meta.env.MODE === 'development'
    ? `http://localhost:${port}/.netlify/functions/${endpoint}`
    : `https://kukkingu.netlify.app/.netlify/functions/${endpoint}`
}

export async function doSync() {
  const onlineStorage = await fetchBackend('database', null, {
    method: 'GET',
  }).then((res) => res.data)
  if (onlineStorage.length > 0) {
    recipes.set(onlineStorage[0].storage)
  }
  console.log('Fetch Online', { onlineStorage })
}

export async function fetchBackend(endpoint, data = {}, options = {}) {
  const accessToken = JSON.parse(
    localStorage.getItem('auth') ||
      JSON.stringify({
        access_token: '',
        expires_in: '',
        refresh_token: '',
        token_type: '',
        type: '',
      })
  )
  try {
    const response = await fetch(backendUrl(endpoint), {
      method: options.method ?? 'POST',
      headers: {
        'X-Supabase-Auth': accessToken.access_token || '',
      },
      body: options.method === 'GET' ? undefined : JSON.stringify(data),
    })
    return await response.json()
  } catch (err) {
    console.log(err)
  }
}
