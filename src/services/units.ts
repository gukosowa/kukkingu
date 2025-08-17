// Utilities for normalizing unit strings between legacy Japanese and canonical keys
// Canonical keys used in code/i18n: g, ml, tbl, tea, p, pinch

const mapToCanonical: Record<string, string> = {
  // grams
  g: 'g',
  グラム: 'g',
  // milliliters / cc
  ml: 'ml',
  '㎖': 'ml',
  ミリリットル: 'ml',
  '㏄': 'ml',
  CC: 'ml',
  cc: 'ml',
  ＣＣ: 'ml',
  // tablespoons
  tbl: 'tbl',
  tbsp: 'tbl',
  tablespoon: 'tbl',
  大さじ: 'tbl',
  // teaspoons
  tea: 'tea',
  tsp: 'tea',
  teaspoon: 'tea',
  小さじ: 'tea',
  // pieces
  p: 'p',
  piece: 'p',
  pieces: 'p',
  個: 'p',
  // pinch
  pinch: 'pinch',
  ひとつまみ: 'pinch',
  少々: 'pinch',
}

export function normalizeAmountType(input: unknown): string {
  if (!input) return 'g'
  const raw = String(input).trim()
  // Try exact match first
  if (mapToCanonical[raw] != null) return mapToCanonical[raw]
  // Lowercase fallback for common english aliases
  const lower = raw.toLowerCase()
  if (mapToCanonical[lower] != null) return mapToCanonical[lower]
  return raw // fallback to original if unknown
}

export function migrateRecipeUnits<T extends { ingredients?: { amountType?: string }[] }>(recipe: T): T {
  if (!recipe?.ingredients) return recipe
  recipe.ingredients.forEach((ing) => {
    // Normalize in place
    ;(ing as any).amountType = normalizeAmountType(ing.amountType)
  })
  return recipe
}

