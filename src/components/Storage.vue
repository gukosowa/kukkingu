<template>
  <div class="flex-grow flex flex-col">
    <ModalConfirm
      v-model:modelValue="showDeleteConfirm"
      :removeName="deleteConfirmName"
      @confirm="remove"
      @cancel="cancelRemove"
    />
    <div class="mb-2 flex items-center">
      <div class="relative flex-1 mx-2">
        <SInput
          ref="filterInputRef"
          class="w-full"
          :inputClass="'pr-8'"
          v-model="filterQuery"
          :placeholder="t('Filter recipes')"
        />
        <button
          v-if="filterQuery"
          @click="clearFilter"
          type="button"
          aria-label="Clear filter"
          :title="t('Clear')"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none whitespace-nowrap"
        >
          <Icon icon="fal fa-times-circle" size="1.1rem" />
        </button>
      </div>
      <Button class="ml-2 flex-shrink" @click="openCreateModal">{{ t('Create') }}</Button>
    </div>

    <!-- Tag Filter Details/Summary -->
    <details class="mb-3 mt-2 mx-2" v-if="allAvailableTags.length > 0">
      <summary class="cursor-pointer text-sm text-gray-600 hover:text-gray-800 select-none">
        <Icon icon="fal fa-tags" size="0.9rem" class="mr-1" />
        {{ t('Available tags') }} ({{ allAvailableTags.length }})
      </summary>
      <div class="mt-2 flex flex-wrap gap-2">
        <span
          v-for="tag in allAvailableTags"
          :key="tag"
          class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 border border-gray-300 text-gray-700 cursor-pointer hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800 transition-colors"
          @click="addTagToSearch(tag)"
          :title="`${t('Click to add to search')} (${tagCounts[tag] || 0} ${t('recipes')})`"
        >
          {{ tag }}
          <span class="ml-1 -mr-1 text-xs text-gray-500 px-1.5 py-0.5 rounded-full">
            {{ tagCounts[tag] || 0 }}
          </span>
        </span>
      </div>
    </details>


    <ModalInput
      v-model="showCreateModal"
      :value="createName"
      :title="t('Create Recipe')"
      :confirmText="t('Create')"
      :cancelText="t('Close')"
      :placeholder="t('Recipe name')"
      @confirm="confirmCreate"
      @cancel="cancelCreate"
    />
    <ModalInput
      v-model="showImportJsonModal"
      :value="importJsonText"
      :title="t('Import JSON')"
      :confirmText="t('Import')"
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

    <TransitionGroup :name="transitionName" tag="div" class="flex-grow" appear>
      <div
        v-for="(item, index) in recipes"
        :key="index"
        v-show="filterMatch(item)"
        :style="transitionName === 'ov' ? staggerStyle(index) : null"
        class="ov-item"
      >
        <div class="flex items-baseline rounded-xl bg-gray-300 px-2 py-2 my-1">
          <div class="flex-grow pr-2">
            <template v-if="item.rename">
              <SInput
                @enter="() => rename(index)"
                :autofocus="true"
                :modelValue="item.name"
                @update="(v:any) => changeName(v, index)"
              />
            </template>
            <template v-else>
              <Button color="pink" @click="open(index)" class="text-[1.1rem] leading-5 tracking-wider !px-2 !text-left">
                {{ item.name }}
              </Button>

              <!-- Tags Section (inside gray container below button) -->
              <div v-if="item.tags && item.tags.length > 0" class="mt-2 flex flex-wrap gap-1">
                <span
                  v-for="tag in [...item.tags].sort((a, b) => a.localeCompare(b))"
                  :key="tag"
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 border-blue-200 border text-blue-800 cursor-pointer hover:bg-blue-200 transition-colors"
                  @click="addTagToSearch(tag)"
                  :title="t('Click to search for this tag')"
                >
                  {{ tag }}
                </span>
              </div>
            </template>
          </div>
          <div class="flex-grow whitespace-nowrap text-right">
            <template v-if="item.rename">
              <i @click="moveDown(index)" class="text-sm cursor-pointer fal fa-arrow-down p-2 text-gray-700 hover:text-gray-900" />
              <i @click="moveUp(index)" class="text-sm cursor-pointer fal fa-arrow-up p-2 text-gray-700 hover:text-gray-900 mr-2" />
              <Button color="red" class="mr-1" :tone="300" @click="() => initRemove(index, item.name)">
                <Icon icon="fal fa-trash-alt" size="1.2rem" />
              </Button>
              <Button color="green" :tone="400" @click="() => rename(index)">
                <Icon icon="fal fa-check" size="1.2rem" />
              </Button>
            </template>
            <template v-else>
              <Button color="text-only" @click="() => initRename(index)">
                <Icon icon="fal fa-pen" size="1rem" />
              </Button>
            </template>
          </div>
        </div>
      </div>
    </TransitionGroup>

    <!-- Moved JSON controls to bottom of overview -->
    <div class="mt-12 grid grid-cols-2 gap-2">
      <Button class="mx-2 flex-1 !text-xs" @click="openImportJson">{{ t('Import JSON') }}</Button>
      <Button class="mx-2 flex-1 !text-xs" @click="chooseFile">{{ t('Export to file') }}</Button>
      <Button class="mx-2 flex-1 !text-xs" @click="loadFile">{{ t('Load from file') }}</Button>
    </div>
    <div
      v-if="toastMessage"
      class="fixed bottom-4 left-1/2 bg-black text-white text-sm px-3 py-2 rounded shadow-lg z-50"
      style="transform: translateX(-50%)"
    >
      {{ toastMessage }}
    </div>
    <Footer />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { t } from '~src/i18n'
import Footer from '~components/Footer.vue'
import { recipes as _recipes, modalStates, globalSearchFilter, getAllTags, sortJapaneseText, uuidv4 } from '~src/store/index'
import { mergeChatGPTRecipe, mergeRecipesByExportedAt, analyzeImportDiff, type ImportDiff } from '~src/services/importExport'
import Button from './Button.vue'
import SInput from './Input.vue'
import { newRecipe } from '~plugins/helper'
import Icon from './Icon.vue'
import ModalConfirm from './ModalConfirm.vue'
import ModalInput from './ModalInput.vue'
import ModalImportDiff from './ModalImportDiff.vue'
import { chooseExportFile, saveExportFile, loadFromFile } from '~src/services/fileExport'

const router = useRouter()
const recipes = computed({
  get: () => [..._recipes.value].sort((a, b) => sortJapaneseText(a.name, b.name)),
  set: (v) => (_recipes.value = v as any)
})
let filterQuery = ref(globalSearchFilter.value)

// Get all available tags, sorted alphabetically
const allAvailableTags = computed(() => getAllTags())

// Get tag counts - how many recipes have each tag
const tagCounts = computed(() => {
  const counts: Record<string, number> = {}

  recipes.value.forEach(recipe => {
    if (recipe.tags) {
      recipe.tags.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1
      })
    }
  })

  return counts
})
const filterInputRef = ref<InstanceType<typeof SInput> | null>(null)
let showCreateModal = ref(false)
let createName = ref('')
let showDeleteConfirm = ref(false)
let deleteConfirmName = ref('')
let deleteIndex = ref<number | null>(null)
let showImportJsonModal = ref(false)
let importJsonText = ref('')
let showImportDiffModal = ref(false)
let importDiff = ref<ImportDiff>({ updates: [], creates: [] })
let parsedImportData: any = null
let toastMessage = ref('')
let toastTimer: number | null = null
const transitionName = ref('ov')

const route = useRoute()

function openCreateModal() {
  createName.value = ''
  showCreateModal.value = true
}
async function confirmCreate(name: string) {
  _recipes.value = await newRecipe((name || '').trim())
  showCreateModal.value = false
  createName.value = ''
}
function cancelCreate() {
  showCreateModal.value = false
  createName.value = ''
}
function filterMatch(item: any) {
  const q = (filterQuery.value || '').toLowerCase().trim()
  if (!q) return true

  // Split search query into multiple terms by spaces
  const searchTerms = q.split(/\s+/).filter(term => term.length > 0)

  // For each search term, check if it matches either the recipe name or any tag
  return searchTerms.every(term => {
    const lowerTerm = term.toLowerCase()

    // Check recipe name (fuzzy search)
    const name = (item?.name || '').toLowerCase()
    if (name.includes(lowerTerm)) return true

    // Check tags (fuzzy search)
    if (item?.tags && Array.isArray(item.tags)) {
      return item.tags.some((tag: string) =>
        tag.toLowerCase().includes(lowerTerm)
      )
    }

    return false
  })
}
function clearFilter() {
  filterQuery.value = ''
  nextTick(() => filterInputRef.value?.focus?.())
}
function addTagToSearch(tag: string) {
  const currentQuery = (filterQuery.value || '').trim()
  if (currentQuery) {
    filterQuery.value = currentQuery + ' ' + tag
  } else {
    filterQuery.value = tag
  }
}
function open(index: number) {
  const recipe = recipes.value[index]
  if (recipe && recipe.id) {
    router.push('/recipe/' + recipe.id)
  } else {
    // Fallback for recipes without ID (shouldn't happen in new code)
    router.push('/recipe/' + index)
  }
}
function initRename(index: number) {
  const copy = [...recipes.value]
  ;(copy[index] as any).rename = true
  recipes.value = copy
}
function changeName(value: any, index: number) {
  const copy = [...recipes.value]
  ;(copy[index] as any).name = value || ''
  recipes.value = copy
}
function rename(index: number) {
  const copy = [...recipes.value]
  if (!(copy[index] as any).name) {
    ;(copy[index] as any).name = '-'
  }
  delete (copy[index] as any).rename
  recipes.value = copy
}
function initRemove(index: number, removeName: string) {
  showDeleteConfirm.value = true
  deleteConfirmName.value = removeName
  deleteIndex.value = index
}
function cancelRemove() {
  showDeleteConfirm.value = false
  deleteIndex.value = null
}
function remove() {
  if (deleteIndex.value == null) return
  const copy = recipes.value.filter((_, i) => i !== deleteIndex.value)
  recipes.value = copy
  cancelRemove()
}
function array_move<T>(array: T[], sourceIndex: number, destinationIndex: number): T[] {
  const smallerIndex = Math.min(sourceIndex, destinationIndex)
  const largerIndex = Math.max(sourceIndex, destinationIndex)

  return [
    ...array.slice(0, smallerIndex),
    ...(sourceIndex < destinationIndex ? array.slice(smallerIndex + 1, largerIndex + 1) : []),
    array[sourceIndex],
    ...(sourceIndex > destinationIndex ? array.slice(smallerIndex, largerIndex) : []),
    ...array.slice(largerIndex + 1),
  ]
}
function moveUp(index: number) {
  const clamp = Math.max(0, index - 1)
  recipes.value = array_move(recipes.value as any, index, clamp) as any
}
function moveDown(index: number) {
  const clamp = Math.min(recipes.value.length - 1, index + 1)
  recipes.value = array_move(recipes.value as any, index, clamp) as any
}




function openImportJson() {
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
  const normalized = { ...recipe }
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

async function chooseFile() {
  await chooseExportFile()
}

async function saveFile() {
  try {
    const res = await saveExportFile()
    showToast(t('Saved to file'))
  } catch (e) {
    console.error('Export failed', e)
    showToast(t('Export failed'))
  }
}

async function loadFile() {
  try {
    await loadFromFile()
    showToast(t('Loaded from file'))
  } catch (e) {
    console.error('Load failed', e)
    showToast(t('Load failed'))
  }
}

function showToast(msg: string) {
  toastMessage.value = msg
  if (toastTimer) {
    clearTimeout(toastTimer as any)
  }
  toastTimer = window.setTimeout(() => {
    toastMessage.value = ''
    toastTimer = null
  }, 2500) as any
}


onMounted(() => {
  // Disable list transitions after initial appear
  window.setTimeout(() => {
    transitionName.value = 'none'
  }, 220)
})

// Watch for global modal state changes
watch(
  () => modalStates.value.showImportJson,
  (newValue) => {
    if (newValue) {
      showImportJsonModal.value = true
      modalStates.value.showImportJson = false // Reset the state
    }
  }
)

// Sync local filter with global search filter
watch(filterQuery, (newValue) => {
  globalSearchFilter.value = newValue
})

watch(globalSearchFilter, (newValue) => {
  if (filterQuery.value !== newValue) {
    filterQuery.value = newValue
  }
})



function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function stripUrlFromText(text: string, url: string) {
  if (!text || !url) return text || ''
  // Remove exact URL occurrence(s), then collapse whitespace
  const cleaned = text.replace(new RegExp(escapeRegExp(url), 'g'), ' ')
  return cleaned.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
}

function extractUrlFromText(text: string): { url: string; text: string } {
  const input = text || ''
  // Match http(s) URLs or bare www.* domains
  const m = input.match(/(https?:\/\/[^\s]+|www\.[^\s]+(?:\.[^\s]+)+)/i)
  if (!m) return { url: '', text: input.trim() }

  // Trim common trailing punctuation from URL match
  const raw = m[0]
  const url = raw.replace(/[),.;!?]+$/, '')
  const without = stripUrlFromText(input, raw)
  return { url, text: without }
}



// Small stagger for enter transitions, clamped to 200ms total
function staggerStyle(i: number) {
  const step = 20 // ms between items
  const delay = Math.min(i * step, 200)
  return { transitionDelay: `${delay}ms` } as any
}
</script>

<style scoped>
/* Overview list enter animation (fade + slight slide down) */
.ov-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
.ov-enter-active {
  transition: opacity 150ms ease-out, transform 150ms ease-out;
}
.ov-enter-to {
  opacity: 1;
  transform: translateY(0);
}

/* Enable move transitions when reordering */
.ov-move {
  transition: transform 150ms ease-out;
}
</style>
