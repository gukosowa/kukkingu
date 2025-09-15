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
        const multiplier = recipePlan.servings / recipe.original

        recipe.ingredients.forEach(ingredient => {
          const key = `${ingredient.name.toLowerCase()}-${ingredient.amountType}`

          if (ingredientMap.has(key)) {
            const existing = ingredientMap.get(key)!
            existing.amount += (typeof ingredient.amount === 'number' ? ingredient.amount : 0) * multiplier
            if (!existing.recipes.includes(recipe.id!)) {
              existing.recipes.push(recipe.id!)
            }
          } else {
            ingredientMap.set(key, {
              name: ingredient.name,
              amount: (typeof ingredient.amount === 'number' ? ingredient.amount : 0) * multiplier,
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

  return `Please create a balanced ${length}-day meal plan using the available recipes. Consider nutritional balance, variety, and practicality.

Available Recipes:
${JSON.stringify(recipeSummaries, null, 2)}

User Preferences:
- ${preferencesText}
- ${exclusionsText}
${options.dietaryRestrictions ? `- Dietary restrictions: ${options.dietaryRestrictions.join(', ')}` : ''}
${options.cuisineTypes ? `- Preferred cuisines: ${options.cuisineTypes.join(', ')}` : ''}

Requirements:
1. Create exactly ${length} days of meals
2. Each day should have breakfast, lunch, and dinner
${options.includeSnacks ? '3. Include snacks as requested' : '3. Focus on main meals (breakfast, lunch, dinner)'}
4. Ensure variety - don't repeat the same recipe too frequently
5. Consider nutritional balance across the plan
6. Account for practical cooking times and meal variety
7. Prioritize recipes with preferred tags when possible
8. Avoid recipes with excluded tags

Return the plan as a JSON object with this structure:
{
  "name": "Auto-Generated Meal Plan",
  "startDate": "${new Date().toISOString().split('T')[0]}",
  "days": [
    {
      "date": "${new Date().toISOString().split('T')[0]}",
      "recipes": [
        {
          "recipeId": "recipe-id-here",
          "servings": 2,
          "mealType": "breakfast|lunch|dinner|snack"
        }
      ],
      "note": "Optional day note"
    }
  ],
  "notes": "Optional plan notes"
}

Ensure the recipe IDs match exactly from the available recipes list.`
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
      startDate: planData.startDate || new Date().toISOString().split('T')[0],
      days: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: planData.notes
    }

    // Process days
    if (planData.days && Array.isArray(planData.days)) {
      plan.days = planData.days.map((day: any) => ({
        date: day.date,
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
    if (!plan.id || !plan.name || !plan.startDate || !Array.isArray(plan.days)) {
      throw new Error('Invalid plan structure')
    }

    // Ensure required fields
    return {
      id: plan.id,
      name: plan.name,
      startDate: plan.startDate,
      days: plan.days.map((day: any) => ({
        date: day.date,
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
