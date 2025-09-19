<template>
  <ModalLocale
    v-model:modelValue="showLocaleModal"
    :locale="currentLocale"
    @confirm="confirmLocale"
  />
  <ModalBackup
    v-model:modelValue="showBackupModal"
    @export="handleExport"
    @load="handleLoad"
  />
  <ModalManageTags
    v-model:modelValue="showManageTagsModal"
  />
  <ModalAskGptStorage
    v-model:modelValue="showAskGptModal"
    @confirm="handleAskGptConfirm"
  />
  <ModalPromptReady
    v-model="showPromptReadyModal"
    :gotoUrl="promptReadyGotoUrl"
    @goToAI="handlePromptReadyGoToAI"
  />
  <ModalInput
    v-model="showImportJsonModal"
    :value="importJsonText"
    :title="t('Import JSON')"
    :confirmText="t('Import')"
    :cancelText="t('Close')"
    :placeholder="t('Paste JSON')"
    :multiline="true"
    @confirm="confirmImportJson"
    @cancel="cancelImportJson"
  />
  <ModalImportDiff
    v-model="showImportDiffModal"
    :diff="importDiff"
    @update-existing="handleUpdateExisting"
    @create-new="handleCreateNew"
    @add-as-new="handleAddAsNew"
    @cancel="handleCancelImport"
  />

  <footer class="z-10 flex-shrink px-2 mt-16 pb-6 text-gray-500 text-sm flex flex-col w-full items-end">
    <div class="h-8 flex items-center w-full">
      <div class="w-full text-xs flex items-baseline">
        <div class="flex-grow flex ">
          <div class="flex-shrink flex flex-wrap justify-end space-x-3 gap-2">
            <div class="text-sm text-right cursor-pointer whitespace-nowrap" @click="openAskGptModal">
              <i class="fas fa-magic mr-1" />
              {{ t('Ask GPT') }}
            </div>
            <div class="text-sm text-right cursor-pointer whitespace-nowrap" @click="openImportJsonModal">
              <i class="fas fa-file-import mr-1" />
              {{ t('Import JSON') }}
            </div>
            <div class="text-sm text-right cursor-pointer whitespace-nowrap" @click="openManageTagsModal">
              <i class="fas fa-tags mr-1" />
              {{ t('Manage Tags') }}
            </div>
            <div class="text-sm text-right cursor-pointer whitespace-nowrap" @click="openBackupModal">
              <i class="fas fa-database mr-1" />
              {{ t('Backup') }}
            </div>
            <div class="text-sm text-right cursor-pointer whitespace-nowrap" @click="openLocaleModal">
              <i class="fas fa-globe mr-1" />
              {{ currentLocale.toUpperCase() }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import ModalLocale from '~components/ModalLocale.vue'
import ModalBackup from '~components/ModalBackup.vue'
import ModalManageTags from '~components/ModalManageTags.vue'
import ModalAskGptStorage from '~components/ModalAskGptStorage.vue'
import ModalPromptReady from '~components/ModalPromptReady.vue'
import ModalInput from '~components/ModalInput.vue'
import ModalImportDiff from '~components/ModalImportDiff.vue'
import { recipes } from '~src/store/index'
import { currentLocale as _current, defaultLocale, setLocale, t } from '~src/i18n'
import { mergeChatGPTRecipe, mergeRecipesByExportedAt, analyzeImportDiff, type ImportDiff } from '~src/services/importExport'
import { uuidv4 } from '~src/store/index'

interface Emits {
  (e: 'export'): void
  (e: 'load'): void
}

const emit = defineEmits<Emits>()

const currentLocale = computed(() => _current.value)
let showLocaleModal = ref(false)
let showBackupModal = ref(false)
let showManageTagsModal = ref(false)
let showAskGptModal = ref(false)
let showPromptReadyModal = ref(false)
let showImportJsonModal = ref(false)
let importJsonText = ref('')
let showImportDiffModal = ref(false)
let importDiff = ref<ImportDiff>({ updates: [], creates: [] })
let parsedImportData: any = null
const promptReadyGotoUrl = 'https://chat.openai.com'

// Locale is now loaded asynchronously in i18n/index.ts

function openAskGptModal() {
  showAskGptModal.value = true
}
function handleAskGptConfirm(_question: string) {
  // The modal already copies the prompt; now guide the user with the prompt-ready dialog
  showPromptReadyModal.value = true
}
function handlePromptReadyGoToAI() {
  window.open(promptReadyGotoUrl, '_blank', 'noopener')
}
function openManageTagsModal() {
  showManageTagsModal.value = true
}
function openBackupModal() {
  showBackupModal.value = true
}
function handleExport() {
  emit('export')
}
function handleLoad() {
  emit('load')
}
function openLocaleModal() {
  showLocaleModal.value = true
}
async function confirmLocale(locale: string) {
  await setLocale(locale as any)
  showLocaleModal.value = false
}

function openImportJsonModal() {
  importJsonText.value = ''
  showImportJsonModal.value = true
}

function confirmImportJson(json: string) {
  showImportJsonModal.value = false
  try {
    const parsed = parsePastedJson(json)
    if (!parsed) throw new Error('No JSON found')

    parsedImportData = parsed

    if (Array.isArray(parsed)) {
      // Analyze diff for array of recipes
      const normalizedRecipes = parsed.map((recipe: any) => normalizeRecipe(recipe))
      importDiff.value = analyzeImportDiff(recipes.value as any, normalizedRecipes)
      showImportDiffModal.value = true
      return
    }

    // Single recipe: ensure minimal shape expected by the app
    const single: any = normalizeRecipe(parsed)
    // For single recipe, show simple diff or direct import
    if (single.id && recipes.value.some((r: any) => r.id === single.id)) {
      // This is an update - show diff
      importDiff.value = analyzeImportDiff(recipes.value as any, [single])
      showImportDiffModal.value = true
    } else {
      // This is a new recipe - import directly
      recipes.value = mergeChatGPTRecipe(recipes.value as any, single) as any
      showToast(t('Recipe imported'))
    }
  } catch (e) {
    showToast(t('Invalid JSON'))
  }
}

function cancelImportJson() {
  importJsonText.value = ''
  showImportJsonModal.value = false
  parsedImportData = null
  importDiff.value = { updates: [], creates: [] }
}

function parsePastedJson(input: string): any | null {
  const text = (input || '').trim()
  // Try to extract from fenced code block with 3 or 4 backticks
  const fenceMatch = text.match(/\n?`{3,4}json\s*\n([\s\S]*?)\n`{3,4}\s*$/i) || text.match(/\n?`{3,4}\s*\n([\s\S]*?)\n`{3,4}\s*$/)
  const jsonText = (fenceMatch ? fenceMatch[1] : text).trim()
  try {
    return JSON.parse(jsonText)
  } catch (_) {
    return null
  }
}

function normalizeRecipe(recipe: any): any {
  // Create a copy without the image field to ignore images during import
  const { image, ...recipeWithoutImage } = recipe
  const normalized = { ...recipeWithoutImage }
  if (!normalized.edit) normalized.edit = true
  if (!Array.isArray(normalized.ingredients)) normalized.ingredients = []
  normalized.ingredients = normalized.ingredients.map((ing: any) => ({
    name: ing?.name ?? '',
    amount: typeof ing?.amount === 'number' ? ing.amount : 0,
    amountType: ing?.amountType ?? 'g',
    note: ing?.note ?? '',
  }))
  return normalized
}

function handleUpdateExisting() {
  if (!parsedImportData) return

  if (Array.isArray(parsedImportData)) {
    const normalizedRecipes = parsedImportData.map((recipe: any) => normalizeRecipe(recipe))
    // Ensure servings field exists with default value
    const recipesWithServings = normalizedRecipes.map((recipe: any) => ({
      ...recipe,
      servings: recipe.servings !== undefined ? recipe.servings : 2
    }))
    recipes.value = mergeRecipesByExportedAt(recipes.value as any, recipesWithServings) as any
    showToast(t('Recipes updated'))
  } else {
    const single = normalizeRecipe(parsedImportData)
    recipes.value = mergeChatGPTRecipe(recipes.value as any, single) as any
    showToast(t('Recipe updated'))
  }
}

function handleCreateNew() {
  if (!parsedImportData) return

  if (Array.isArray(parsedImportData)) {
    const normalizedRecipes = parsedImportData.map((recipe: any) => normalizeRecipe(recipe))
    // Ensure servings field exists with default value
    const recipesWithServings = normalizedRecipes.map((recipe: any) => ({
      ...recipe,
      servings: recipe.servings !== undefined ? recipe.servings : 2
    }))
    // Only add new recipes, ignore updates
    const newRecipes = recipesWithServings.filter((incoming: any) =>
      !incoming.id || !recipes.value.some((existing: any) => existing.id === incoming.id)
    )
    recipes.value = [...recipes.value, ...newRecipes] as any
    showToast(`${newRecipes.length} ${t('recipes')} ${t('created')}`)
  } else {
    const single = normalizeRecipe(parsedImportData)
    // Ensure servings field exists with default value
    const recipeWithServing = {
      ...single,
      servings: single.servings !== undefined ? single.servings : 2
    }
    if (!recipeWithServing.id || !recipes.value.some((r: any) => r.id === recipeWithServing.id)) {
      recipes.value = [...recipes.value, recipeWithServing] as any
      showToast(t('Recipe created'))
    }
  }
}

function handleAddAsNew() {
  if (!parsedImportData) return

  if (Array.isArray(parsedImportData)) {
    const normalizedRecipes = parsedImportData.map((recipe: any) => ({
      ...normalizeRecipe(recipe),
      id: uuidv4() // Generate new unique ID
    }))
    // Ensure servings field exists with default value
    const recipesWithServings = normalizedRecipes.map((recipe: any) => ({
      ...recipe,
      servings: recipe.servings !== undefined ? recipe.servings : 2
    }))
    recipes.value = [...recipes.value, ...recipesWithServings] as any
    showToast(`${recipesWithServings.length} ${t('recipes')} ${t('added as new')}`)
  } else {
    const newRecipe = {
      ...normalizeRecipe(parsedImportData),
      id: uuidv4() // Generate new unique ID
    }
    // Ensure servings field exists with default value
    const recipeWithServing = {
      ...newRecipe,
      servings: newRecipe.servings !== undefined ? newRecipe.servings : 2
    }
    recipes.value = [...recipes.value, recipeWithServing] as any
    showToast(t('Recipe added as new'))
  }
}

function handleCancelImport() {
  parsedImportData = null
  importDiff.value = { updates: [], creates: [] }
}

function showToast(msg: string) {
  // Simple toast implementation - you might want to use a more sophisticated toast system
  console.log('Toast:', msg)
  // For now, we'll just log the message since the original toast implementation
  // was tied to the Storage component. You may want to implement a global toast system.
}
</script>
