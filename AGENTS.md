# Repository Guidelines

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
