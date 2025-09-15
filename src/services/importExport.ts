import type { Recipe } from '~src/store/index'

function parseTime(value?: string): number {
  if (!value) return Number.NEGATIVE_INFINITY
  const t = Date.parse(value)
  return isNaN(t) ? Number.NEGATIVE_INFINITY : t
}

export function mergeRecipesByExportedAt(
  existing: Recipe[],
  incoming: Recipe[]
): Recipe[] {
  const map = new Map<string, Recipe>()
  // Seed with existing recipes by id or synthetic key
  existing.forEach((r, idx) => {
    const key = r.id || `__noid__${idx}`
    map.set(key, r)
  })

  incoming.forEach((r) => {
    const key = r.id || ''
    if (!key) {
      // No id: treat as a new recipe, just append (use unique synthetic key)
      const synthetic = `__new__${map.size}`
      map.set(synthetic, r)
      return
    }
    const current = map.get(key)
    if (!current) {
      map.set(key, r)
      return
    }
    const curTime = parseTime(current.exportedAt)
    const inTime = parseTime(r.exportedAt)
    if (inTime > curTime) {
      map.set(key, r)
    }
  })

  // Preserve original order as much as possible: existing first in their order, then any new synthetic ones
  const result: Recipe[] = []
  existing.forEach((r, idx) => {
    const key = r.id || `__noid__${idx}`
    const merged = map.get(key)
    if (merged) {
      result.push(merged)
      map.delete(key)
    }
  })
  // Append remaining (new) recipes
  map.forEach((r, _key) => {
    result.push(r)
  })
  return result
}

export type ImportDiff = {
  updates: Array<{
    existing: Recipe
    incoming: Recipe
    changes: string[]
  }>
  creates: Recipe[]
}

export function analyzeImportDiff(
  existing: Recipe[],
  incoming: Recipe[]
): ImportDiff {
  const updates: ImportDiff['updates'] = []
  const creates: Recipe[] = []
  const existingMap = new Map<string, Recipe>()

  // Create map of existing recipes by ID
  existing.forEach((r) => {
    if (r.id) {
      existingMap.set(r.id, r)
    }
  })

  incoming.forEach((incomingRecipe) => {
    if (incomingRecipe.id && existingMap.has(incomingRecipe.id)) {
      // This is an update
      const existingRecipe = existingMap.get(incomingRecipe.id)!
      const changes = getRecipeChanges(existingRecipe, incomingRecipe)
      if (changes.length > 0) {
        updates.push({
          existing: existingRecipe,
          incoming: incomingRecipe,
          changes
        })
      }
    } else {
      // This is a new recipe
      creates.push(incomingRecipe)
    }
  })

  return { updates, creates }
}

function getRecipeChanges(existing: Recipe, incoming: Recipe): string[] {
  const changes: string[] = []

  // Compare basic fields
  if (existing.name !== incoming.name) {
    changes.push(`Name: "${existing.name}" → "${incoming.name}"`)
  }
  if (existing.note !== incoming.note) {
    changes.push(`Note: "${existing.note}" → "${incoming.note}"`)
  }
  if (existing.original !== incoming.original) {
    changes.push(`Original: ${existing.original} → ${incoming.original}`)
  }
  if (existing.desired !== incoming.desired) {
    changes.push(`Desired: ${existing.desired} → ${incoming.desired}`)
  }

  // Compare tags
  const existingTags = existing.tags || []
  const incomingTags = incoming.tags || []
  const tagsAdded = incomingTags.filter(t => !existingTags.includes(t))
  const tagsRemoved = existingTags.filter(t => !incomingTags.includes(t))

  if (tagsAdded.length > 0) {
    changes.push(`Tags added: ${tagsAdded.join(', ')}`)
  }
  if (tagsRemoved.length > 0) {
    changes.push(`Tags removed: ${tagsRemoved.join(', ')}`)
  }

  // Compare ingredients
  const existingIngredients = existing.ingredients || []
  const incomingIngredients = incoming.ingredients || []

  if (existingIngredients.length !== incomingIngredients.length) {
    changes.push(`Ingredients: ${existingIngredients.length} → ${incomingIngredients.length}`)
  } else {
    // Check for changes in existing ingredients
    const ingredientChanges = []
    for (let i = 0; i < existingIngredients.length; i++) {
      const existingIng = existingIngredients[i]
      const incomingIng = incomingIngredients[i]
      if (existingIng.name !== incomingIng.name ||
          existingIng.amount !== incomingIng.amount ||
          existingIng.amountType !== incomingIng.amountType ||
          existingIng.note !== incomingIng.note) {
        ingredientChanges.push(`Ingredient ${i + 1}`)
      }
    }
    if (ingredientChanges.length > 0) {
      changes.push(`Modified ingredients: ${ingredientChanges.join(', ')}`)
    }
  }

  return changes
}

export function mergeChatGPTRecipe(
  existing: Recipe[],
  incoming: Recipe
): Recipe[] {
  const map = new Map<string, Recipe>()

  // Create map of existing recipes by ID
  existing.forEach((r) => {
    if (r.id) {
      map.set(r.id, r)
    }
  })

  // If incoming recipe has an ID and exists in current recipes, replace it
  if (incoming.id && map.has(incoming.id)) {
    return existing.map(r => r.id === incoming.id ? incoming : r)
  }

  // If no ID match or no ID, append as new recipe
  return [...existing, incoming]
}

