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

