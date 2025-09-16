import { WeeklyPlan, ShoppingListItem, Recipe, Ingredient } from '~src/store/index'
import { recipes } from '~src/store/index'
import { buildImportRecipePrompt } from './prompt'
import { openChatGPT } from './chatgpt'

// Generate shopping list from a weekly plan
export function generateShoppingList(plan: WeeklyPlan): ShoppingListItem[] {
  const ingredientMap = new Map<string, ShoppingListItem>()

  // Get populated plan with recipe data
  const populatedPlan = getPopulatedPlan(plan)

  populatedPlan.days.forEach(day => {
    day.recipes.forEach(recipePlan => {
      if (recipePlan.recipe) {
        const recipe = recipePlan.recipe

        // Calculate multiplier: plan servings / recipe servings (default to 2 if not specified)
        const recipeServings = recipe.servings || 2
        const multiplier = recipePlan.servings / recipeServings

        recipe.ingredients.forEach(ingredient => {

          const key = `${ingredient.name.toLowerCase()}-${ingredient.amountType}`

          if (ingredientMap.has(key)) {
            const existing = ingredientMap.get(key)!
            existing.amount += (typeof ingredient.amount === 'number' ? ingredient.amount : parseFloat(ingredient.amount as string) || 0) * multiplier
            if (!existing.recipes.includes(recipe.id!)) {
              existing.recipes.push(recipe.id!)
            }
          } else {
            ingredientMap.set(key, {
              name: ingredient.name,
              amount: (typeof ingredient.amount === 'number' ? ingredient.amount : parseFloat(ingredient.amount as string) || 0) * multiplier,
              amountType: ingredient.amountType,
              checked: false,
              recipes: [recipe.id!]
            })
          }
        })
      }
    })
  })

  return Array.from(ingredientMap.values()).sort((a, b) => a.name.localeCompare(b.name))
}

// Helper function to get populated plan (similar to store function)
function getPopulatedPlan(plan: WeeklyPlan): WeeklyPlan {
  const populatedPlan = { ...plan }
  populatedPlan.days = populatedPlan.days.map(day => ({
    ...day,
    recipes: day.recipes.map(recipePlan => ({
      ...recipePlan,
      recipe: recipes.value.find(r => r.id === recipePlan.recipeId)
    }))
  }))
  return populatedPlan
}

// Generate auto meal plan prompt for GPT
export function generateAutoMealPlanPrompt(options: {
  length?: number
  preferences?: string[]
  exclusions?: string[]
  dietaryRestrictions?: string[]
  cuisineTypes?: string[]
  maxRecipesPerDay?: number
  includeSnacks?: boolean
  mealTypes?: string[]
} = {}): string {
  // Get all available recipes
  const availableRecipes = recipes.value.filter(recipe =>
    recipe.id && recipe.ingredients.length > 0
  )

  if (availableRecipes.length === 0) {
    throw new Error('No recipes available for planning')
  }

  // Build prompt for GPT
  return buildMealPlanPrompt(availableRecipes, options)
}

// Build prompt for meal planning
function buildMealPlanPrompt(recipes: Recipe[], options: {
  length?: number
  preferences?: string[]
  exclusions?: string[]
  dietaryRestrictions?: string[]
  cuisineTypes?: string[]
  maxRecipesPerDay?: number
  includeSnacks?: boolean
  mealTypes?: string[]
}): string {
  const recipeSummaries = recipes.map(recipe => ({
    id: recipe.id,
    name: recipe.name,
    ingredients: recipe.ingredients.map(ing => `${ing.amount} ${ing.amountType} ${ing.name}`).join(', '),
    tags: recipe.tags || []
  }))

  const length = options.length || 7
  const preferencesText = options.preferences && options.preferences.length > 0
    ? `Preferred tags: ${options.preferences.join(', ')}`
    : 'No specific preferences'
  const exclusionsText = options.exclusions && options.exclusions.length > 0
    ? `Excluded tags: ${options.exclusions.join(', ')}`
    : 'No exclusions'
  const mealTypes = options.mealTypes && options.mealTypes.length > 0
    ? options.mealTypes
    : ['breakfast', 'lunch', 'dinner']
  const mealTypesText = mealTypes.join(', ')

  return `You are a meal planning assistant. Create a balanced ${length}-day meal plan using ONLY the recipes provided below as the source of truth.

SOURCE OF TRUTH - AVAILABLE RECIPES:
${JSON.stringify(recipeSummaries, null, 2)}

USER PREFERENCES:
- ${preferencesText}
- ${exclusionsText}
${options.dietaryRestrictions ? `- Dietary restrictions: ${options.dietaryRestrictions.join(', ')}` : ''}
${options.cuisineTypes ? `- Preferred cuisines: ${options.cuisineTypes.join(', ')}` : ''}

PLANNING REQUIREMENTS:
1. Create exactly ${length} days of meals (Day 1 through Day ${length})
2. Each day should include: ${mealTypesText}
${options.includeSnacks ? '3. Include snacks as requested' : '3. Focus on main meals'}
4. Use ONLY recipe IDs from the available recipes list above
5. Ensure variety - avoid repeating the same recipe within the same week
6. Consider nutritional balance and meal variety across the plan
7. Prioritize recipes with preferred tags when available
8. Strictly avoid recipes with excluded tags
9. Each recipe plan should specify appropriate serving sizes (typically 2-4 servings)
10. Assign appropriate meal types from the selected options: ${mealTypesText}

OUTPUT FORMAT:
Return ONLY a valid JSON object with this exact structure:
{
  "name": "Auto-Generated Meal Plan",
  "days": [
    {
      "recipes": [
        {
          "recipeId": "exact-recipe-id-from-list",
          "servings": 2,
          "mealType": "breakfast"
        }
      ],
      "note": "Optional note for the day"
    }
  ],
  "notes": "Optional notes about the plan"
}

IMPORTANT:
- Use recipe IDs exactly as they appear in the source list
- Each day must have at least ${mealTypes.length} meal(s): ${mealTypesText}
- JSON must be valid and parseable
- Do not include any text outside the JSON structure`
}

// Parse GPT response into WeeklyPlan
function parseMealPlanResponse(response: string, availableRecipes: Recipe[]): WeeklyPlan | null {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const planData = JSON.parse(jsonMatch[0])

    // Validate and fix the plan data
    const plan: WeeklyPlan = {
      id: `auto-${Date.now()}`,
      name: planData.name || 'Auto-Generated Meal Plan',
      days: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: planData.notes
    }

    // Process days
    if (planData.days && Array.isArray(planData.days)) {
      plan.days = planData.days.map((day: any) => ({
        recipes: (day.recipes || []).filter((recipePlan: any) => {
          // Validate recipe exists
          return availableRecipes.some(r => r.id === recipePlan.recipeId)
        }).map((recipePlan: any) => ({
          recipeId: recipePlan.recipeId,
          servings: recipePlan.servings || 2,
          mealType: recipePlan.mealType || 'dinner'
        })),
        note: day.note
      }))
    }

    return plan
  } catch (error) {
    console.error('Failed to parse meal plan response:', error)
    return null
  }
}

// Export plan to JSON for sharing/importing
export function exportPlanToJson(plan: WeeklyPlan): string {
  return JSON.stringify(plan, null, 2)
}

// Import plan from JSON
export function importPlanFromJson(jsonString: string): WeeklyPlan | null {
  try {
    const plan = JSON.parse(jsonString)

    // Validate structure
    if (!plan.id || !plan.name || !Array.isArray(plan.days)) {
      throw new Error('Invalid plan structure')
    }

    // Ensure required fields
    return {
      id: plan.id,
      name: plan.name,
      days: plan.days.map((day: any) => ({
        recipes: day.recipes || [],
        note: day.note
      })),
      createdAt: plan.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: plan.notes
    }
  } catch (error) {
    console.error('Failed to import plan from JSON:', error)
    return null
  }
}
