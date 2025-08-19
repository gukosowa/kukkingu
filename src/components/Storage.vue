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
    <ModalNotice
      v-model="showNotice"
      :title="noticeTitle"
      :message="noticeMessage"
      :icon="noticeIcon"
      :okText="noticeOkText"
      @ok="handleNoticeOk"
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
        <div v-if="item.rename" class="flex items-baseline rounded-xl bg-pink-400 px-2 py-2 my-1">
          <div class="flex-grow pr-2">
            <SInput
              @enter="() => rename(index)"
              :autofocus="true"
              :modelValue="item.name"
              @update="(v:any) => changeName(v, index)"
            />
          </div>
          <div class="flex-grow whitespace-nowrap text-right">
            <i @click="moveDown(index)" class="text-sm cursor-pointer fal fa-arrow-down p-2 text-gray-600" />
            <i @click="moveUp(index)" class="text-sm cursor-pointer fal fa-arrow-up p-2 text-gray-600 mr-2" />
            <Button color="red" class="mr-1" :tone="300" @click="() => initRemove(index, item.name)">
              <Icon icon="fal fa-trash-alt" size="1.2rem" />
            </Button>
            <Button color="green" :tone="400" @click="() => rename(index)">
              <Icon icon="fal fa-check" size="1.2rem" />
            </Button>
          </div>
        </div>
        <div
          v-else
          class="flex items-center rounded-xl bg-pink-400 px-2 py-2 my-1 overflow-x-auto md:overflow-visible no-scrollbar"
        >
          <div class="flex items-baseline w-full flex-shrink-0 pr-2 md:w-auto md:flex-1 md:flex-shrink">
            <div
              @click="open(index)"
              class="flex-grow text-[1.1rem] leading-5 tracking-wider px-2 text-left cursor-pointer"
            >
              {{ item.name }}
            </div>
            <i class="fal fa-angle-right text-gray-500 ml-2 flex-none" />
          </div>
          <div class="flex items-center flex-none pl-4">
            <i @click="moveDown(index)" class="text-sm cursor-pointer fal fa-arrow-down p-2 text-gray-600" />
            <i @click="moveUp(index)" class="text-sm cursor-pointer fal fa-arrow-up p-2 text-gray-600 mr-2" />
            <Button color="red" class="mr-1" :tone="300" @click="() => initRemove(index, item.name)">
              <Icon icon="fal fa-trash-alt" size="1.2rem" />
            </Button>
            <i
              @click="() => initRename(index)"
              class="text-sm cursor-pointer fal fa-pen p-2 text-gray-600"
            />
          </div>
        </div>
      </div>
    </TransitionGroup>

    <!-- Moved JSON controls to bottom of overview -->
    <div class="mt-12 grid grid-cols-2 gap-2">
      <Button class="mx-2 flex-1 !text-xs" @click="openImportUrl">{{ t('JSON from URL') }}</Button>
      <Button class="mx-2 flex-1 !text-xs" @click="openImportJson">{{ t('Import JSON') }}</Button>
      <Button class="mx-2 flex-1 !text-xs" @click="chooseFile">{{ t('Save backup') }}</Button>
      <Button class="mx-2 flex-1 !text-xs" @click="loadFile">{{ t('Load from backup') }}</Button>
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
import ModalNotice from './ModalNotice.vue'
import { mergeRecipesByExportedAt } from '~src/services/importExport'
import { chooseExportFile, saveExportFile, loadFromFile } from '~src/services/fileExport'
import { buildImportRecipePrompt } from '~src/services/prompt'
import { openChatGPT } from '~src/services/chatgpt'
import { handlePromptNoticeOk } from '~src/services/notice'

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
let showNotice = ref(false)
let noticeTitle = ref('')
let noticeMessage = ref('')
let noticeIcon = ref('fal fa-info-circle')
let noticeOkText = ref(t('Got it'))
let noticeOkUrl = ref<string | null>(null)

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
  const top = window.scrollY
  recipes.value = array_move(recipes.value as any, index, clamp) as any
  nextTick(() => window.scrollTo({ top }))
}
function moveDown(index: number) {
  const clamp = Math.min(recipes.value.length - 1, index + 1)
  const top = window.scrollY
  recipes.value = array_move(recipes.value as any, index, clamp) as any
  nextTick(() => window.scrollTo({ top }))
}

function openImportUrl() {
  importUrl.value = ''
  importFromPicture.value = false
  showImportUrlModal.value = true
}

// Remove share data (url/text/title) from the route so the modal
// does not auto-open again on refresh after the user acted once.
function clearShareQuery() {
  try {
    const q = { ...(route.query || {}) }
    delete (q as any).url
    delete (q as any).text
    delete (q as any).title
    router.replace({ path: route.path, query: q })
  } catch (_) {
    // noop – best effort to keep UX clean
  }
}

async function confirmImportUrl(payload: { url: string; text: string; fromPicture: boolean }) {
  importUrl.value = payload.url
  importText.value = payload.text
  importFromPicture.value = payload.fromPicture
  showImportUrlModal.value = false
  const locale =
    currentLocale.value === 'jp'
      ? 'Japanese'
      : currentLocale.value === 'de'
      ? 'German'
      : 'English'
  const prompt = buildImportRecipePrompt({
    url: importUrl.value,
    text: importText.value,
    locale,
    fromPicture: importFromPicture.value,
  })

  const url = importUrl.value || ''
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be')

  if (isYouTube) {
    // YouTube flow: always copy + guide to Gemini
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(prompt)
      } else {
        legacyCopyToClipboard(prompt)
      }
    } catch (_) {
      legacyCopyToClipboard(prompt)
    }
    showAppNotice(
      t('Prompt ready'),
      t('We copied the prompt to your clipboard. We are using Gemini because YouTube extraction only works with Gemini. Paste the prompt and send it.'),
      'fal fa-magic',
      t('Goto Gemini'),
      'https://gemini.google.com/'
    )
  } else {
    // Non-YouTube: if prompt fits ?q=, open ChatGPT directly; otherwise fall back to copy + notice
    const copied = await openChatGPT(prompt)
    if (copied) {
      showAppNotice(
        t('Prompt ready'),
        t('We copied the prompt to your clipboard. Paste the prompt and send it.'),
        'fal fa-comments',
        t('Goto ChatGPT'),
        'https://chatgpt.com/'
      )
    }
  }

  // After opening GPT/Gemini, clear inputs so next open starts fresh
  importUrl.value = ''
  importText.value = ''
  importFromPicture.value = false
  // Also clear the share query params to avoid auto-open on refresh
  clearShareQuery()
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
    showAppNotice(
      t('Invalid JSON'),
      t('The pasted text could not be parsed. Paste a single recipe JSON or an exported file, then try again.'),
      'fal fa-exclamation-triangle'
    )
  }
}

function cancelImportUrl() {
  importUrl.value = ''
  importText.value = ''
  importFromPicture.value = false
  showImportUrlModal.value = false
  // Clear share query params so it won't reopen on refresh
  clearShareQuery()
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
    showToast(t('Backup saved'))
  } catch (e) {
    console.error('Export failed', e)
    showAppNotice(
      t('Export failed'),
      t('Could not save the file. Check your browser download permissions or try a different filename.'),
      'fal fa-file-export'
    )
  }
}

async function loadFile() {
  try {
    await loadFromFile()
    showToast(t('Loaded from backup'))
  } catch (e) {
    console.error('Load failed', e)
    showAppNotice(
      t('Load failed'),
      t('Could not read the file. Please select a valid Kukkingu export and try again.'),
      'fal fa-file-import'
    )
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

function showAppNotice(title: string, message: string, icon?: string, okText?: string, okUrl?: string | null) {
  noticeTitle.value = title
  noticeMessage.value = message
  noticeIcon.value = icon || 'fal fa-info-circle'
  noticeOkText.value = okText || t('Got it')
  noticeOkUrl.value = okUrl || null
  showNotice.value = true
}

function handleNoticeOk() {
  handlePromptNoticeOk(noticeOkUrl.value, openImportJson)
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

// When the share modal opens with prefilled data, copy the prompt immediately.
watch(
  () => showImportUrlModal.value,
  async (v) => {
    if (!v) return
    const hasData = !!(importUrl.value || importText.value || importFromPicture.value)
    if (!hasData) return
    const locale =
      currentLocale.value === 'jp' ? 'Japanese' : currentLocale.value === 'de' ? 'German' : 'English'
    const prompt = buildImportRecipePrompt({
      url: importUrl.value,
      text: importText.value,
      locale,
      fromPicture: importFromPicture.value,
    })
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(prompt)
      } else {
        legacyCopyToClipboard(prompt)
      }
    } catch (_) {
      legacyCopyToClipboard(prompt)
    }
  }
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

/* Hide scrollbars in horizontal action reveal */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
