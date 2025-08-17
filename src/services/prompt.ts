// Utility to build the ChatGPT import prompt for a recipe URL
// Uses template literals for readability and maintainability

export type LocaleText = 'English' | 'Japanese'

export function buildImportRecipePrompt(url: string, locale: LocaleText): string {
  const unitRules = [
    'Allowed units (choose only from these and use these exact keys in ingredient.amountType): g, ml, tbl (tablespoon), tea (teaspoon), p (piece), pinch.',
  ].join(' ')

  const ingredientRules = [
    'For each ingredient: remove any text in brackets/parentheses from the name (e.g., "Onion (chopped)" -> name: "Onion").',
    `Move removed bracket details and any extra descriptors (e.g., "chopped", "to taste") into the ingredient.note field, in ${locale}.`,
    `Every ingredient must have an amount. If the source has no numeric amount, set amount to 0 and explain the original wording in ingredient.note (in ${locale}).`,
  ].join(' ')

  const noteRules = [
    'The top-level note must be present and non-empty.',
    'Write the note in two parts using bold labels (no Markdown headers):',
    `**Steps**: first, list all cooking steps as a clear numbered list in ${locale}.`,
    `**Overview**: after the steps, write a concise overview in ${locale} covering the dish description (what it is, cuisine/style, key flavors/ingredients, typical serving/occasion), any assumptions made, details removed from brackets, and any missing/ambiguous amounts.`,
    'Do not use Markdown headings (no #). Use bold labels like **Steps** and **Overview** instead. Lists are allowed.',
    'Do not mention this prompt, ChatGPT, or any app/tool; focus only on the recipe itself.',
  ].join(' ')

  const localeRule = `All text values must be written in ${locale}.`

  const jsonSchema =
    '{"name":"string","edit":true,"original":number,"desired":number,"note":"string","url":"string","ingredients":[{"name":"string","amount":number,"amountType":"g|ml|tbl|tea|p|pinch","note":"string"}]}'

  const formattingRule =
    'Return the result as a Markdown fenced code block using four backticks with the `json` language tag (start with ````json and end with ````). The content of the block must be only valid JSON matching the schema.'

  return `Fetch the content of ${url} and convert it into a clean, structured recipe JSON. ${localeRule} Follow these strict rules: ${unitRules} ${ingredientRules} ${noteRules} The JSON must match this exact structure: ${jsonSchema} ${formattingRule}`
}

