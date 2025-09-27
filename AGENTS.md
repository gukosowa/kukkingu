# Repository Guidelines

NEVER WRITE SQL MIGRATIONS, this is done with `npm run db:generate`!

Always ensure all texts are translated correctly, see jp.json, de.json, en.json.

## Project Structure & Module Organization

* `index.html`: Vite entry HTML.
* `src/`: app code (Vue 3 + TS, Tailwind).

    * `components/`: UI components (prefer PascalCase, e.g., `Header.vue`).
    * `router/`: Vue Router setup (`index.ts`).
    * `assets/`: CSS, images; Tailwind under `~css/`.
    * `i18n/`, `services/`, `store/`, `plugins/`: app modules.
* `public/`: static files served as-is.
* Aliases: `~components`, `~assets`, `~css`, `~router`, etc. Example:
  `import Header from '~components/Header.vue'`.

## Build, Test, and Development Commands

* `npm run dev`: start Vite dev server with HMR.
* `npm run build`: production build to `dist/` (sourcemaps enabled).
* `npm run preview`: preview the production build locally.
* **Tests are disabled**: no test runner is configured, and `npm test` should not be used.

## Coding Style & Naming Conventions

* Language: TypeScript (strict) + Vue 3 SFCs (`<script setup lang="ts">`).
* Indentation: 2 spaces; quotes: single; semicolons: none (Prettier).
* Component files: PascalCase `.vue`; utilities/composables in `services/` or `store/`.
* Imports use configured aliases (see `vite.config.js`, `tsconfig.json`).
* Lint/format: ESLint + Prettier. Run your editor integrations before committing.
* Tailwind: prefer utility classes; dynamic bg-* allowed via safelist.

## Testing Guidelines

* **No tests should run**. The project does not include `@web/test-runner` or any test setup.
* Do not add `.test.{js,ts}` files.
* If needed, tests can be reintroduced later, but they are intentionally disabled for now.

## Commit & Pull Request Guidelines

* Use Conventional Commits: `feat:`, `fix:`, `refactor:`, `style:`, etc. Avoid `wip`.
* Keep commits scoped and focused; write imperative subject lines.
* PRs: include a clear description, linked issues, screenshots for UI changes, and a short test plan.
* CI hygiene: ensure `npm run build` passes locally before opening a PR.

## Security & Configuration Tips

* Service worker registers from `/service-worker.js`; verify behavior when changing caching or routes.

## Application Stack

* Build tooling: Vite 5 + `@vitejs/plugin-vue`, TypeScript 5, PostCSS/Tailwind 3, ESLint/Prettier. Source maps enabled for production.
* UI runtime: Vue 3 (script-setup) with Composition API, Vue Router 4 (`createWebHistory`) for routes `/`, `/recipe/:id`, `/planner`.
* Styling: Tailwind utility classes, plus `github-markdown-css` for markdown rendering when needed.
* State & persistence: central reactive store in `src/store/index.ts`, persisted to IndexedDB through `src/services/indexeddb.ts` with localStorage migration helper; uses File System Access API for manual import/export.
* Internationalisation: lightweight dictionary loader in `src/i18n/index.ts` with async locale persistence.
* AI integrations: prompt builders in `src/services/prompt.ts` and GPT/Gemini launcher helpers (`openChatGPT`, clipboard fallbacks); Planner auto-prompt UI feeds those services.
* Device APIs: `navigator.serviceWorker`, `navigator.clipboard`, `navigator.share?` (clipboard focus), `navigator.vibrate`, File System Access pickers, image clipboard paste helpers.
* Assets: recipes stored with optional base64 images, tags, shopping plans; service worker registered only in production.

## Component Overview

* `AmountTypeModal.vue`: dropdown for ingredient units. Emits updates and exposes `focus()`. Used inside `Recipe.vue` ingredient editor.
* `BaseDialog.vue`: shared modal shell with backdrop handling/vibration. Wraps slots for header/content/footer and is reused by all modal components (`Modal*`, `Planner` dialogs, `ShoppingListModal`).
* `Button.vue`: Tailwind-styled button with haptic feedback. Consumed across the app wherever button actions are needed (Header, Storage, Planner, Recipe, etc.).
* `Checkbox.vue`: tactile checkbox for checklist mode, leverages `vibrate`. Used by `Recipe.vue` when in checklist mode.
* `Footer.vue`: footer actions for clearing data and switching locale; embeds `ModalConfirm` and `ModalLocale`. Used by `Recipe.vue` and `Storage.vue` layouts.
* `Header.vue`: top bar showing navigation, active recipe controls, GPT import workflow (`ModalUrlText`, `ModalNotice`). Always rendered by `App.vue`.
* `Icon.vue`: thin wrapper around font-awesome class usage. Embedded anywhere icon markup is required.
* `Input.vue`: reusable text/number input with optional icon slot, focus expose, and select-on-click behavior. Used widely (Header fields, Storage filters, Recipe editor, Planner forms, etc.).
* `ModalAskGpt.vue`: GPT question composer inside `BaseDialog`; optionally triggered from `Recipe.vue`.
* `ModalAutoPlanPrompt.vue`: prompt preview/launcher for planner auto-generation; invoked from `Planner.vue`.
* `ModalConfirm.vue`: yes/no confirm dialog (used for destructive actions in Storage, Footer, Planner, etc.).
* `ModalImportDiff.vue`: diff viewer for recipe imports, orchestrated by `Storage.vue` when merging external JSON.
* `ModalInput.vue`: generic text/textarea modal; used by Storage for creating recipes and importing JSON.
* `ModalLocale.vue`: locale selector dialog triggered by `Footer.vue`.
* `ModalNotice.vue`: informational modal (Header GPT flow).
* `ModalUrlText.vue`: modal for entering URL/text for GPT prompt; used in `Header.vue`.
* `ModeButtonGroup.vue`: three-state button group to switch recipe view/edit/checklist; used inside `Recipe.vue`.
* `Planner.vue`: weekly planner management UI including plan modals, recipe selection, shopping list modal, GPT prompt generation.
* `RecipeDetailsModal.vue`: inline edit modal for plan entries; launched by `Planner.vue`.
* `RecipeSelector.vue`: searchable recipe picker; used by `Planner.vue`.
* `Recipe.vue`: main recipe detail/editor component; renders ingredient lists, notes, mode switching, GPT interactions, image handling.
* `ShoppingListModal.vue`: shows aggregated shopping list for a plan; invoked from `Planner.vue`.
* `Storage.vue`: recipe library overview with filtering, tagging, import/export, and interactions with `Modal*` components. Hosts `Footer` at bottom.
* `TagInput.vue`: chips input for recipe tags; used inside `Recipe.vue`.

## Function Inventory

### src/components

* `AmountTypeModal.vue`
    * `clickType(type)` – apply new unit, emit updates, close menu.
    * `focus()` – open selector if not disabled (exposed to parent).
    * `norm(v)` – normalize units via `normalizeAmountType` for display.
* `BaseDialog.vue`
    * `handleBackdropClick()` – close dialog on backdrop tap with vibration (unless disabled).
* `Button.vue`
    * `handleClick(event)` – vibrate and re-emit click.
* `Checkbox.vue`
    * `toggle()` – vibrate and flip bound boolean, emit both `update:modelValue` and legacy `input`.
* `Footer.vue`
    * `initClearAll()` – show confirmation modal before clearing recipes.
    * `clearAll()` – wipe recipe store.
    * `cancelClearAll()` – hide confirmation.
    * `openLocaleModal()` – show locale selector.
    * `confirmLocale(locale)` – persist locale selection and close modal.
* `Header.vue`
    * `onchange()` – persist desired/original edits back to recipes store.
    * `focusNext()` – focus desired amount field.
    * `blurInput({ el })` – blur on enter submission.
    * `home()` – navigate back or push `/` to return to storage view.
    * `goToOverview()` – push `/` explicitly.
    * `openPlanner()` – navigate to planner route.
    * `openImportUrl()` – reset GPT import fields and show modal.
    * `confirmImportUrl(payload)` – build GPT prompt, launch ChatGPT/Gemini flows, copy prompt, and raise notice modal.
    * `cancelImportUrl()` – reset GPT import modal values.
    * `showAppNotice(title, message, icon?, okText?, okUrl?)` – configure and display notice modal.
    * `handleNoticeOk()` – handle notice acknowledgement and trigger import JSON modal when appropriate.
    * `legacyCopyToClipboard(text)` – fallback copy helper for browsers without async clipboard.
* `Input.vue`
    * `handleInput(e)` – propagate value updates (cast numbers) through emitted events.
    * `onKeyPress(e)` – emit `enter` payload when Return is pressed.
    * `onClick()` – optionally select text when `selectOnClick` is true using a safe RAF workflow.
    * Exposed helper `focus()` (from `defineExpose`) – focus underlying input when invoked.
* `ModalAskGpt.vue`
    * `addQuestion(question)` – append predefined prompt text and focus textarea.
    * `confirm()` – vibrate and emit final question string.
    * `close()` – vibrate, emit cancel, and close dialog.
* `ModalAutoPlanPrompt.vue`
    * `toggleMealType(mealType)` – adjust selected meal types and regenerate prompt.
    * `sendToChatGPT()` – open ChatGPT with prompt and close on success.
    * `copyPrompt()` – copy current prompt to clipboard with fallback textarea trick.
    * `close()` – hide modal.
* `ModalConfirm.vue`
    * `clickYes()` – emit confirm and close.
    * `clickNo()` – emit cancel and close.
* `ModalImportDiff.vue`
    * `handleUpdate()` – emit update-existing action and close.
    * `handleCreateNew()` – emit create-new action and close.
    * `handleAddAsNew()` – emit add-as-new action and close.
    * `handleCancel()` – emit cancel action and close.
    * `close()` – internal helper to hide modal before emitting events.
* `ModalInput.vue`
    * `refocusTextarea()` – keep textarea focused when toggling modal visibility.
    * `handleVisibility()` – reset internal textarea state when modal opens/closes.
    * `confirm()` – emit confirmed text value and close modal.
    * `close()` – hide modal without emitting data.
* `ModalLocale.vue`
    * `confirm(locale)` – emit chosen locale and close.
    * `close()` – hide modal without emitting.
* `ModalNotice.vue`
    * `acknowledge()` – emit ok event.
    * `close()` – close modal without triggering ok.
* `ModalUrlText.vue`
    * `autoResize()` – adjust textarea height to fit content.
    * `confirm()` – emit confirm payload with URL/text/picture flags.
    * `close()` – hide modal.
* `ModeButtonGroup.vue`
    * `setMode(newMode)` – update active mode and emit `mode-change`.
* `Planner.vue`
    * `openCreatePlan()` – open plan editor in create mode.
    * `openEditPlan(plan)` – load existing plan into editor.
    * `addDay()` – append empty day to editable plan.
    * `removeDay(index)` – remove day by index.
    * `savePlan()` – persist plan via store and close modal.
    * `closePlanModal()` – dismiss create/edit modal and reset state.
    * `generateAutoPlan()` – open auto-plan modal with collected options or handle errors.
    * `importPlan(jsonString)` – parse JSON input and persist plan if valid.
    * `deletePlan(planId)` – prompt removal and stage plan for deletion.
    * `confirmDelete()` – run deletion against store, close confirmation.
    * `cancelDelete()` – abort deletion flow.
    * `togglePreference(tag)` – add/remove tag from preferred list for auto-planning.
    * `toggleExclusion(tag)` – add/remove tag from exclusions.
    * `closeAutoPlanModal()` – hide auto-plan prompt modal.
    * `generateShoppingList(plan)` – build shopping list via service and open modal.
    * `formatWeekRange(plan)` – compute formatted date range (if dates exist) for display.
    * `getRecipeName(recipeId)` – resolve recipe name by id from store.
    * `openRecipeSelector(dayIndex)` – open selector for given day.
    * `closeRecipeSelector()` – hide selector.
    * `addRecipeToDay(recipe)` – append selected recipe to active day with default servings.
    * `removeRecipeFromDay(dayIndex, recipeId)` – remove planned recipe.
    * `getExistingRecipeIdsForDay(dayIndex)` – helper for disabling already-chosen recipes.
    * `openRecipeDetailsModal(dayIndex, recipeIndex)` – open per-recipe edit modal.
    * `closeRecipeDetailsModal()` – hide detail modal.
    * `saveRecipeDetails(data)` – persist servings/mealType updates for currently edited plan entry.
    * `getRecipeDetailsForEditing()` – compute payload passed into details modal.
    * `navigateToRecipe(recipeId)` – route to recipe detail view.
* `Recipe.vue`
    * `openAskGpt()` – show GPT question modal.
    * `confirmAskGpt(question)` – build ask prompt, open GPT, and show notice.
    * `norm(type)` – normalize amount type for display.
    * `amount(item)` – compute scaled ingredient amount respecting units and fraction formatting.
    * `unitBefore(type)` – determine if unit label should precede amount.
    * `unitLabel(type)` – translate full unit label via i18n.
    * `clickName(index)` – focus or select ingredient name cell depending on mode.
    * `clickAmount(index)` – focus/select amount cell.
    * `clickAmountType(index)` – focus/select unit cell or open selector.
    * `clickNote(index)` – focus/select note field.
    * `focusNext(index)` – advance focus to next ingredient controls.
    * `addIngredient()` – append blank ingredient row and enter edit mode.
    * `handleAmountTypeChange(newType, index)` – update unit and persist edits.
    * `handleModeChange(newMode)` – switch between view/edit/checklist states.
    * `switchEdit()` – toggle recipe into edit mode.
    * `switchCheck()` – toggle checklist mode.
    * `clearCheck()` – reset all ingredient `checked` flags.
    * `clearNote(index)` – clear individual ingredient note.
    * `doOriginal(index)` – sync ingredient desired amount from original ratio.
    * `handleIngredientClick(index)` – toggle checkmarks when in checklist mode.
    * `setDesiredFromServings()` – copy servings value into desired amount.
    * `setDesiredFromIngredient(index)` – adjust desired amount based on ingredient ratio.
    * `array_move(array, sourceIndex, destinationIndex)` – reorder ingredients immutably.
    * `moveUp(index)` / `moveDown(index)` – shift ingredient position.
    * `deleteIngredient(index)` – remove ingredient from recipe.
    * `saveChange()` – persist overall recipe edits back to store.
    * `showAppNotice(title, message, icon?, okText?)` – show notice modal for GPT flows.
    * `triggerFileInput()` – click hidden image file input.
    * `handleFileSelect(event)` – load selected image, validate, and update recipe image.
    * `handleContentEditableInput(event)` – sync contenteditable notes area to recipe data.
    * `handlePaste(event)` – intercept paste for images and route through clipboard helper.
    * `updateRecipeImage(base64)` – set image data on recipe and persist.
    * `deleteImage()` – remove image from recipe.
    * `openChatGPTTab()` – open ChatGPT in new tab (simple navigation).
    * `searchByTag(tag)` – push search query to storage view via store.
    * `staggerStyle(i)` – compute animation delay per ingredient row.
    * `legacyCopyToClipboard(text)` – fallback copy helper (duplicated for recipe flow).
* `RecipeSelector.vue`
    * `selectRecipe(recipe)` – emit selected recipe back to planner.
* `ShoppingListModal.vue`
    * `close()` – hide modal.
    * `clearAll()` – uncheck every shopping list item and persist.
    * `updateItemChecked(item)` – persist an item’s checked state to store.
    * `toggleItemChecked(item)` – flip local checked status and schedule persistence.
    * `formatAmount(amount)` – present numeric amount with trimming.
    * `getRecipeNames(recipeIds)` – resolve associated recipe names for ingredient tooltip.
* `Storage.vue`
    * `openCreateModal()` – show create recipe dialog.
    * `confirmCreate(name)` – create new recipe via helper and persist to store.
    * `cancelCreate()` – hide create modal.
    * `filterMatch(item)` – determine if recipe passes current search/tag filters.
    * `clearFilter()` – clear search query and refocus input.
    * `addTagToSearch(tag)` – append tag string to search filter and focus input.
    * `open(index)` – route to recipe detail by id.
    * `initRename(index)` – enable rename mode for recipe.
    * `changeName(value, index)` – mutate local recipe name while editing.
    * `rename(index)` – finalize rename by toggling edit flag.
    * `initRemove(index, removeName)` – open delete confirmation for recipe.
    * `cancelRemove()` – hide delete modal and reset state.
    * `remove()` – delete selected recipe from store.
    * `array_move(array, sourceIndex, destinationIndex)` – reorder recipes list.
    * `moveUp(index)` / `moveDown(index)` – reposition recipe within list.
    * `openImportJson()` – open JSON import modal (also toggled from Header via modal state).
    * `confirmImportJson(json)` – parse/normalize import data and show diff modal if needed.
    * `cancelImportJson()` – hide import modal and clear text.
    * `parsePastedJson(input)` – best-effort parse of pasted JSON, extracting embedded URL when needed.
    * `normalizeRecipe(recipe)` – clean up imported recipe structure (ids, unit migration, notes).
    * `handleUpdateExisting()` – apply diff updates to existing recipes.
    * `handleCreateNew()` – import entries as entirely new recipes.
    * `handleAddAsNew()` – duplicate imported recipes regardless of ids.
    * `handleCancelImport()` – close diff modal and clear temp data.
    * `chooseFile()` – open file picker for manual export target.
    * `saveFile()` – request file handle save via `fileExport` service.
    * `loadFile()` – load JSON from chosen file and feed into import pipeline.
    * `showToast(msg)` – temporary toast via DOM custom event.
    * `escapeRegExp(s)` – utility for building safe regex in filter highlight.
    * `stripUrlFromText(text, url)` – remove URL from pasted text to avoid duplication.
    * `extractUrlFromText(text)` – split pasted string into URL + trailing content.
    * `staggerStyle(i)` – computed style for entry animation.
* `TagInput.vue`
    * `calculateDropdownPosition()` – position suggestions dropdown relative to input.
    * `handleFocus()` – show dropdown when input gains focus.
    * `handleInput()` – update query and filter suggestions.
    * `handleKeydown(event)` – keyboard interactions (Enter, Backspace, navigation).
    * `handleBlur()` – hide dropdown after short delay.
    * `addTag(tag)` – append tag if not already present and notify parent.
    * `addTagFromInput()` – convert current query into a tag when valid.
    * `removeTag(tagToRemove)` – remove existing tag and emit update.

### src/i18n

* `t(key)` – translate key for current locale, falling back to key string.
* `setLocale(locale)` – persist and switch locale asynchronously.

### src/plugins

* `newRecipe(name?)` – fetch recipes, derive unique name, return array including new recipe skeleton.
* `dispatchEvent(event, body)` – send DOM `CustomEvent` with payload.
* `newIngredient(name?, amount?, amountType?, note?)` – build ingredient object.

### src/services

* `auth.ts`
    * `getLocalRecipesStringified()` – fetch recipes from IndexedDB and JSON-stringify.
    * `getLocalRecipesArray()` – fetch recipes array from IndexedDB.
    * `ensureRecipesId()` – internal async bootstrap to guarantee ids exist and persist changes.
* `chatgpt.ts`
    * `legacyCopyToClipboard(text)` – textarea-based copy fallback.
    * `openChatGPT(prompt)` – copy prompt to clipboard (async API with fallback) and signal success.
* `fileExport.ts`
    * `chooseExportFile()` – open save picker, store handle, trigger initial save.
    * `saveExportFile()` – write recipes to chosen file handle as JSON (with `exportedAt`).
    * `loadFromFile()` – open file picker, read JSON, and merge/replace recipes in store.
* `importExport.ts`
    * `parseTime(value)` – helper to parse ISO time or return negative infinity on failure.
    * `mergeRecipesByExportedAt(existing, incoming)` – merge arrays preferring newer `exportedAt`.
    * `createTestIngredientDiff()` – build sample diff payload for manual testing/demo.
    * `analyzeImportDiff(existing, incoming)` – classify imports into updates/creates with change descriptions.
    * `getRecipeChanges(existing, incoming)` – compute field + ingredient-level differences (used internally); includes helper arrow `normalizeName(name)` to key ingredients case-insensitively.
    * `mergeChatGPTRecipe(existing, incoming)` – replace or append recipe from GPT import, ensuring servings default.
    * `testSemanticIngredientDiff()` – console harness invoking `createTestIngredientDiff` and logging expectations.
* `indexeddb.ts` (within `IndexedDBService`)
    * `deepCloneSerializable(obj)` – sanitize objects of reactivity functions and Vue internals.
    * `initDB()` – open database, handle upgrades/migrations, ensure stores exist.
    * `getDB()` – lazy initializer returning opened database instance.
    * `getRecipes()` – read all recipes from store.
    * `saveRecipes(recipes)` – write entire recipes array.
    * `getSetting(key, default)` – fetch simple key/value settings.
    * `setSetting(key, value)` – persist setting value.
    * `getDailyPlans()` – fetch stored plans array.
    * `saveDailyPlan(plan)` – upsert plan record.
    * `deleteDailyPlan(planId)` – remove plan by id.
    * `getShoppingList(planId)` – load shopping list tied to plan id.
    * `saveShoppingList(planId, items)` – persist shopping list array.
    * `migrateFromLocalStorage()` – one-time migration from legacy localStorage keys.
    * Exported helpers: `getRecipes`, `saveRecipes`, `getSetting`, `setSetting`, `migrateFromLocalStorage`, `getDailyPlans`, `saveDailyPlan`, `deleteDailyPlan`, `getShoppingList`, `saveShoppingList` reuse instance methods.
    * Standalone helpers: `fileToBase64(file)` (read File as data URL), `isValidImageFile(file)` (type/size guard), `pasteImageFromClipboard(clipboardData?)` (clipboard API integration with fallback iteration).
* `notice.ts`
    * `handlePromptNoticeOk(url, openImportJson)` – open link in new tab and run callback when notice acknowledged.
* `planner.ts`
    * `generateShoppingList(plan)` – aggregate plan ingredient quantities with serving multiplier.
    * `getPopulatedPlan(plan)` – attach full recipe objects onto plan entries.
    * `generateAutoMealPlanPrompt(options)` – build GPT meal-plan prompt using available recipes.
    * `buildMealPlanPrompt(recipes, options)` – shared helper that formats plan prompt text.
    * `parseMealPlanResponse(response, availableRecipes)` – extract JSON from GPT output and validate plan.
    * `exportPlanToJson(plan)` – stringify plan.
    * `importPlanFromJson(jsonString)` – parse JSON into `WeeklyPlan`, validating structure.
* `prompt.ts`
    * `buildImportRecipePrompt({ url, text, locale, fromPicture })` – compose comprehensive GPT import instructions with rules.
    * `buildAskRecipePrompt(recipe, question, locale)` – craft follow-up prompt for modifying/asking about existing recipe JSON.
* `units.ts`
    * `normalizeAmountType(input)` – map human/legacy units to canonical keys.
    * `migrateRecipeUnits(recipe)` – normalize ingredient units in-place.
* `vibrate.ts`
    * `vibrate(duration?)` – safe navigator vibration wrapper.

### src/store

* `initializeRecipes()` – async boot to migrate legacy data, load recipes, inject defaults.
* `updateRecipesToStore(value)` – clean recipe data (normalize units, ensure ids/servings) and persist to IndexedDB.
* `uuidv4()` – crypto-based UUID generator.
* `sortJapaneseText(a, b)` – locale-aware sorter with inner helper `normalize(str)` to fold casing/spaces/full-width chars.
* `getAllTags()` – collect unique tags across recipes (sorted by Japanese comparator).
* `createWeeklyPlan(name, dayLength?)` – build new blank plan, persist, and push to reactive list.
* `updateWeeklyPlan(plan)` – refresh timestamps, persist, and update reactive array.
* `removeWeeklyPlan(planId)` – delete plan from store and backend.
* `getPopulatedPlan(plan)` – attach recipe objects to plan entries (mirrors planner service variant).
* `getShoppingListForPlan(planId)` – fetch persisted shopping list for plan.
* `updateShoppingListItem(planId, item)` – merge or append shopping list item then persist.
* `saveShoppingListForPlan(planId, shoppingList)` – persist entire shopping list array.

## Natural Component Groupings

* Layout components (`App.vue`, `Header.vue`, `Footer.vue`, `Storage.vue`, `Recipe.vue`) compose the primary screens and share `Button`, `Input`, `Icon`.
* Modal ecosystem: `BaseDialog` underpins `Modal*` components, `ShoppingListModal`, and planner dialogs; these are invoked from `Header`, `Storage`, `Planner`, and `Recipe` flows depending on context.
* Planner suite: `Planner.vue` coordinates `ModalAutoPlanPrompt`, `RecipeSelector`, `RecipeDetailsModal`, and `ShoppingListModal`, while relying on store helpers and planner services.
* GPT tools: `Header.vue`, `ModalAskGpt.vue`, `ModalAutoPlanPrompt.vue`, and `Recipe.vue` consume `prompt.ts`, `chatgpt.ts`, and `notice.ts` helpers to manage clipboard-based workflows.
* Data pipelines: `Storage.vue` and `Header.vue` orchestrate import/export via `services/importExport.ts`, `services/fileExport.ts`, `services/auth.ts`, and `plugins/helper.js`.
* Tag utilities: `TagInput.vue` integrates with `Recipe.vue` for editing tags, and global tag metadata flows through `store/index.ts` + `services/prompt.ts` for GPT prompts.

# Netlify

---
description: When writing, testing, running, or deploying code for a Netlify site (also called a Netlify project), you can use the following context for these capabilities: Serverless functions,Edge functions,Netlify Blobs,Netlify Image CDN,Environment variables,Netlify Forms,Creating new sites,Netlify DB,
globs: **/*.{ts,tsx,js,jsx,toml}

---

<ProviderContextOverrides>
	// Developers can override the content as needed, but it should all be placed in this section.


</ProviderContextOverrides>

ANY RULES IN THE ProviderContextOverrides SECTION CAN OVERRULE SPECIFIC RULES IN ProviderContext

<ProviderContext version="1.0" provider="netlify">
## General

- The `.netlify` folder is not for user code. Add it to `.gitignore`.
- Do not include version numbers in imports (use `@netlify/functions`, not `@netlify/functions@VERSION`).
- Never add CORS headers (e.g., `Access-Control-Allow-Origin`) unless explicitly requested by the user.
- Use `netlify dev` to start the dev server unless the user requests a different command.

## Guidelines

- Netlify Blobs: Use for general object/state/data storage.
- Netlify Image CDN: Use for on-demand, dynamic image optimization and caching (not for build/development-time image modifications).
- Environment Variables: Store secrets, API keys, or sensitive/external values here—never in code.

## Local Development Troubleshooting

- If Netlify platform primitives (Blobs, Functions, etc.) aren't working locally, ensure `@netlify/vite-plugin` is installed for Vite-powered projects (or `@netlify/nuxt` for Nuxt), configured, and you're running the framework's dev command directly (e.g., `npm run dev`). This enables full local platform primitives emulation.




### Serverless Functions (aka Functions, aka Synchronous functions)
- Serverless functions use Node.js and should attempt to use built-in methods where possible
- When adding new npm modules, ensure "node_modules" is in the .gitignore
- ALWAYS use the latest format of a function structure.
- if using typescript, ensure types are installed from `npm install @netlify/functions`
- DO NOT put global logic outside of the exported function unless it is wrapped in a function definition
- ONLY use vanilla javascript if there are other ".js" files in the functions directory.
- ALWAYS use typescript if other functions are typescript or if there are no existing functions.
- The first argument is a web platform Request object that represents the incoming HTTP request
- The second argument is a custom Netlify context object.
- Functions have a global `Netlify` object that is also accessible.
    - ONLY use `Netlify.env.*` for interacting with environment variables in code.
- Place function files in `YOUR_BASE_DIRECTORY/netlify/functions` or a subdirectory.
    - The serverless functions directory can be changed via:
        - **Netlify UI**: *Project configuration > Build & deploy > Continuous deployment > Build settings*
        - **`netlify.toml`**:
          ```toml
          [functions]
            directory = "my_functions"
      ```
    - `netlify.toml` settings override UI settings.
- If using a subdirectory, name the entry file `index.mts` or match the subdirectory name.
    - Example valid function paths:
        - `netlify/functions/hello.mts`
        - `netlify/functions/hello/index.mts`
        - `netlify/functions/hello/hello.mts`
- Naming files with `.mts` enables modern ES module syntax

#### Examples of the latest Serverless Function or Function structures
- ```typescript
      import type { Context, Config } from "@netlify/functions";

      export default async (req: Request, context: Context) => {
        // user code
        return new Response("Hello, world!")
      }

      export const config: Config = {
        // use this path instead of /.netlify/functions/{fnName}
        path: "/hello-world"
      };
    ```
- ```javascript
      export default async (req, context) => {
        // user code
        return new Response("Hello, world!")
      }

      export const config = {
      // use this path instead of /.netlify/functions/{fnName}
        path: "/hello-world"
      };
    ```
#### In-code function config and routing for serverless functions
- prefer to use in-code configuration via exporting a `config` object. This is the structure the config can have:
- prefer to provide a friendly path using the config object.
- ONLY serverless functions use `/.netlify/functions/{function_name}` path by default.
- If you set a specific path via this config or the netlify.toml, it will only be available at that new path.
- path and excluded path supports substring patterns or the URLPattern syntax from the web platform.

```
{
  path: string | string[], // Defines the URL path(s) that trigger the function. Can be a single string or an array of paths.
  excludedPath?: string | string[], // Optional. Defines paths that should be excluded from triggering the function.
  preferStatic?: boolean, // Optional. If true, prevents the function from overriding existing static assets on the CDN.
}
```

### Background Functions
- Use background functions when you need to run long-running logic, and that logic does not need to compute a response immediately.
- Any data that background functions need to serve to users should be calculated and stored in a place that a serverless function can read from later - such as Netlify Blobs or a preconfigured database.
- Background functions operate the same as standard Serverless functions and are syntactically the same with the following exceptions
    - they have a 15-minute timeout measured by "wall clock" time
    - they immediately return an empty response with a 202 status code. Return values from these functions are ignored.
    - Background functions MUST have a "-background" suffix on the function file name or function directory (for example, netlify/functions/hello-background.mts or netlify/functions/hello-background/index.mts).

#### Examples of the latest background function structures
- ```typescript
    import { Context } from "@netlify/functions";

    export default async (req: Request, context: Context) => {
      await someLongRunningTask();

      console.log("Done");
    };
  ```

- ```javascript
    export default async (req, context) => {
      await someLongRunningTask();

      console.log("Done");
    };
  ```

### Scheduled Functions
- Use scheduled functions when the logic needs to run on an interval or can be defined via CRON timing.
- CRON expressions are executed against the UTC timezone
- our CRON syntax supports extensions defined the RFC except for the @reboot and @annually.
- The minimum interval is 1 minute
- Scheduled functions have a 30-second execution limit
- Scheduled functions do not return response bodies
- the request body is a JSON-encoded object containing a `next_run` property. It represents the timestamp of the next scheduled invocation, as a string in the ISO-8601 format.
- in addition to in-code config, schedules can be defined in the `netlify.toml`. ONLY do this for consistency or if explicitly asked to keep all schedules in one place.
  ```toml
    [functions."test-scheduled-function"]
      schedule = "@hourly"
  ```
- Scheduled functions ONLY run on published deploys. They don’t run on Deploy Previews or branch deploys.
- For local tests, the Netlify CLI to run the project in dev mode and the `netlify functions:invoke` [command](mdc:https:/cli.netlify.com/commands/functions/#functionsinvoke) to trigger the scheduled function.
  example:
  ```bash
    netlify functions:invoke myfunction
  ```

#### Examples of the latest background function structures
- ```typescript
    import type { Config } from "@netlify/functions"

    export default async (req: Request) => {
        const { next_run } = await req.json()

        console.log("Received event! Next invocation at:", next_run)
    }

    export const config: Config = {
        schedule: "@hourly"
    }

  ```

- ```javascript
    export default async (req) => {
        const { next_run } = await req.json()

        console.log("Received event! Next invocation at:", next_run)
    }

    export const config = {
        schedule: "@hourly"
    }

  ```



### Edge Functions
- ALWAYS use the latest format of an edge function structure.
- **DO NOT** add CORS headers (such as Access-Control-Allow-Origin) unless explicitly asked for them.
- if using typescript, ensure types are installed from `npm install @netlify/edge-functions`
- DO NOT put global logic outside of the exported function unless it is wrapped in a function definition
- ONLY use vanilla javascript if there are other ".js" files in the functions directory.
- ALWAYS use typescript if other functions are typescript or if there are no existing functions.
- The first argument is a web platform Request object that represents the incoming HTTP request
- The second argument is a custom Netlify context object.
- Edge functions have a global `Netlify` object that is also accessible.
    - ONLY use `Netlify.env.*` for interacting with environment variables in code.
- Place function files in `YOUR_BASE_DIRECTORY/netlify/edge-functions` or a subdirectory.
    - The serverless functions director can be changed via`netlify.toml`:
      ```toml
      [build]
        edge_functions = "my-custom-directory"
      ```

- Edge functions use Deno as runtime and should attempt to use built-in methods where possible. See the list of available web APIs to know which built-ins to use.
    - **Module Support**:
        - Supports **Node.js built-in modules**, **Deno modules**, and **npm packages** (beta).
    - **Importing Modules**:
        - **Node.js built-in modules**: Use `node:` prefix (e.g., `import { randomBytes } from "node:crypto"`).
        - **Deno modules**: Use **URL imports** (e.g., `import React from "https://esm.sh/react"` or an **import map**).
        - **npm packages (beta)**: Install via `npm install` and import by package name (e.g., `import _ from "lodash"`).
        - Some npm packages with **native binaries** (e.g., Prisma) or **dynamic imports** (e.g., cowsay) may not work.
    - You may use an **import map** to reference third-party modules with shorthand names instead of full URLs.
    - **Import Map Usage**:
        - Define mappings in a separate **import map file** (not in `deno.json`).
        - The file can be placed anywhere in the project directory.
    - **Example Import Map (`import_map.json`)**:
      ```json
      {
        "imports": {
          "html-rewriter": "https://ghuc.cc/worker-tools/html-rewriter/index.ts"
        }
      }
      ```
    - **Enabling Import Maps**:
        - Declare the import map in `netlify.toml`:
          ```toml
          [functions]
            deno_import_map = "./path/to/your/import_map.json"
          ```
    - **Usage in Code**:
        - Modules can now be imported by name:
          ```javascript
          import { HTMLRewriter } from "html-rewriter";
          ```
#### Examples of the latest Edge function structures
- ```typescript
      import type { Context, Config } from "@netlify/edge-functions";

      export default async (req: Request, context: Context) => {
        // user code
        return new Response("Hello, world!")
      }

      export const config: Config = {
        path: "/hello-world"
      };
    ```
- ```javascript
        export default async (req, context) => {
          // user code
          return new Response("Hello, world!")
        }

        export const config = {
          path: "/hello-world"
        };
    ```

#### Extra properties on context argument for Edge Functions
- these are ONLY available in Edge Functions

```
{
  ...ALL OTHER Context fields/methods,

  next: (options?: { sendConditionalRequest?: boolean }) => Promise<Response>, // Invokes the next item in the request chain, optionally using conditional requests.

  nextRequest: (request: Request, options?: { sendConditionalRequest?: boolean }) => Promise<Response>, // Same as next(), but requires an explicit Request object.
}

```

#### Web APIs available in Edge Functions ONLY
- console.*
- atob
- btoa
- Fetch API
    - fetch
    - Request
    - Response
    - URL
    - File
    - Blob
- TextEncoder
- TextDecoder
- TextEncoderStream
- TextDecoderStream
- Performance
- Web Crypto API
    - randomUUID()
    - getRandomValues()
    - SubtleCrypto
- WebSocket API
- Timers
    - setTimeout
    - clearTimeout
    - setInterval
- Streams API
    - ReadableStream
    - WritableStream
    - TransformStream
- URLPattern API


#### In-code function config and routing for Edge functions
- prefer to use in-code configuration via exporting a `config` object. This is the structure the config can have:
- prefer to provide a friendly path using the config object.
- Edge functions are configured with a path pattern and only paths matching those patterns will run the edge function
- path and excludedPath supports substring patterns or the URLPattern syntax from the web platform.
- unless explicitly asked to modify other properties, only set path, pattern, excludedPath when creating functions.

```
{
  path?: string | string[], // URLPattern expression defining paths where the edge function should run. Must start with '/'.
  excludedPath?: string | string[], // Optional. Defines paths to exclude from execution. Must start with '/'.
  pattern?: RegExp | RegExp[], // Alternative to `path`. Uses regex for path matching.
  excludedPattern?: RegExp | RegExp[], // Optional. Defines regex patterns to exclude certain routes.
  method?: string | string[], // Optional. Specifies HTTP methods that should trigger the function (e.g., "GET", ["POST", "PUT"]).
  onError?: "continue" | "fail" | "fallback", // Optional. Controls how the function handles errors.
  cache?: 'manual', // Optional. Enables response caching if set to 'manual'.
} = {
  path: "", // Default value; should be set per function.
};
```

#### Configuring Edge Functions in netlify.toml
- ONLY Use `netlify.toml` for precise function order control instead of inline declarations.
- DO NOT use `netlify.toml` if there is not edge function ordering requirements.
- When controlling order, it's important to include all edge functions for order control.

- **Declare Edge Functions in `netlify.toml`**:
    - Allows multiple edge functions on the same path with explicit execution order.
    - Functions run **top-to-bottom**, except cached functions, which always run last.

- **Edge Function Properties**:
    - `function`: Name of the edge function.
    - `path`: URL pattern to trigger the function (must start with `/`).
    - `excludedPath`: Excludes specific routes from `path` (supports string or array).
    - `pattern`: Regex-based path matching.
    - `excludedPattern`: Excludes specific regex patterns (single or array).
    - `cache`: Enables response caching (cached functions run after non-cached ones) set to 'manual' to opt in.

- **Netlify.toml config examples**
  ```toml
  [[edge_functions]]
    path = "/admin"
    function = "auth"

  [[edge_functions]]
    path = "/admin"
    function = "injector"
    cache = "manual"

  [[edge_functions]]
    path = "/blog/*"
    function = "auth"

  [[edge_functions]]
    path = "/blog/*"
    function = "rewriter"

  [[edge_functions]]
    pattern = "/products/(.*)"
    excludedPattern = "/products/things/(.*)"
    function = "highlight"

  [[edge_functions]]
    path = "/*"
    excludedPath = "/img/*"
    function = "common"
```
- **Execution Order for Edge Functions**:
  1. **Configuration-based** edge functions (`netlify.toml`) run first.
  2. **Framework-generated** edge functions execute before user-defined functions.
  3. **Non-cached** edge functions execute before cached functions.
  4. **Inline-declared** edge functions override duplicate `netlify.toml` functions.
  5. **Multiple inline edge functions** run alphabetically by filename.

- **Caveats & Special Cases**:
  - If an edge function returns a response, redirects for that path DO NOT occur.
  - Edge functions DO NOT execute for rewritten static routing targets.
  - `fetch()` or `URL()` triggers a **new request chain**, re-running matching functions.
  - Use `context.next()` to continue processing instead of re-triggering functions.
  - Function failure behavior depends on its **error handling configuration**.

#### Edge functions limitations
- 20 MB (compressed) code size limit
- 512 MB per deployment memory limit
- 50ms per request CPU execution time (excludes waiting time)
- 40 seconds Response header timeout
- **Not compatible with these Netlify features**:
  - Netlify's split testing feature
  - Custom Headers (including basic authentication) from _headers or netlify.toml config
  - Netlify prerendering feature on paths served by edge functions
- Be aware that multiple framework adapters may generate conflicting edge functions
- **Restrictions**:
  - Can only rewrite requests to same-site URLs (use `fetch()` for external content)
  - Cached edge functions override existing static files
  - No local caching; HTTP cache headers are ignored in local testing
  - Not included in Netlify’s HIPAA-compliant hosting offering


## Netlify Blobs

- Prefer using Netlify Blobs over creating a new database unless a flat file is not appropriate data layer, if explicitly asking to use a tool, or the dev needs to created relational structures or search that's more appropriate for databases
- Blobs do not require configuration to use, everything is automatically provisions, and devs can simply start using them via any Netlify compute. The API will be the same across all compute types.
- ensure `@netlify/blobs` NPM module is installed
- **Local development troubleshooting**: If you see "The environment has not been configured to use Netlify Blobs. To use it manually, supply the following properties when creating a store: siteID, token" error, install `@netlify/vite-plugin` for Vite-based projects to automatically configure the local environment. This does NOT apply to legacy V1 functions which require manual siteID/token configuration.
- Requirements and limits
  - Requires Fetch API support (Node.js 18+ recommended) - a fetch function can be provided to the store
  - Store names cannot exceed 64 bytes
  - Object keys cannot exceed 600 bytes
  - Maximum object size: 5GB
  - Local development uses a sandboxed store


### Netlify Blobs API

```typescript
  export interface BlobMetadata {
    [key: string]: any;
  }

  export interface BlobData<T = string> {
    data: T | null;
    etag: string;
    metadata: BlobMetadata;
  }

  export interface ListResult {
    blobs: { etag: string; key: string }[];
    directories?: string[];
  }

  interface GetKeyOptions {
    type?: 'arrayBuffer' | 'blob' | 'json' | 'stream' | 'text'
  }

  interface GetKeyAndMetadataOptions {
    type?: 'arrayBuffer' | 'blob' | 'json' | 'stream' | 'text',
    etag?: string;
  }

  // THESE ARE THE ONLY STORE METHODS. DO NOT MAKE UP NEW ONES
  interface Store {

    // Creates or overwrites a blob entry.
    // example: await store.set('key-name', 'contents-of key');
    // - NEVER add metadata unless instructed to.
    set(key: string, value: ArrayBuffer | Blob | string, { metadata?: object }): Promise<void>;

    // Stores a JSON-serializable object.
    // example: await store.setJSON('key-name', {version: 'a', someBoolean: true});
    // - NEVER add metadata unless instructed to.
    setJSON(key: string, value: any, { metadata?: object }): Promise<void>;

    // Retrieves a stored blob.
    // example: await store.get('key-name');
    // - NEVER add the second arg unless you need an explicit type 'arrayBuffer' | 'blob' | 'json' | 'stream' | 'text'.
    // - Instead of using JSON.parse(blob), use store.get('key-name', {type: 'json'})
    // - if the blob is missing, it will resolve the promise with a null value
    get(key: string, getOpt?: GetKeyOptions): Promise<any | null>;

    // Retrieves a blob along with metadata
    // example: await store.getWithMetadata('key-name');
    // - NEVER add the second getOpts arg unless you need an explicit type or have an etag to check against.
    // - AVOID adding it unless it's reliably available but IF an etag is provided, it will only return the blob if the etag is different that what's stored.
    // - if the blob is missing, it will resolve the promise with a null value
    getWithMetadata(key: string, getOpts?: GetKeyAndMetadataOptions): Promise<{ data: any, etag: string, metadata: object } | null>;

    // Retrieves metadata of a blob WITHOUT downloading the data.
    // example: await store.getMetadata('key-name');
    // - NEVER add the second getOpts arg unless you need an explicit type or have an etag to check against.
    // - AVOID adding it unless it's reliably available but IF an etag is provided, it will only return the blob if the etag is different that what's stored.
    // - if the blob is missing, it will resolve the promise with a null value
    getMetadata(key: string, getOpts?: GetKeyAndMetadataOptions): Promise<{ etag: string, metadata: object } | null>;

    // Lists blobs in the store with optional hierarchical browsing.
    // example:
    //      const { blobs } = await store.list()
    //      // blobs === [ { etag: 'etag1', key: 'some-key' }, { etag: 'etag2', key: 'another-key' } ]
    //
    // - NEVER add the options arg unless you need an explicit reduce the searched data.
    //    -- ONLY if you have to reduce searched data, use `prefix: 'some-prefix'` to pull blobs that start with that prefix value. Use `directories: true` to include the full directory path on the `key`
    // - By default, the list() method retrieves all pages, meaning you'll always get the full list of results. This can be slow or memory intensive. To paginate, pass the `paginate: true` in the options to turn the response into an AsyncIterator that allows you to for-of loop through the blobs in the store.
    // - if store path is empty, the blobs will resolve the promise with an empty array
    list(options?: { directories?: boolean, paginate?: boolean. prefix?: string }): Promise<{ blobs: BlobResult[], directories: string[] }> | AsyncIterable<{ blobs: BlobResult[], directories: string[] }>

    // Deletes a blob.
    // example: await store.delete('key-name');
    // - The return value is always resolves to `undefined`, regardless of whether or not there was an object to delete.
    delete(key: string): Promise<void>;
  }

  interface GetDeployStoreOptions extends Partial<ClientOptions> {
    deployID?: string;
    name?: string;
    region?: Region;
  }

  // Returns a store instance for managing blobs. This is global scoped data across all deploys.
  // example: const store = getStore('my-store');
  // - ONLY add the options argument if the user needs strong consistency
  export function getStore(name: string, options?: { consistency?: 'strong' | 'eventual' }): Store;

  // Returns a deploy-specific store instance for managing blobs tied to a deploy.
  // example: const store = getDeployStore('my-store');
  // - ONLY add the options argument if the user needs strong consistency
  declare const getDeployStore: (input?: GetDeployStoreOptions | string) => Store;
  interface GetStoreOptions extends Partial<ClientOptions> {
      deployID?: string;
      name?: string;
  }

  // Lists all stores available on a project.
  // example:
  //    const { stores } = await listStores();
  //      // [ "beauty", "construction" ]
  // - By default, the listStores() method retrieves all pages, meaning you'll always get the full list of results. This can be slow or memory intensive. To paginate, pass the `paginate: true` in the options to turn the response into an AsyncIterator that allows you to for-of loop through the blobs in the store.
  // - DO NOT pass options unless paginating.
  declare function listStores(options?: {
      paginate?: boolean;
  }): Promise<ListStoresResponse> | AsyncIterable<ListStoresResponse>;

  interface ListStoresResponse {
      stores: string[];
      next_cursor?: string;
  }

```

## File-Based Uploads
With file-based uploads, write blobs to deploy-specific stores after the project’s build completes. Useful for frameworks and other tools integrating with Netlify as it does not require a build plugin.

Put files in `.netlify/blobs/deploy/*` for deploy specific
```
.netlify/
├─ blobs/
|  ├─ deploy/
│  |  ├─ beauty/
│  │  |  └─ nails.jpg
```
To attach metadata to a blob via file upload flows, include a JSON file that prefixes the corresponding blob filename with $ and has a .json extension. For example:
```
├─ blobs/
|  ├─ deploy/
│  |  ├─ beauty/
│  │  |  ├─ nails.jpg
│  │  |  └─ $nails.jpg.json
```

## Blob consistency models
- By default, blobs are "eventually consistent" - Fast reads, updates/deletions propagated within 60 seconds.
- To have strong consistency that ensures updates are immediately visible at the cost of slower reads. set the `consistency` field to `'strong'` on the store instantiation.
- There is no concurrency control built in, last write wins. Add object-locking mechanisms if you need concurrency guarantees.

Example:
```javascript
const store = getStore({ name: "animals", consistency: "strong" });
await store.set("dog", "🐶");
const dog = await store.get("dog");
```

## Storage scopes
- blobs can be stored in a deploy-specific scope or at a global scope
- deploy-specific blobs sync with deploys and are removed with deploy deletions. `getDeployStore()` is used to interact with deploy specific stores.
- global scope blobs are not automatically cleaned up and are consistent across all branches. `getStore()` is used for global scope.
- Build plugins and file-based uploads must write to deploy-specific stores.
- ALWAYS When creating logic that saves to global scope, ensure that non-production data does not get stored in these global stores. This keeps production data isolated from test data. To do that, check for the environment and choose which store to use depending on the environment.

#### Examples of blob usage

```javascript
  // basic writing to a deploy store
  import { getDeployStore } from "@netlify/blobs";
  const store = getDeployStore("construction");
```

```javascript
  // basic writing to a global store
  import { getStore } from "@netlify/blobs";
  const store = getStore("construction");
```

```javascript
  // using global store if in production, otherwise use deploy scope store
  import { getStore, getDeployStore } from "@netlify/blobs";

  function getBlobStore(...storeOptions){

    if((Netlify.context?.deploy.context === 'production'){
      return getStore(...storeOptions);
    }

    return getDeployStore(...storeOptions)
  }

  const store = getBlobStore("construction");
```

## Netlify Image CDN
- All Netlify projects have a `/.netlify/images` route supported by their project without any additional enablement.
- Transform images via query parameters in requests to `/.netlify/images`.
- NEVER introduce circular dependencies with urls redirecting to urls that redirect back to the same url in a loop
- when using the ?url={URL} parameter, ensure the url is a URI encoded component.
- Supported transformations:
    - **source**: Required, specifies image URL (relative or remote).
    - **size**: `w` (width) and `h` (height) in pixels.
    - **fit**: Determines how the image is resized (`contain`, `cover`, `fill`).
    - **position**: Cropping alignment (`top`, `bottom`, `left`, `right`, `center`).
    - **format**: Convert to `avif`, `jpg`, `png`, `webp`, `gif`, or `blurhash`.
    - **quality**: Controls lossy format quality (`q`, 1-100, default 75).

### Example transformations
```html
  <!-- get an image hosted on this project and change its size and format -->
  <img src="/.netlify/images?url=/image.jpg&w=100&h=100&fit=cover&fm=webp&q=80" />

  <!-- get an image hosted externally and change its size and format -->
  <img src="/.netlify/images?url=https://example.com/path/to/image&w=40&h=10&fm=jpg&q=80" />
```

### Caching & deployment behavior
- Transformed images are cached at the edge.
- Source images are cached for future transformations.
- After a new deploy cached images are invalidated and so images can be reprocessed in case of changes
- Cache-busting via asset fingerprinting is recommended if you must finely control cache key.
- In order to use externally hosted (aka remote) images the domain pattern must be allowlisted in the Netlify `netlify.toml`.
    - Allow remote sources using:
      ```toml
      [images]
        remote_images = ["https://externalexample.com/.*"]
      ```
        - only absolute urls to external servers need to be in remote_images

### Redirects & Rewrites
- If you do not want to use the default `/.netlify/images` path, a redirect or rewrite can be used to have a different url.
- Define reusable transformation routes in `_redirects` or `netlify.toml` files.
- When doing so, the parameters can remain parameters to pass in or can be statically defined.
- Examples:
    - netlify.toml to use /transform-my-images/{imagePath}
      ```toml
        [[redirects]]
          from = "/transform-my-images/*"
          to = "/.netlify/images?url=/:splat&w=50&h=50"
          status = 200
      ```
    - _redirects to use /transform-all/{...imagePath}
      ```
        /transform-all/* /.netlify/images?url=/:splat&w=50&h=50 200
      ```

### Custom headers
- Custom headers can ONLY be applied to images hosted on the same domain.
- ONLY do this when explicitly asked
- Examples:
    - netlify.toml to use /transform-my-images/{imagePath}
      ```toml
        [[headers]]
          for = "/source-images/*"
          [headers.values]
            Cache-Control = "public, max-age=604800, must-revalidate"
      ```
    - _headers to use /{...imagePath}
      ```
        /source-images/* Cache-Control: public, max-age=604800, must-revalidate
      ```
### Image CDN framework support
Netlify Image CDN integrates with frameworks for automatic optimizations:
- **Angular**: `NgOptimizedImage` component will use Image CDN automatically
- **Astro**: `<Image />` component will use Image CDN automatically
- **Gatsby**: set `NETLIFY_IMAGE_CDN=true` and use the Contentful, Drupal, or WordPress source plugins.
- **Next.js**: set `remotePatterns` in `next.config.js`
- **Nuxt**: `nuxt/image` module will use Image CDN automatically



## Environment Variables
- securely create, manage, and use environment variables across projects. These variables can be set via the UI, CLI, API, or configuration files.
- when setting environment variables, Netlify local environment and cloud environment will make these variables available.
- **Precedence**: `netlify.toml` overrides UI/CLI/API variables, and project-specific variables take precedence over shared ones.

### Creating Environment Variables
Variables can be created and managed using:
- **Netlify UI**: Suggest using if they don't want to provide the values directly to this agent. They can navigate to it via the path "Project configuration > Environment variables".
- **Netlify CLI**: Prefer using this if the agent can run commands. This requires the project to be linked.
- **Netlify Configuration (`netlify.toml`)**: Defines variables at the repository level. ONLY use this for environment variables where the project is not linked yet and the values are not sensitive.

### Netlify CLI Command
- The project must be linked first before the CLI will add variables. See the rules for initializing and linking projects for how to do this.
- Use `env:set` for changes, `env:unset` to delete. `env:import` to import from a dotenv`.env` file.

#### Example usage of env var CLI
- Basic setting an environment variable for the project
  ```sh
    netlify env:set API_KEY "not-a-secret"
  ```
- Setting an environment variable that should be treated as a secret
  ```sh
      netlify env:set API_KEY "secret-value" --secret
  ```

### Example `netlify.toml` Configuration
- Using the netlify.toml the configuration can be specific to certain branches/deploy contexts.
- examples
  ```toml
    # Production context: all deploys from the Production branch
    # set in your project’s Branches settings in the Netlify UI will inherit
    # these settings. You can define environment variables
    # here but we recommend using the Netlify UI for sensitive
    # values to keep them out of your source repository.
    [context.production]
      publish = "output/"
      command = "make publish"
      environment = { NODE_VERSION = "14.15.3" }

    # Here is an example of how to define context-specific
    # environment variables. Be mindful when using this
    # option and avoid committing sensitive values to public
    # source repositories.
    [context.deploy-preview.environment]
      NOT_PRIVATE_ITEM = "not so secret"

    # Branch Deploy context: all deploys that are not from
    # a pull/merge request or from the Production branch
    # will inherit these settings.
    [context.branch-deploy.environment]
      NODE_ENV = "development"

    # Dev context: environment variables set here
    # are available for local development environments
    # run using Netlify Dev. These values can be
    # overwritten on branches that have a more specific
    # branch context configured.
    [context.dev.environment]
      NODE_ENV = "development"

    # Specific branch context: all deploys from
    # this specific branch will inherit these settings.
    [context.staging.environment] # “staging” is a branch name
      NODE_ENV = "development"
  ```

### `.env` File Handling
- Netlify builds do not read `.env` files directly
- Import `.env` variables into Netlify using the UI or CLI (`netlify env:import .env`).
- Export Netlify variables to `.env` files via UI or CLI (`env:list`).

### Export `.env` Variables
```sh
# list the production deploy context values in .env format
netlify env:list --plain --context production

# list the production deploy context values in .env format
# and pipe results into a .env file
netlify env:list --plain --context production > .env
```



## Netlify Forms

If using Netlify Forms, prevent spam submissions with a honeypot field.

# Creating new sites

- do not add redirects to netlify.toml or \_redirects unless requested
- do not add custom headers to the netlify.toml or \_headers unless requested


# Initializing sites or linking them

- determine if a site is linked by checking if `PROJECT_FOLDER/.netlify/state.json` file exists and it has a populated `siteId` value. Note that the siteID appears as the project ID in the Netlify UI at app.netlify.com.
- if the site is not linked, run `netlify init` to allow the user to set up the site with Netlify. If the user deploys manually, it will set up the site to use Netlify automatically. If the user decides to set up a repo, they might have to set up the repo first. If the site is already set up on netlify then run `netlify link` for the user to input the credentials to link.

# Vite and Metaframework Setup

For projects using Vite or Vite-powered metaframeworks, strongly recommend installing `@netlify/vite-plugin`:

```bash
npm install -D @netlify/vite-plugin
```

(or equivalent for whichever package manager the project uses)

Add to the Vite config plugins array. Framework-specific examples:

**Standard Vite (vite.config.js/ts):**

```js
import { defineConfig } from "vite";
import netlify from "@netlify/vite-plugin";

export default defineConfig({
  plugins: [netlify()]
});
```

**Nuxt (nuxt.config.ts):**

For Nuxt projects, use `@netlify/nuxt` module instead:

```bash
npx nuxi module add @netlify/nuxt
```

This does exactly what `@netlify/vite-plugin` does but specifically for Nuxt. It brings the complete Netlify platform directly into your `nuxt dev` server: Functions, Edge Functions, Blobs, Image CDN, headers, redirects, environment variables.

Alternatively, you can configure manually by installing as a dev dependency and adding to the modules array:

```bash
npm install -D @netlify/nuxt
```

```js
export default defineNuxtConfig({
  modules: ["@netlify/nuxt"]
});
```

**SvelteKit (vite.config.js):**

```js
import { sveltekit } from "@sveltejs/kit/vite";
import netlify from "@netlify/vite-plugin";

export default defineConfig({
  plugins: [sveltekit(), netlify()]
});
```

**Other metaframeworks:** Look for `vite` configuration key in the framework's config file (e.g., `astro.config.js`, `remix.config.js`).

With `@netlify/vite-plugin` installed, users can run their regular dev command (`npm run dev`, `yarn dev`, `astro dev`, etc.) instead of `netlify dev`.

Vite-powered frameworks include: Astro, SvelteKit, Nuxt 3+ (use `@netlify/nuxt` module instead), Remix 2.2.0+ (unless using Classic Compiler), SolidStart, TanStack Start, Analog, Qwik City, VitePress.

This does NOT apply to these frameworks (they do not use Vite): Next.js, Gatsby, Angular.

## Netlify DB

- Prefer using Netlify DB when the data layer is relational or requires search, unless explicitly asked to use a flat file.
- Using `@netlify/neon` NPM module is required.
- The user does not need to have a database already created, one will automatically be provisioned for them. They also do not need a Neon account. An anonymous postgres database is created, and if a user wants to claim it they can do so through the Netlify UI.
- The first step is that a user must be logged into netlify via the netlify cli, and they must have a site linked with the netlify cli.
- To add a database to a site, just install the npm module `@netlify/neon`, and run either `netlify dev` or `netlify build`.
- To create tables in the database, create migration scripts that will run postgres with the connection string found by running `netlify env:get NETLIFY_DATABASE_URL`
- If adding `path` to the exported `config` object in the Netlify Function, remember not to add the `/.netlify/functions/` prefix to the URI in API calls when you make them in the app


## Netlify Neon Usage
- To use in Netlify functions, use `@netlify/neon` npm module
- `@netlify/neon` is a wrapper around `@neondatabase/serverless` so all its methods are available, but there is no need to pass a connection string to the neon() function

### Examples of Netlify Neon Usage

```javascript
import { neon } from "@netlify/neon";

const sql = neon();

// query
const users = await sql("SELECT * FROM users");

// insert
await sql("INSERT INTO users (name) VALUES ('John Doe')");

// update
await sql("UPDATE users SET name = 'John Doe' WHERE id = 1");

// delete
await sql("DELETE FROM users WHERE id = 1");

```
</ProviderContext>

NEVER WRITE SQL MIGRATIONS, this is done with `npm run db:generate`!
