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
          class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          <Icon icon="fal fa-times-circle" size="1.1rem" />
        </button>
      </div>
      <Button class="ml-2 flex-shrink" @click="openCreateModal">{{ t('Create') }}</Button>
    </div>



    <ModalUrlText
      v-model="showImportUrlModal"
      :url="importUrl"
      :text="importText"
      :fromPicture="importFromPicture"
      :title="t('JSON from URL')"
      :confirmText="t('Open GPT')"
      :placeholderUrl="t('https://example.com')"
      :placeholderText="t('Recipe text')"
      @confirm="confirmImportUrl"
      @cancel="cancelImportUrl"
    />
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

    <TransitionGroup :name="transitionName" tag="div" class="flex-grow" appear>
      <div
        v-for="(item, index) in recipes"
        :key="index"
        v-show="filterMatch(item?.name)"
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
              <Button color="pink" @click="open(index)" class="text-[1.1rem] leading-5 tracking-wider !px-2">
                {{ item.name }}
              </Button>
            </template>
          </div>
          <div class="flex-grow whitespace-nowrap text-right">
            <template v-if="item.rename">
              <i @click="moveDown(index)" class="text-sm cursor-pointer fal fa-arrow-down p-2 text-gray-600" />
              <i @click="moveUp(index)" class="text-sm cursor-pointer fal fa-arrow-up p-2 text-gray-600 mr-2" />
              <Button color="red" class="mr-1" :tone="300" @click="() => initRemove(index, item.name)">
                <Icon icon="fal fa-trash-alt" size="1.2rem" />
              </Button>
              <Button color="green" :tone="400" @click="() => rename(index)">
                <Icon icon="fal fa-check" size="1.2rem" />
              </Button>
            </template>
            <template v-else>
              <Button color="gray" :tone="400" @click="() => initRename(index)">
                <Icon icon="fal fa-pen" size="1.2rem" />
              </Button>
            </template>
          </div>
        </div>
      </div>
    </TransitionGroup>

    <!-- Moved JSON controls to bottom of overview -->
    <div class="mt-12 grid grid-cols-2 gap-2">
      <Button class="mx-2 flex-1 !text-xs" @click="openImportUrl">{{ t('JSON from URL') }}</Button>
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
import { t, currentLocale } from '~src/i18n'
import Footer from '~components/Footer.vue'
import { recipes as _recipes } from '~src/store/index'
import Button from './Button.vue'
import SInput from './Input.vue'
import { newRecipe } from '~plugins/helper'
import Icon from './Icon.vue'
import ModalConfirm from './ModalConfirm.vue'
import ModalInput from './ModalInput.vue'
import ModalUrlText from './ModalUrlText.vue'
import { mergeRecipesByExportedAt } from '~src/services/importExport'
import { chooseExportFile, saveExportFile, loadFromFile } from '~src/services/fileExport'
import { buildImportRecipePrompt } from '~src/services/prompt'
import { openChatGPT } from '~src/services/chatgpt'

const router = useRouter()
const recipes = computed({ get: () => _recipes.value, set: (v) => (_recipes.value = v as any) })
let filterQuery = ref('')
const filterInputRef = ref<InstanceType<typeof SInput> | null>(null)
let showCreateModal = ref(false)
let createName = ref('')
let showDeleteConfirm = ref(false)
let deleteConfirmName = ref('')
let deleteIndex = ref<number | null>(null)
let showImportUrlModal = ref(false)
let showImportJsonModal = ref(false)
let importUrl = ref('')
let importText = ref('')
let importFromPicture = ref(false)
let importJsonText = ref('')
let toastMessage = ref('')
let toastTimer: number | null = null
const transitionName = ref('ov')

const route = useRoute()

function openCreateModal() {
  createName.value = ''
  showCreateModal.value = true
}
function confirmCreate(name: string) {
  _recipes.value = newRecipe((name || '').trim())
  showCreateModal.value = false
  createName.value = ''
}
function cancelCreate() {
  showCreateModal.value = false
  createName.value = ''
}
function filterMatch(name: string | undefined) {
  const q = (filterQuery.value || '').toLowerCase().trim()
  if (!q) return true
  const n = (name || '').toLowerCase()
  return n.includes(q)
}
function clearFilter() {
  filterQuery.value = ''
  nextTick(() => filterInputRef.value?.focus?.())
}
function open(index: number) {
  router.push('/recipe/' + index)
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

function openImportUrl() {
  importUrl.value = ''
  importFromPicture.value = false
  showImportUrlModal.value = true
}

async function confirmImportUrl(payload: { url: string; text: string; fromPicture: boolean }) {
  importUrl.value = payload.url
  importText.value = payload.text
  importFromPicture.value = payload.fromPicture
  showImportUrlModal.value = false
  const locale = currentLocale.value === 'jp' ? 'Japanese' : 'English'
  const prompt = buildImportRecipePrompt({
    url: importUrl.value,
    text: importText.value,
    locale,
    fromPicture: importFromPicture.value,
  })

  const url = importUrl.value || ''
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    // Gemini does not support passing query params; copy prompt to clipboard (legacy exec)
    legacyCopyToClipboard(prompt)
    showToast(t('Prompt copied. Opening Gemini...'))
    window.open('https://gemini.google.com/', '_blank')
  } else {
    const copied = await openChatGPT(prompt)
    if (copied) {
      showToast(t('Prompt copied. Opening ChatGPT...'))
      window.open('https://chatgpt.com/', '_blank')
    }
  }
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
    // If an exported file (array) is pasted, merge by id using exportedAt
    if (Array.isArray(parsed)) {
      recipes.value = mergeRecipesByExportedAt(recipes.value as any, parsed as any) as any
      return
    }
    // Single recipe: ensure minimal shape expected by the app
    const single: any = parsed
    if (!single.edit) single.edit = true
    if (!Array.isArray(single.ingredients)) single.ingredients = []
    single.ingredients = single.ingredients.map((ing: any) => ({
      name: ing?.name ?? '',
      amount: typeof ing?.amount === 'number' ? ing.amount : 0,
      amountType: ing?.amountType ?? 'g',
      note: ing?.note ?? '',
    }))
    // If id present, merge; otherwise append
    if (single.id) {
      recipes.value = mergeRecipesByExportedAt(recipes.value as any, [single] as any) as any
    } else {
      recipes.value = [...recipes.value, single]
    }
  } catch (e) {
    alert(t('Invalid JSON'))
  }
}

function cancelImportUrl() {
  importUrl.value = ''
  importText.value = ''
  importFromPicture.value = false
  showImportUrlModal.value = false
}

function cancelImportJson() {
  importJsonText.value = ''
  showImportJsonModal.value = false
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

async function chooseFile() {
  await chooseExportFile()
}

async function saveFile() {
  try {
    const res = await saveExportFile()
    showToast(t('Saved to file'))
  } catch (e) {
    console.error('Export failed', e)
    alert(t('Export failed'))
  }
}

async function loadFile() {
  try {
    await loadFromFile()
    showToast(t('Loaded from file'))
  } catch (e) {
    console.error('Load failed', e)
    alert(t('Load failed'))
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
  // Handle Web Share Target (GET) params on first load
  handleSharedFromQuery()
  // Disable list transitions after initial appear
  window.setTimeout(() => {
    transitionName.value = 'none'
  }, 220)
})

// Also handle subsequent shares when app is already open
watch(
  () => route.query,
  () => handleSharedFromQuery(),
)

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

function handleSharedFromQuery() {
  const q: any = route.query || {}
  const sharedUrl = typeof q.url === 'string' ? q.url : ''
  const sharedText = typeof q.text === 'string' ? q.text : ''
  const sharedTitle = typeof q.title === 'string' ? q.title : ''
  const combinedText = [sharedTitle, sharedText].filter(Boolean).join('\n')

  let finalUrl = sharedUrl || ''
  let finalText = combinedText

  if (!finalUrl) {
    const extracted = extractUrlFromText(combinedText)
    finalUrl = extracted.url
    finalText = extracted.text
  } else {
    // If URL is present separately, strip it from the combined text to avoid duplication
    finalText = stripUrlFromText(combinedText, finalUrl)
  }

  if (finalUrl || finalText) {
    importUrl.value = finalUrl
    importText.value = finalText
    importFromPicture.value = false
    showImportUrlModal.value = true
  }
}

// Legacy clipboard copy using document.execCommand('copy') for wider compatibility
function legacyCopyToClipboard(text: string) {
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'absolute'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  } catch (e) {
    // Best-effort fallback: leave text selected for manual copy
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      showToast(t('Copy failed. Please copy manually.'))
    } catch (_) {
      // no-op
    }
  }
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
