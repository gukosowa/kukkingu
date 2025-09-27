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
          @enter="blurFilterInput"
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
      <summary class="cursor-pointer text-sm text-gray-600 hover:text-gray-800 select-none flex items-center justify-between">
        <span class="flex items-center">
          <Icon icon="fal fa-tags" size="0.9rem" class="mr-1" />
          {{ t('Available tags') }} ({{ allAvailableTags.length }})
        </span>
      </summary>
      <div class="mt-2 flex flex-wrap gap-2">
        <span
          v-for="tag in allAvailableTags"
          :key="tag"
          :class="[
            'inline-flex items-center px-3 py-1 rounded-full text-sm cursor-pointer transition-colors',
            isTagHighlighted(tag)
              ? 'bg-yellow-200 border border-yellow-300 text-yellow-900 font-medium'
              : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800'
          ]"
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
    <ModalManageImage
      v-model="showImageModal"
      :recipe="selectedRecipe"
      @save="saveImageSettings"
    />
    <ModalImageZoom v-model="showZoomModal" :imageSrc="zoomImageSrc" />

    <TransitionGroup :name="transitionName" tag="div" class="flex-grow" appear>
      <div
        v-for="(item, index) in recipes"
        :key="index"
        v-show="filterMatch(item)"
        :style="transitionName === 'ov' ? staggerStyle(index) : null"
        class="ov-item"
      >
        <div
          class="relative flex items-baseline rounded-xl px-2 py-2 my-1"
          :class="[
            item.showAsBackground && item.image ? 'overflow-hidden' : 'bg-gray-300'
          ]"
          :style="item.showAsBackground && item.image ? computeBackgroundStyle(item) : {}"
        >
          <!-- Background overlay for text readability -->
          <div
            v-if="item.showAsBackground && item.image"
            class="absolute inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm rounded-xl"
          ></div>
          <!-- Right-side non-blocking square thumbnail -->
          <button
            v-if="item.image"
            type="button"
            class="absolute right-0 top-1/2 -translate-y-1/2 w-14 h-14 rounded-lg overflow-hidden border border-white/40 shadow z-0"
            :class="{'right-2': !isBulkEditMode}"
            :style="thumbButtonStyle(item)"
            @click.stop="!isBulkEditMode ? openZoom(item) : openImageModal(index)"
            aria-label="Open image"
          ></button>

          <div class="flex-grow pr-2 relative z-10">
            <template v-if="isBulkEditMode">
              <SInput
                @enter="() => handleNameEnter(index)"
                :autofocus="false"
                :modelValue="item.name"
                @update="(v:any) => changeName(v, index)"
              />
            </template>
            <template v-else>
              <Button color="pink" @click="open(index)" class="text-[1.1rem] leading-5 tracking-wider !px-2 !text-left">
                <span v-html="highlightText(item.name)"></span>
              </Button>

              <!-- Tags Section (inside gray container below button) -->
              <div v-if="item.tags && item.tags.length > 0" class="mt-2 flex flex-wrap gap-1">
                <span
                  v-for="tag in [...item.tags].sort((a, b) => a.localeCompare(b))"
                  :key="tag"
                  :class="[
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs border cursor-pointer transition-colors',
                    isTagHighlighted(tag)
                      ? 'bg-yellow-200 border-yellow-300 text-yellow-900 font-medium'
                      : 'bg-blue-100 border-blue-200 text-blue-800 hover:bg-blue-200'
                  ]"
                  @click="addTagToSearch(tag)"
                  :title="t('Click to search for this tag')"
                >
                  {{ tag }}
                </span>
              </div>
            </template>
          </div>
          <div class="flex-grow whitespace-nowrap text-right mr-12 relative z-10">
            <template v-if="isBulkEditMode">
              <Button color="red" class="mr-2" :tone="300" @click="() => initRemove(index, item.name)">
                <Icon icon="fal fa-trash-alt" size="1.2rem" />
              </Button>
            </template>
          </div>
        </div>
      </div>
    </TransitionGroup>

    <div class='mt-8'>
      <Button @click="openShareModal">{{t('Share online')}}</Button>
      <Button class="ml-2" @click="openFriendModal">{{ t('Add friend') }}</Button>

      <!-- Friends list -->
      <div v-if="friends.length" class="mt-4 space-y-2">
        <div
          v-for="f in friends"
          :key="f.token"
          class="flex items-center justify-between bg-gray-100 rounded-lg px-3 py-2"
        >
          <span class="text-gray-800 truncate">{{ f.name || t('Unnamed friend') }}</span>
          <template v-if="isBulkEditMode">
            <Button color="red" :tone="300" @click="removeFriend(f.token)">{{ t('Remove') }}</Button>
          </template>
          <template v-else>
            <Button @click="showFriend(f)">{{ t('Show') }}</Button>
          </template>
        </div>
      </div>
    </div>

    <BaseDialog v-model="showShareModal" @close="closeShareModal" size="md">
      <template #header>
        <div class="px-6 py-4 text-lg font-semibold">
          {{ t('Share online') }}
        </div>
      </template>
      <template #content>
        <div class="space-y-4">
          <p class="text-gray-700">
            {{ t("Send this to someone you want to show your recipe list. They can't change your recipes, it is read only") }}
          </p>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('Your name') }}</label>
            <SInput v-model="shareName" :placeholder="t('Your name')" />
          </div>
          <pre class="bg-gray-100 rounded-lg p-4 overflow-x-auto text-sm relative">
<code class="select-all break-all">{{ shareToken }}</code>
<button
  type="button"
  class="absolute right-2 top-2 text-gray-600 hover:text-gray-900"
  @click="copyShareToken"
  :title="t('Copy')"
  aria-label="Copy"
>
  <Icon icon="fal fa-copy" size="1rem" />
</button>
          </pre>
          <p class="mt-2 text-sm text-gray-600">{{ t('Tip: Use the Share button on mobile to send this token via your apps.') }}</p>
          <Button class="mt-1" @click="shareNative">
            <Icon icon="fal fa-share-alt" size="1rem" class="mr-1" />
            {{ t('Share') }}
          </Button>
        </div>
      </template>
      <template #footer>
        <div class="px-6 py-4 flex justify-end">
          <Button @click="closeShareModal">{{ t('Close') }}</Button>
        </div>
      </template>
    </BaseDialog>

    <BaseDialog v-model="showFriendModal" @close="closeFriendModal" size="md">
      <template #header>
        <div class="px-6 py-4 text-lg font-semibold">
          {{ t('Add friend') }}
        </div>
      </template>
      <template #content>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('Friend token') }}</label>
            <SInput v-model="friendToken" :placeholder="t('Paste friends token')" />
          </div>
        </div>
      </template>
      <template #footer>
        <div class="px-6 py-4 flex justify-end gap-2">
          <Button @click="closeFriendModal">{{ t('Close') }}</Button>
          <Button @click="confirmViewFriend">{{ t('Add') }}</Button>
        </div>
      </template>
    </BaseDialog>

    <div
      v-if="toastMessage"
      class="fixed bottom-4 left-1/2 bg-black text-white text-sm px-3 py-2 rounded shadow-lg z-50"
      style="transform: translateX(-50%)"
    >
      {{ toastMessage }}
    </div>
    <Footer :filtered-recipes="filteredRecipes" :filter-query="filterQuery" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { t } from '~src/i18n'
import Footer from '~components/Footer.vue'
import { recipes as _recipes, modalStates, globalSearchFilter, getAllTags, sortJapaneseText, uuidv4 } from '~src/store/index'
import Button from './Button.vue'
import SInput from './Input.vue'
import { newRecipe } from '~plugins/helper'
import Icon from './Icon.vue'
import ModalConfirm from './ModalConfirm.vue'
import ModalInput from './ModalInput.vue'
import ModalManageImage from './ModalManageImage.vue'
import ModalImageZoom from './ModalImageZoom.vue'
import { storageEditMode } from '~src/store/index'
import BaseDialog from '~components/BaseDialog.vue'
import { getSetting, setSetting, getDailyPlans, getShoppingList, setFriend, getFriends, deleteFriend as deleteFriendFromDB } from '~src/services/indexeddb'

// Share online modal state
const showShareModal = ref(false)
const shareToken = ref('')
const shareName = ref('')

// Friends state
const friends = ref<Array<{ token: string; name: string }>>([])
async function loadFriends() {
  try {
    friends.value = await getFriends()
  } catch (_) {
    friends.value = []
  }
}
async function removeFriend(token: string) {
  try {
    await deleteFriendFromDB(token)
  } catch (_) {}
  await loadFriends()
}

// View friends recipe modal state
const showFriendModal = ref(false)
const friendToken = ref('')

function openFriendModal() {
  friendToken.value = ''
  showFriendModal.value = true
}
function closeFriendModal() {
  showFriendModal.value = false
}
async function confirmViewFriend() {
  const token = (friendToken.value || '').trim()
  if (!token) {
    // Just close if empty; no extra behavior required
    showFriendModal.value = false
    return
  }
  try {
    await setFriend(token, { name: 'to be done' })
  } catch (e) {
    // ignore errors per minimal requirement
  }
  showFriendModal.value = false
  await loadFriends()
}

onMounted(() => { loadFriends() })

watch(shareName, async (val) => {
  try { await setSetting('shareName', (val || '').toString()) } catch (_) {}
})

function generateSecureHash(): string {
  try {
    const bytes = new Uint8Array(32)
    crypto.getRandomValues(bytes)
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  } catch (e) {
    // Fallback: concatenate a few UUIDs
    return `${uuidv4().replace(/-/g,'')}${uuidv4().replace(/-/g,'')}`
  }
}

async function openShareModal() {
  try {
    const existing = await getSetting('shareToken', '')
    if (existing && typeof existing === 'string' && existing.length > 0) {
      shareToken.value = existing
    } else {
      const token = generateSecureHash()
      shareToken.value = token
      await setSetting('shareToken', token)
    }

    // Load stored name (optional)
    const existingName = await getSetting('shareName', '')
    shareName.value = typeof existingName === 'string' ? existingName : ''
  } catch (e) {
    // If IndexedDB is unavailable, fall back to generating a token each time
    shareToken.value = generateSecureHash()
  }
  showShareModal.value = true
}
async function closeShareModal() {
  showShareModal.value = false
  try {
    await uploadAllColumns()
  } catch (e) {
    // Silent failure; do not block UI on sync errors
  }
}

async function ensureShareToken(): Promise<string> {
  try {
    const existing = await getSetting('shareToken', '')
    if (existing && typeof existing === 'string' && existing.length > 0) {
      return existing
    }
    const token = generateSecureHash()
    await setSetting('shareToken', token)
    return token
  } catch (e) {
    // If IndexedDB fails, generate ephemeral token
    return generateSecureHash()
  }
}

async function copyShareToken() {
  const token = (shareToken.value || '').toString()
  if (!token) {
    showToast(t('Nothing to copy'))
    return
  }
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(token)
    } else {
      const ta = document.createElement('textarea')
      ta.value = token
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    showToast(t('Copied to clipboard'))
  } catch (e) {
    console.warn('Copy share token failed', e)
    showToast(t('Copy failed'))
  }
}

async function shareNative() {
  // Ensure we have a token and a short message
  const token = (shareToken.value || '').toString() || await ensureShareToken()
  // Keep text short as requested
  const shortText = shareName.value
    ? `${shareName.value}: ${t('Here is my share token')}: ${token}`
    : `${t('Here is my share token')}: ${token}`

  try {
    if ((navigator as any).share) {
      await (navigator as any).share({
        title: t('My recipes'),
        text: shortText,
      })
    } else {
      // Fallback: copy to clipboard and inform user
      await copyShareToken()
      showToast(t('Sharing is not supported on this device'))
    }
  } catch (e) {
    // User may cancel share; keep it silent but optionally inform
    showToast(t('Share cancelled'))
  }
}

async function uploadAllColumns() {
  try {
    const token = await ensureShareToken()

    // Collect local data
    const plans = await getDailyPlans()
    const shoppingLists: Record<string, any> = {}
    for (const plan of plans) {
      try {
        const items = await getShoppingList((plan as any).id)
        shoppingLists[(plan as any).id] = items
      } catch (_) {}
    }

    // Include optional user name if available
    let name = ''
    try {
      const storedName = await getSetting('shareName', '')
      if (typeof storedName === 'string') name = storedName.trim()
    } catch (_) {}

    const payload = {
      share_token: token,
      name: name || undefined,
      recipes: _recipes.value,
      shoppingLists,
      dailyPlans: plans,
    }

    await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    // Do not show UI changes; silent sync
  } catch (e) {
    // Silent failure; optionally log
    console.warn('Share upload failed', e)
  }
}

const router = useRouter()
const recipes = computed({
  get: () => [..._recipes.value].sort((a, b) => sortJapaneseText(a.name, b.name)),
  set: (v) => (_recipes.value = v as any)
})
let filterQuery = ref(globalSearchFilter.value)

const filteredRecipes = computed(() => recipes.value.filter(filterMatch))

// Get available tags from currently filtered recipes, sorted alphabetically
const allAvailableTags = computed(() => {
  const tagSet = new Set<string>()
  filteredRecipes.value.forEach(recipe => {
    if (recipe.tags) {
      recipe.tags.forEach((tag: string) => tagSet.add(tag))
    }
  })
  return Array.from(tagSet).sort((a, b) => a.localeCompare(b))
})

// Get tag counts from currently filtered recipes
const tagCounts = computed(() => {
  const counts: Record<string, number> = {}

  filteredRecipes.value.forEach(recipe => {
    if (recipe.tags) {
      recipe.tags.forEach((tag: string) => {
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
let showImageModal = ref(false)
let selectedRecipe = ref<any>(null)
let toastMessage = ref('')
let toastTimer: number | null = null
const transitionName = ref('ov')
const isBulkEditMode = computed({
  get: () => storageEditMode.value,
  set: (v) => (storageEditMode.value = v)
})
let showZoomModal = ref(false)
let zoomImageSrc = ref('')

const route = useRoute()

onMounted(() => {
  // Upload all local data to share endpoint when arriving at Storage
  uploadAllColumns()
})

function openCreateModal() {
  createName.value = ''
  showCreateModal.value = true
}
async function confirmCreate(name: string) {
  _recipes.value = await newRecipe((name || '').trim())
  showCreateModal.value = false
  createName.value = ''

  // Navigate to the newly created recipe
  const newRecipeIndex = _recipes.value.length - 1
  if (newRecipeIndex >= 0 && _recipes.value[newRecipeIndex]?.id) {
    router.push('/recipe/' + _recipes.value[newRecipeIndex].id)
  }
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
  nextTick(() => filterInputRef.value?.elInput?.blur())
}

function blurFilterInput() {
  filterInputRef.value?.elInput?.blur()
}

function openImageModal(index: number) {
  selectedRecipe.value = recipes.value[index]
  showImageModal.value = true
}

function saveImageSettings(data: { image?: string; showAsBackground: boolean; backgroundArea?: { xPct: number; yPct: number; wPct: number; hPct: number } | null }) {
  if (selectedRecipe.value) {
    // Find the recipe in the main recipes array and update it reactively
    const recipeIndex = _recipes.value.findIndex(recipe => recipe.id === selectedRecipe.value.id)
    if (recipeIndex !== -1) {
      _recipes.value[recipeIndex].image = data.image
      _recipes.value[recipeIndex].showAsBackground = data.showAsBackground
      // Only set backgroundArea if it's different from the default full area
      const bgArea = data.backgroundArea
      if (bgArea && (bgArea.xPct !== 0 || bgArea.yPct !== 0 || bgArea.wPct !== 100 || bgArea.hPct !== 100)) {
        _recipes.value[recipeIndex].backgroundArea = bgArea
      } else if (!bgArea) {
        _recipes.value[recipeIndex].backgroundArea = null
      } else {
        // If it's the default full area, don't save it to keep data clean
        _recipes.value[recipeIndex].backgroundArea = null
      }
    }
  }
  showImageModal.value = false
  selectedRecipe.value = null
}

function computeBackgroundStyle(item: any) {
  const base: any = {
    backgroundImage: `url(${item.image})`,
    backgroundRepeat: 'no-repeat',
    // We'll scale the image so that the selected area's width spans the full row width.
    // Vertically, the image will behave similar to cover (top/bottom can crop depending on content height).
    backgroundSize: ''
  }

  // Always default to full image (0, 0, 100, 100) if backgroundArea is null/undefined or invalid
  let area = { xPct: 0, yPct: 0, wPct: 100, hPct: 100 }

  if (item.backgroundArea &&
      typeof item.backgroundArea.xPct === 'number' &&
      typeof item.backgroundArea.yPct === 'number' &&
      typeof item.backgroundArea.wPct === 'number' &&
      typeof item.backgroundArea.hPct === 'number') {
    area = item.backgroundArea
  }

  // Compute horizontal scaling so the selected area's width fills the row completely.
  // Example: if selected width is 50% of the image, set background-size to 200% (image twice the row width).
  const safeWidth = Math.max(1, Math.min(100, area.wPct))
  const scaledWidthPercent = (10000 / safeWidth) // equals 100 / (wPct/100)
  base.backgroundSize = `${scaledWidthPercent}% auto`

  // Compute horizontal position so the selected area's left edge aligns to the row's left edge.
  // Derivation: posX = x / (1 - w), where x and w are [0..1].
  // Guard when w == 100% (no horizontal selection) -> center horizontally.
  let posXPercent = 50
  if (safeWidth < 100) {
    const denom = 100 - safeWidth
    posXPercent = Math.max(0, Math.min(100, (area.xPct / denom) * 100))
  }

  // Vertical position: use the selection's vertical center as the reference.
  // Exact centering needs container/image height, which we don't have. Using percentage keeps it intuitive.
  const centerY = Math.max(0, Math.min(100, area.yPct + area.hPct / 2))
  base.backgroundPosition = `${posXPercent}% ${centerY}%`

  return base
}

// Precise square thumbnail generation via offscreen canvas to avoid CSS % mapping issues
const thumbSrcById = ref<Record<string, string>>({})
const thumbKeyById = ref<Record<string, string>>({})
const thumbLoadingKeys = new Set<string>()
let thumbStorage: Storage | null | undefined
const thumbStoragePrefix = 'storageThumb:'

function getNormalizedArea(item: any) {
  const a = item?.backgroundArea
  if (
    a &&
    typeof a.xPct === 'number' &&
    typeof a.yPct === 'number' &&
    typeof a.wPct === 'number' &&
    typeof a.hPct === 'number'
  ) {
    return {
      xPct: Math.max(0, Math.min(100, a.xPct)),
      yPct: Math.max(0, Math.min(100, a.yPct)),
      wPct: Math.max(1, Math.min(100, a.wPct)),
      hPct: Math.max(1, Math.min(100, a.hPct))
    }
  }
  return { xPct: 0, yPct: 0, wPct: 100, hPct: 100 }
}

function getThumbCacheKey(item: any): string {
  const area = getNormalizedArea(item)
  // Use image length as a cheap content hash surrogate
  const imgKey = item?.image ? String(item.image.length) : '0'
  return `${item?.id || 'no-id'}|${imgKey}|${area.xPct},${area.yPct},${area.wPct},${area.hPct}`
}

function getThumbStorageSafely(): Storage | null {
  if (thumbStorage !== undefined) {
    return thumbStorage
  }
  if (typeof window === 'undefined') {
    thumbStorage = null
    return thumbStorage
  }
  try {
    thumbStorage = window.sessionStorage
  } catch (err) {
    thumbStorage = null
  }
  return thumbStorage
}

function isDefaultBackgroundArea(area: { xPct: number; yPct: number; wPct: number; hPct: number } | null | undefined): boolean {
  if (!area) return true
  const nearly = (value: number, target: number) => Math.abs((value ?? target) - target) < 0.001
  return nearly(area.xPct ?? 0, 0) && nearly(area.yPct ?? 0, 0) && nearly(area.wPct ?? 100, 100) && nearly(area.hPct ?? 100, 100)
}

function generateThumb(item: any) {
  if (!item?.image) return
  const key = getThumbCacheKey(item)
  const id = item?.id || 'no-id'
  const prev = thumbKeyById.value[id]
  const existing = thumbSrcById.value[id]
  if (prev === key && existing) return

  const storage = getThumbStorageSafely()
  if (!existing && storage) {
    const stored = storage.getItem(`${thumbStoragePrefix}${key}`)
    if (stored) {
      thumbSrcById.value[id] = stored
      thumbKeyById.value[id] = key
      return
    }
  }

  if (thumbLoadingKeys.has(key)) return
  thumbLoadingKeys.add(key)

  const img = new Image()
  img.onload = () => {
    try {
      const area = getNormalizedArea(item)
      const iw = img.naturalWidth || img.width
      const ih = img.naturalHeight || img.height
      const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1))
      const targetCssSize = 56 // Tailwind w-14 = 3.5rem ≈ 56px at base 16px
      const size = targetCssSize * dpr
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('no canvas context')
      ctx.imageSmoothingQuality = 'high'
      ctx.clearRect(0, 0, size, size)

      let dataUrl = ''

      if (isDefaultBackgroundArea(item.backgroundArea)) {
        const scale = Math.min(size / iw, size / ih)
        const drawW = iw * scale
        const drawH = ih * scale
        const offsetX = (size - drawW) / 2
        const offsetY = (size - drawH) / 2
        ctx.drawImage(img, 0, 0, iw, ih, offsetX, offsetY, drawW, drawH)
      } else {
        const srcX = Math.round((area.xPct / 100) * iw)
        const srcY = Math.round((area.yPct / 100) * ih)
        const srcW = Math.round((area.wPct / 100) * iw)
        const srcH = Math.round((area.hPct / 100) * ih)

        // Centered square inside the selected rectangle
        const edge = Math.max(1, Math.min(srcW, srcH))
        const centerX = srcX + srcW / 2
        const centerY = srcY + srcH / 2
        let sqX = Math.round(centerX - edge / 2)
        let sqY = Math.round(centerY - edge / 2)

        // Clamp to image bounds
        if (sqX < 0) sqX = 0
        if (sqY < 0) sqY = 0
        if (sqX + edge > iw) sqX = Math.max(0, iw - edge)
        if (sqY + edge > ih) sqY = Math.max(0, ih - edge)

        ctx.drawImage(img, sqX, sqY, edge, edge, 0, 0, size, size)
      }

      dataUrl = canvas.toDataURL('image/jpeg', 0.9)
      thumbSrcById.value[id] = dataUrl
      thumbKeyById.value[id] = key

      if (storage) {
        try {
          storage.setItem(`${thumbStoragePrefix}${key}`, dataUrl)
        } catch (err) {
          // Best-effort cache; ignore quota errors
        }
      }
    } catch (e) {
      // Fallback to original image
      thumbSrcById.value[id] = item.image
      thumbKeyById.value[id] = key
    } finally {
      thumbLoadingKeys.delete(key)
    }
  }
  img.onerror = () => {
    thumbSrcById.value[id] = item.image
    thumbKeyById.value[id] = key
    thumbLoadingKeys.delete(key)
  }
  // Ensure base64 data URLs render without taint issues
  img.crossOrigin = 'anonymous'
  img.src = item.image
}

function getThumbSrc(item: any): string {
  return thumbSrcById.value[item?.id || 'no-id'] || ''
}

function thumbButtonStyle(item: any) {
  // Generate on demand with caching; cheap on subsequent calls
  generateThumb(item)
  const src = getThumbSrc(item)
  return {
    backgroundImage: src ? `url(${src})` : 'none',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundColor: 'white',
    opacity: src ? 1 : 0,
    pointerEvents: src ? 'auto' : 'none',
    transition: 'opacity 90ms ease-out'
  } as any
}

function openZoom(item: any) {
  if (!item?.image) return
  zoomImageSrc.value = item.image
  showZoomModal.value = true
}

function isTagHighlighted(tag: string): boolean {
  const q = (filterQuery.value || '').toLowerCase().trim()
  if (!q) return false

  const searchTerms = q.split(/\s+/).filter(term => term.length > 0)
  return searchTerms.some(term => tag.toLowerCase().includes(term.toLowerCase()))
}

function highlightText(text: string): string {
  const q = (filterQuery.value || '').toLowerCase().trim()
  if (!q) return text

  const searchTerms = q.split(/\s+/).filter(term => term.length > 0)
  let highlightedText = text

  searchTerms.forEach(term => {
    const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi')
    highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 px-0.5 rounded">$1</mark>')
  })

  return highlightedText
}
function addTagToSearch(tag: string) {
  const currentQuery = (filterQuery.value || '').trim()
  const lowerTag = tag.toLowerCase()

  // Check if tag is already in the filter
  const searchTerms = currentQuery.split(/\s+/).filter(term => term.length > 0)
  const hasMatchingTerm = searchTerms.some(term => {
    const lowerTerm = term.toLowerCase()
    // Check if search term is contained in tag OR tag is contained in search term
    return lowerTag.includes(lowerTerm) || lowerTerm.includes(lowerTag)
  })

  if (hasMatchingTerm) {
    // Remove matching terms from the query
    const filteredTerms = searchTerms.filter(term => {
      const lowerTerm = term.toLowerCase()
      // Keep terms that are NOT contained in the tag and tag is NOT contained in them
      return !(lowerTag.includes(lowerTerm) || lowerTerm.includes(lowerTag))
    })
    filterQuery.value = filteredTerms.join(' ').trim()
  } else {
    // Add tag to the query
    if (currentQuery) {
      filterQuery.value = currentQuery + ' ' + tag
    } else {
      filterQuery.value = tag
    }
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
function changeName(value: any, index: number) {
  const copy = [...recipes.value]
  ;(copy[index] as any).name = value || ''
  recipes.value = copy
}
function handleNameEnter(index: number) {
  return
}
// Mode iscontrolled in Header via storageEditMode
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


// Sync local filter with global search filter
watch(filterQuery, (newValue) => {
  globalSearchFilter.value = newValue
})

watch(globalSearchFilter, (newValue) => {
  if (filterQuery.value !== newValue) {
    filterQuery.value = newValue
  }
})

// Persist shareName to IndexedDB as user types (best-effort)
watch(shareName, async (newValue) => {
  try {
    await setSetting('shareName', newValue || '')
  } catch (e) {
    // ignore persistence errors
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
