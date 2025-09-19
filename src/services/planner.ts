import { WeeklyPlan, ShoppingListItem, Recipe, Ingredient, DayPlan } from '~src/store/index'
import { recipes } from '~src/store/index'
import { buildImportRecipePrompt } from './prompt'
import { openChatGPT } from './chatgpt'
import { t, currentLocale } from '~src/i18n'

// Helper function to get language name for current locale
function getCurrentLanguageName(): string {
  switch (currentLocale.value) {
    case 'en':
      return t('English')
    case 'de':
      return t('German')
    case 'jp':
      return t('Japanese')
    default:
      return 'English'
  }
}

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
          const parsedAmount = typeof ingredient.amount === 'number'
            ? ingredient.amount
            : parseFloat(ingredient.amount as string) || 0
          const amountToAdd = parsedAmount * multiplier
          const trimmedNote = typeof ingredient.note === 'string' ? ingredient.note.trim() : ''

          if (ingredientMap.has(key)) {
            const existing = ingredientMap.get(key)!
            existing.amount += amountToAdd
            if (!existing.recipes.includes(recipe.id!)) {
              existing.recipes.push(recipe.id!)
            }
            if (trimmedNote) {
              if (!existing.notes) {
                existing.notes = []
              }
              if (!existing.notes.includes(trimmedNote)) {
                existing.notes.push(trimmedNote)
              }
            }
          } else {
            ingredientMap.set(key, {
              name: ingredient.name,
              amount: amountToAdd,
              amountType: ingredient.amountType,
              checked: false,
              recipes: [recipe.id!],
              notes: trimmedNote ? [trimmedNote] : []
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
  servings?: number
  preferences?: string[]
  exclusions?: string[]
  dietaryRestrictions?: string[]
  cuisineTypes?: string[]
  maxRecipesPerDay?: number
  includeSnacks?: boolean
  mealTypes?: string[]
  preferenceText?: string
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

// Generate a more representative plan name
function generatePlanName(
  length: number,
  servings: number,
  mealTypes: string[],
  preferences?: string[],
  exclusions?: string[]
): string {
  const currentLanguage = getCurrentLanguageName()

  // Base structure: duration + meal types
  let nameParts = []

  // Duration (e.g., "7-Day", "Weekly")
  if (length === 7) {
    nameParts.push(t('Weekly'))
  } else if (length === 1) {
    nameParts.push(t('Daily'))
  } else {
    nameParts.push(`${length}-${t('Day')}`)
  }

  // Meal types (e.g., "Lunch & Dinner", "Full Day")
  if (mealTypes.length === 1) {
    nameParts.push(t(mealTypes[0].charAt(0).toUpperCase() + mealTypes[0].slice(1)))
  } else if (mealTypes.length === 2) {
    const mealNames = mealTypes.map(type => t(type.charAt(0).toUpperCase() + type.slice(1)))
    nameParts.push(mealNames.join(' & '))
  } else if (mealTypes.length > 2) {
    nameParts.push(t('Full Day'))
  }

  // Add preferences if available (limit to 2 most relevant)
  if (preferences && preferences.length > 0) {
    const relevantPrefs = preferences.slice(0, 2)
    const prefText = relevantPrefs.map(pref => t(pref) || pref).join(', ')
    nameParts.push(`(${prefText})`)
  }

  // Add servings info if not standard
  if (servings !== 2) {
    nameParts.push(`${servings}x ${t('servings')}`)
  }

  return nameParts.join(' ') + ` - ${currentLanguage}`
}

// Build prompt for meal planning
function buildMealPlanPrompt(recipes: Recipe[], options: {
  length?: number
  servings?: number
  preferences?: string[]
  exclusions?: string[]
  dietaryRestrictions?: string[]
  cuisineTypes?: string[]
  maxRecipesPerDay?: number
  includeSnacks?: boolean
  mealTypes?: string[]
  preferenceText?: string
}): string {
  const recipeSummaries = recipes.map(recipe => ({
    id: recipe.id,
    name: recipe.name,
    ingredients: recipe.ingredients.map(ing => `${ing.amount} ${ing.amountType} ${ing.name}`).join(', '),
    tags: recipe.tags || []
  }))

  const length = options.length || 7
  const servings = options.servings || 2
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
  const currentLanguage = getCurrentLanguageName()

  // Determine plan type based on selected meal types
  const planType = mealTypes.length === 1
    ? `${mealTypes[0]} plan`
    : mealTypes.length === 2
    ? `${mealTypes.join(' and ')} plan`
    : 'meal plan'

  // Generate more representative plan name
  const planName = generatePlanName(length, servings, mealTypes, options.preferences, options.exclusions)

  return `You are a meal planning assistant. Create a balanced ${length}-day ${planType} using ONLY the recipes provided below as the source of truth.

SOURCE OF TRUTH - AVAILABLE RECIPES:
${JSON.stringify(recipeSummaries, null, 2)}

USER PREFERENCES:
- ${preferencesText}
- ${exclusionsText}
- Default servings per recipe: ${servings}
${options.dietaryRestrictions ? `- Dietary restrictions: ${options.dietaryRestrictions.join(', ')}` : ''}
${options.cuisineTypes ? `- Preferred cuisines: ${options.cuisineTypes.join(', ')}` : ''}
${options.preferenceText ? `- Additional preferences: ${options.preferenceText}` : ''}

PLANNING REQUIREMENTS:
1. Create exactly ${length} days of planning (Day 1 through Day ${length})
2. Each day should include: ${mealTypesText}
${options.includeSnacks ? '3. Include snacks as requested' : '3. Focus on main meals'}
4. Use ONLY recipe IDs from the available recipes list above
5. Ensure variety - avoid repeating the same recipe within the same week
6. Consider nutritional balance and meal variety across the plan
7. Prioritize recipes with preferred tags when available
8. Strictly avoid recipes with excluded tags
9. Each recipe plan should specify serving sizes using the default of ${servings} servings per recipe
10. Assign appropriate meal types from the selected options: ${mealTypesText}
11. IMPORTANT: Write all day notes and overall plan notes in ${currentLanguage} (the user's current language)

OUTPUT FORMAT:
Return ONLY a valid JSON object with this exact structure (copy this format exactly):
{
  "name": "${planName}",
  "days": [
    {
      "recipes": [
        {
          "recipeId": "exact-recipe-id-from-list",
          "servings": ${servings},
          "mealType": "breakfast"
        },
        {
          "recipeId": "another-recipe-id",
          "servings": ${servings},
          "mealType": "dinner"
        }
      ],
      "note": "Optional note for the day (write in ${currentLanguage})"
    },
    {
      "recipes": [
        {
          "recipeId": "third-recipe-id",
          "servings": ${servings},
          "mealType": "lunch"
        }
      ],
      "note": "Another optional note (write in ${currentLanguage})"
    }
  ],
  "notes": "Optional overall notes about the plan (write in ${currentLanguage})"
}

IMPORTANT:
- Use recipe IDs exactly as they appear in the SOURCE OF TRUTH - AVAILABLE RECIPES list above
- Each recipeId must be one of the exact IDs from the available recipes
- Each day must include recipes for the selected meal types: ${mealTypesText}
- Use valid meal types: breakfast, lunch, dinner, or snack
- servings should be a number (use default of ${servings})
- JSON must be valid and parseable
- Do not include any text outside the JSON structure
- Do not add extra fields to the JSON structure
- The "days" array must contain exactly ${length} day objects`
}

// Parse GPT response into WeeklyPlan
export function parseMealPlanResponse(response: string, availableRecipes: Recipe[]): WeeklyPlan | null {
  try {
    // Try to extract JSON from response
    let cleanResponse = response.trim()

    // If the response doesn't start with '{', try to find JSON within it
    if (!cleanResponse.startsWith('{')) {
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No valid JSON object found in the AI response')
      }
      cleanResponse = jsonMatch[0]
    }

    const planData = JSON.parse(cleanResponse)

    // Basic validation
    if (!planData.days || !Array.isArray(planData.days)) {
      throw new Error('Invalid plan structure: missing or invalid days array')
    }

    // Create available recipe ID set for fast lookup
    const availableRecipeIds = new Set(availableRecipes.map(r => r.id).filter(Boolean))

    // Validate and fix the plan data
    const plan: WeeklyPlan = {
      id: `auto-${Date.now()}`,
      name: planData.name || t('Auto-Generated Meal Plan'),
      days: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: planData.notes,
      servings: 2 // Default servings for auto-generated plans
    }

    // Process days with enhanced validation
    plan.days = planData.days.map((day: any, dayIndex: number) => {
      const dayRecipes = (day.recipes || []).filter((recipePlan: any) => {
        // Validate recipe exists and has required fields
        const isValid = recipePlan.recipeId &&
                       availableRecipeIds.has(recipePlan.recipeId) &&
                       typeof recipePlan.servings === 'number' &&
                       recipePlan.servings > 0 &&
                       ['breakfast', 'lunch', 'dinner', 'snack'].includes(recipePlan.mealType)

        if (!isValid) {
          console.warn(`Filtering out invalid recipe plan in day ${dayIndex + 1}:`, recipePlan)
        }

        return isValid
      }).map((recipePlan: any) => ({
        recipeId: recipePlan.recipeId,
        servings: Math.max(1, Math.min(10, recipePlan.servings || 2)), // Clamp servings between 1-10
        mealType: recipePlan.mealType || 'dinner'
      }))

      return {
        recipes: dayRecipes,
        note: day.note
      }
    })

    // Final validation - ensure we have at least one day with recipes
    const totalRecipes = plan.days.reduce((sum, day) => sum + day.recipes.length, 0)
    if (totalRecipes === 0) {
      throw new Error('Plan contains no valid recipes')
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
export function importPlanFromJson(jsonString: string, availableRecipes?: Recipe[]): WeeklyPlan | null {
  try {
    // Try to extract JSON from the string if it contains extra text
    let cleanJsonString = jsonString.trim()

    // If the string doesn't start with '{', try to find JSON within it
    if (!cleanJsonString.startsWith('{')) {
      // Look for JSON object pattern using regex
      const jsonMatch = cleanJsonString.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        cleanJsonString = jsonMatch[0]
      } else {
        throw new Error('No valid JSON object found in the provided text')
      }
    }

    const plan = JSON.parse(cleanJsonString)

    // Validate structure
    if (!plan.name || !Array.isArray(plan.days)) {
      throw new Error('Invalid plan structure: missing name or days array')
    }

    // If available recipes are provided, validate recipe IDs
    let availableRecipeIds: Set<string> | null = null
    if (availableRecipes) {
      availableRecipeIds = new Set(availableRecipes.map(r => r.id).filter((id): id is string => Boolean(id)))
    }

    // Process and validate days
    const validatedDays = plan.days.map((day: any, dayIndex: number) => {
      const dayRecipes = (day.recipes || []).filter((recipePlan: any) => {
        // Basic validation
        const hasRequiredFields = recipePlan.recipeId &&
                                 typeof recipePlan.servings === 'number' &&
                                 recipePlan.servings > 0 &&
                                 ['breakfast', 'lunch', 'dinner', 'snack'].includes(recipePlan.mealType)

        // If we have available recipes, also validate recipe exists
        const recipeExists = !availableRecipeIds || availableRecipeIds.has(recipePlan.recipeId)

        if (!hasRequiredFields) {
          console.warn(`Invalid recipe plan in day ${dayIndex + 1}: missing required fields`, recipePlan)
        } else if (!recipeExists) {
          console.warn(`Recipe ID ${recipePlan.recipeId} not found in available recipes for day ${dayIndex + 1}`)
        }

        return hasRequiredFields && recipeExists
      }).map((recipePlan: any) => ({
        recipeId: recipePlan.recipeId,
        servings: Math.max(1, Math.min(10, recipePlan.servings || 2)),
        mealType: recipePlan.mealType || 'dinner'
      }))

      return {
        recipes: dayRecipes,
        note: day.note
      }
    })

    // Create the imported plan object
    return {
      id: plan.id || `imported-${Date.now()}`,
      name: plan.name,
      days: validatedDays,
      createdAt: plan.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: plan.notes
    }

  } catch (error) {
    console.error('Failed to import plan from JSON:', error)
    return null
  }
}
