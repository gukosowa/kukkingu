// Utility to build the ChatGPT import prompt for a recipe URL
// Uses template literals for readability and maintainability

import { getAllTags } from '~src/store/index'

export type LocaleText = 'English' | 'Japanese' | 'German'

export function buildImportRecipePrompt(
  input: { url?: string; text?: string; locale: LocaleText; fromPicture?: boolean }
): string {
  const { url, text, locale, fromPicture } = input
  const ackMap = {
    English: "Understood. Now write anything and I'll try to convert it to the json.",
    German: 'Verstanden. Schreibe jetzt irgendetwas und ich versuche, es in JSON umzuwandeln.',
    Japanese: '了解です。何でも書いてください。JSONに変換してみます。',
  } as const
  const acknowledge = ackMap[locale]
  const unitRules = [
    'Allowed units (choose only from these and use these exact keys in ingredient.amountType): g, ml, tbl (tablespoon), tea (teaspoon), p (piece), pinch.',
  ].join(' ')

  const servingsRule = [
    'Determine the number of servings/persons from the source.',
    'Include this as a top-level "servings" field with the number.',
    'Set both top-level original and desired to this value.',
  ].join(' ')

  const ingredientRules = [
    `For each ingredient: remove any text in brackets/parentheses from the name (e.g., "Onion (chopped)" -> name: "Onion").`,
    `Move removed bracket details and any extra descriptors (e.g., "chopped", "to taste") into the ingredient.note field, in ${locale}.`,
    `Every ingredient must have an amount. If the source has no numeric amount, set amount to 1 pinch and explain the original wording in ingredient.note (in ${locale}).`,
  ].join(' ')

  const noteRules = [
    'The top-level note must be present and non-empty.',
    'Write the note in two parts using bold labels (no Markdown headers):',
    `**Steps**: first, list all cooking steps as a clear numbered list in ${locale}. Important, use newline to separate steps and other text to make readable.`,
    `**Overview**: after the steps, write a concise overview in ${locale} covering the dish description (what it is, cuisine/style, key flavors/ingredients, typical serving/occasion), any assumptions made, details removed from brackets, and any missing/ambiguous amounts.`,
    'Do not use Markdown headings (no #). Use bold labels like **Steps** and **Overview** instead. Lists are allowed.',
    'Do not mention this prompt, ChatGPT, or any app/tool; focus only on the recipe itself.',
  ].join(' ')

  // Get existing tags from database and add suggested tags
  const existingTags = getAllTags()
  const suggestedTags = ['breakfast', 'main', 'dinner', 'pasta', 'rice', 'vegi', 'sweet', 'fast']
  const allAvailableTags = Array.from(new Set([...existingTags, ...suggestedTags])).sort((a, b) => a.localeCompare(b, 'ja'))

  const tagsRule = [
    'Analyze the recipe and assign relevant tags from the available tags list when possible.',
    `Available tags: ${allAvailableTags.join(', ')}`,
    'Prefer existing tags that match the recipe characteristics (meal type, cuisine, ingredients, cooking method, etc.).',
    'You may add new tags if none of the available tags fit well, but try to stay within the available list when possible.',
    'Tags should be lowercase and relevant to the recipe (e.g., meal time, main ingredients, cuisine type, cooking style).',
    'Include 2-5 most relevant tags per recipe.',
    'If the recipe clearly fits multiple categories (e.g., "pasta" and "fast"), include both.',
    `Write tag names in ${locale} when the locale has specific terms for them.`,
  ].join(' ')

  const localeRule = `All text values must be written in ${locale}.`

  const jsonSchema =
    '{"name":"string","edit":true,"original":number,"desired":number,"servings":number,"note":"string","url":"string","tags":["string"],"ingredients":[{"name":"string","amount":number,"amountType":"g|ml|tbl|tea|p|pinch","note":"string"}]}'

  const formattingRule =
    'Return the result as a Markdown fenced code block using four backticks with the `json` language tag (start with ````json and end with ````). The content of the block must be only valid JSON matching the schema. No intro and no outro text, just the JSON.'

  let sourceInstruction = ''
  if (url && !text) {
    sourceInstruction = `Fetch the content of ${url} and extract the recipe from that page into a clean, structured recipe JSON.`
  } else if (!url && text) {
    const safeText = text.trim()
    sourceInstruction = `From the provided recipe text, convert it into a clean, structured recipe JSON. Use only this text:\n\n\`\`\`\n${safeText}\n\`\`\``
  } else if (url && text) {
    const safeText = text.trim()
    sourceInstruction = `Fetch the content of ${url} and extract the recipe from that page. Additionally, here is context about extraction that may help (do not treat this as the source of truth; the web page is primary). If something in the context clarifies ambiguous parts of the page, you may incorporate it and mention any assumptions in the note. Context:\n\n\`\`\`\n${safeText}\n\`\`\``
  } else {
    sourceInstruction = `Remember all the information provided in this conversation. For now, reply only with: "${acknowledge}"`
  }

  // When the user indicates "from picture" and no URL/text is provided, rely on the attached images only
  if (fromPicture && !url && !text) {
    sourceInstruction = 'Extract the recipe information from the attached pictures and convert it into a clean, structured recipe JSON.'
  }

  return `${sourceInstruction} ${localeRule} Follow these strict rules: ${unitRules} ${servingsRule} ${ingredientRules} ${noteRules} ${tagsRule} The JSON must match this exact structure: ${jsonSchema} ${formattingRule}`
}

export function buildAskRecipePrompt(recipe: any, question: string, locale: LocaleText): string {
  const recipeJson = JSON.stringify(recipe, null, 2)

  // Get existing tags from database and add suggested tags
  const existingTags = getAllTags()
  const suggestedTags = ['breakfast', 'main', 'dinner', 'pasta', 'rice', 'vegi', 'sweet', 'fast']
  const allAvailableTags = Array.from(new Set([...existingTags, ...suggestedTags])).sort((a, b) => a.localeCompare(b, 'ja'))

  // Base rules from import prompt
  const unitRules = [
    'Allowed units (choose only from these and use these exact keys in ingredient.amountType): g, ml, tbl (tablespoon), tea (teaspoon), p (piece), pinch.',
  ].join(' ')

  const servingsRule = [
    'Determine the number of servings/persons from the source.',
    'Include this as a top-level "servings" field with the number.',
    'Set both top-level original and desired to this value.',
  ].join(' ')

  const ingredientRules = [
    `For each ingredient: remove any text in brackets/parentheses from the name (e.g., "Onion (chopped)" -> name: "Onion").`,
    `Move removed bracket details and any extra descriptors (e.g., "chopped", "to taste") into the ingredient.note field, in ${locale}.`,
    `Every ingredient must have an amount. If the source has no numeric amount, set amount to 1 pinch and explain the original wording in ingredient.note (in ${locale}).`,
  ].join(' ')

  const noteRules = [
    'The top-level note must be present and non-empty.',
    'Write the note in two parts using bold labels (no Markdown headers):',
    `**Steps**: first, list all cooking steps as a clear numbered list in ${locale}. Important, use newline to separate steps and other text to make readable.`,
    `**Overview**: after the steps, write a concise overview in ${locale} covering the dish description (what it is, cuisine/style, key flavors/ingredients, typical serving/occasion), any assumptions made, details removed from brackets, and any missing/ambiguous amounts.`,
    'Do not use Markdown headings (no #). Use bold labels like **Steps** and **Overview** instead. Lists are allowed.',
    'Do not mention this prompt, ChatGPT, or any app/tool; focus only on the recipe itself.',
  ].join(' ')

  const tagsRule = [
    'Analyze the recipe and assign relevant tags from the available tags list when possible.',
    `Available tags: ${allAvailableTags.join(', ')}`,
    'Prefer existing tags that match the recipe characteristics (meal type, cuisine, ingredients, cooking method, etc.).',
    'You may add new tags if none of the available tags fit well, but try to stay within the available list when possible.',
    'Tags should be lowercase and relevant to the recipe (e.g., meal time, main ingredients, cuisine type, cooking style).',
    'Include 2-5 most relevant tags per recipe.',
    'If the recipe clearly fits multiple categories (e.g., "pasta" and "fast"), include both.',
    `Write tag names in ${locale} when the locale has specific terms for them.`,
  ].join(' ')

  const jsonSchema =
    '{"id":"string","name":"string","edit":true,"original":number,"desired":number,"servings":number,"note":"string","url":"string","tags":["string"],"ingredients":[{"name":"string","amount":number,"amountType":"g|ml|tbl|tea|p|pinch","note":"string"}]}'

  const formattingRule =
    'Return the result as a Markdown fenced code block using four backticks with the `json` language tag (start with ````json and end with ````). The content of the block must be only valid JSON matching the schema. No intro and no outro text, just the JSON.'

  // Only include noteRules when the question is asking for procedure/notes
  const isProcedureQuestion = question.toLowerCase().includes('procedure') || question.toLowerCase().includes('step') || question.toLowerCase().includes('instruction') || question.toLowerCase().includes('cook') || question.toLowerCase().includes('note')
  const rulesForChanges = `${unitRules} ${servingsRule} ${ingredientRules} ${isProcedureQuestion ? noteRules : ''} ${tagsRule} The JSON must match this exact structure: ${jsonSchema} ${formattingRule}`

  return `You are a world-class culinary expert and recipe master.
You are given the following recipe in JSON format:

\`\`\`json
${recipeJson}
\`\`\`

Your task is to carefully analyze the recipe and answer the following question:
"${question}"

CRITICAL guidelines:
- This question is about the recipe shown above.
- ALWAYS follow the user's specific instructions precisely - do not add extra changes or modifications unless explicitly asked.
- PRESERVE the ingredient array order exactly as shown - do NOT resort or reorder ingredients under any circumstances.
- Do NOT change anything in the recipe unless specifically asked to do so - keep all existing content unchanged.
- The JSON template shown below is for REFERENCE only - you should only modify the fields that are specifically requested.
- If the question asks for changes to the recipe itself (such as adding tags, modifying ingredients, changing amounts, updating instructions, or any other format changes), reply ONLY with valid JSON using the exact structure shown below. Do not include any explanatory text - just the JSON.
- For all other questions (general advice, cooking tips, clarifications, etc.), respond in normal text in ${locale}.
- When making recipe changes, follow these strict rules: ${rulesForChanges}
- IMPORTANT: Always include the existing recipe's "id" field in the JSON response to ensure the recipe gets updated instead of creating a new one.

JSON structure for recipe changes: ${jsonSchema}

- Respond only in ${locale} for text answers.
- Be clear, accurate, and concise.
- If relevant, provide helpful cooking tips or clarifications for text answers.`
}
