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

// Test function to demonstrate enhanced semantic ingredient diff
export function createTestIngredientDiff(): ImportDiff {
  const existingRecipe: Recipe = {
    id: "test-recipe-1",
    name: "Chocolate Chip Cookies",
    note: "Classic recipe",
    original: 12,
    desired: 24,
    ingredients: [
      { name: "Flour", amount: 2, amountType: "cups", note: "all-purpose" },
      { name: "Sugar", amount: 1, amountType: "cup", note: "" },
      { name: "Butter", amount: 100, amountType: "g", note: "softened" },
      { name: "Eggs", amount: 2, amountType: "p", note: "" }
    ]
  }

  const incomingRecipe: Recipe = {
    id: "test-recipe-1",
    name: "Chocolate Chip Cookies",
    note: "Updated classic recipe",
    original: 12,
    desired: 24,
    ingredients: [
      // Reordered ingredients - should not show as changes with semantic diff
      { name: "Butter", amount: 100, amountType: "g", note: "room temperature" }, // note changed
      { name: "Flour", amount: 2.5, amountType: "cups", note: "all-purpose" }, // amount changed
      { name: "Sugar", amount: 1, amountType: "cup", note: "brown sugar" }, // note changed
      { name: "Eggs", amount: 2, amountType: "p", note: "" }, // unchanged
      { name: "Chocolate Chips", amount: 200, amountType: "g", note: "dark chocolate" } // new ingredient
    ]
  }

  const changes = getRecipeChanges(existingRecipe, incomingRecipe)
  return { updates: [{ existing: existingRecipe, incoming: incomingRecipe, changes }], creates: [] }
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

  // Compare ingredients by name (semantic diff)
  const existingIngredients = existing.ingredients || []
  const incomingIngredients = incoming.ingredients || []

  // Create maps keyed by ingredient name for semantic comparison
  const existingMap = new Map<string, any>()
  const incomingMap = new Map<string, any>()

  // Helper function to normalize ingredient names for comparison
  const normalizeName = (name: string) => name?.toLowerCase().trim() || ''

  existingIngredients.forEach((ing, index) => {
    const key = normalizeName(ing.name)
    existingMap.set(key, { ...ing, originalIndex: index })
  })

  incomingIngredients.forEach((ing, index) => {
    const key = normalizeName(ing.name)
    incomingMap.set(key, { ...ing, originalIndex: index })
  })

  // Find ingredients that were added, removed, or changed
  const allIngredientKeys = new Set([...existingMap.keys(), ...incomingMap.keys()])

  allIngredientKeys.forEach(key => {
    const existingIng = existingMap.get(key)
    const incomingIng = incomingMap.get(key)

    if (!existingIng && incomingIng) {
      // New ingredient added
      changes.push(`Added ingredient: "${incomingIng.name}" (${incomingIng.amount} ${incomingIng.amountType})`)
    } else if (existingIng && !incomingIng) {
      // Ingredient removed
      changes.push(`Removed ingredient: "${existingIng.name}" (${existingIng.amount} ${existingIng.amountType})`)
    } else if (existingIng && incomingIng) {
      // Compare ingredient details for the same name
      const ingredientChanges = []

      // Only compare name if they're actually different (case-insensitive)
      if (existingIng.name !== incomingIng.name) {
        ingredientChanges.push(`name: "${existingIng.name}" → "${incomingIng.name}"`)
      }
      if (existingIng.amount !== incomingIng.amount) {
        ingredientChanges.push(`amount: ${existingIng.amount} → ${incomingIng.amount}`)
      }
      if (existingIng.amountType !== incomingIng.amountType) {
        ingredientChanges.push(`unit: "${existingIng.amountType}" → "${incomingIng.amountType}"`)
      }
      if ((existingIng.note || '') !== (incomingIng.note || '')) {
        const existingNote = existingIng.note || '(none)'
        const incomingNote = incomingIng.note || '(none)'
        ingredientChanges.push(`note: "${existingNote}" → "${incomingNote}"`)
      }

      if (ingredientChanges.length > 0) {
        changes.push(`Ingredient "${existingIng.name}": ${ingredientChanges.join(', ')}`)
      }
    }
  })

  // Note if ingredient count changed (but don't show it as a separate change since we handle individual additions/removals above)
  if (existingIngredients.length !== incomingIngredients.length) {
    // Only add this if there are actual structural changes beyond what we've already reported
    const addedCount = incomingIngredients.length - existingIngredients.length
    if (addedCount > 0) {
      // We already report individual additions above, so no need for count summary
    } else if (addedCount < 0) {
      // We already report individual removals above, so no need for count summary
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

// Helper function to test semantic ingredient diff
export function testSemanticIngredientDiff() {
  console.log("Testing semantic ingredient diff functionality...")

  const testDiff = createTestIngredientDiff()
  const changes = testDiff.updates[0].changes

  console.log("Recipe changes detected:")
  changes.forEach(change => console.log(`- ${change}`))

  // Expected results with semantic diff:
  // - Note changed
  // - Butter: note changed (not treated as different ingredient)
  // - Flour: amount changed (not treated as different ingredient)
  // - Sugar: note changed (not treated as different ingredient)
  // - Eggs: unchanged (should not appear in diff)
  // - Chocolate Chips: added as new ingredient

  const expectedChanges = [
    'Note: "Classic recipe" → "Updated classic recipe"',
    'Ingredient "Butter": note: "softened" → "room temperature"',
    'Ingredient "Flour": amount: 2 → 2.5',
    'Ingredient "Sugar": note: "(none)" → "brown sugar"',
    'Added ingredient: "Chocolate Chips" (200 g)'
  ]

  console.log("\nExpected changes:")
  expectedChanges.forEach(change => console.log(`- ${change}`))

  console.log(`\nActual changes count: ${changes.length}`)
  console.log(`Expected changes count: ${expectedChanges.length}`)

  return changes
}

