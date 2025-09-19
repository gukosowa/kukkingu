<template>
  <BaseDialog v-model="showModal" size="lg" @close="close">
    <template #header>
      <div class="px-4 py-3">
        <div class="flex items-start">
          <Icon icon="fal fa-image" class="text-blue-500 mr-3 mt-1" size="1.5rem" />
          <div class="flex-1">
            <div class="text-lg text-gray-700 font-bold">{{ t('Manage Recipe Image') }}</div>
          </div>
        </div>
      </div>
    </template>

    <template #content>
      <div class="px-5 pb-4 space-y-4">
        <!-- Current Image Display -->
        <div v-if="localRecipe.image" class="flex flex-col items-center space-y-2">
          <div class="relative border border-gray-300 rounded-lg overflow-hidden max-w-xs">
            <img
              :src="localRecipe.image"
              alt="Recipe image"
              class="block max-w-full h-auto cursor-zoom-in"
              @click="openZoomModal"
            />
            <div class="absolute top-2 right-2 flex space-x-2">
              <Button
                @click="openCropModal"
                color="blue"
                class="!px-2 !py-1 !text-xs"
                :class="'bg-blue-600 hover:bg-blue-700'"
              >
                <Icon icon="fal fa-crop" size="0.8rem" />
              </Button>
              <Button
                @click="removeImage"
                color="red"
                class="!px-2 !py-1 !text-xs"
                :class="'bg-red-600 hover:bg-red-700'"
              >
                <Icon icon="fal fa-trash" size="0.8rem" />
              </Button>
            </div>
          </div>
          <div v-if="imageSizeLabel" class="text-xs text-gray-500">
            {{ imageSizeLabel }}
          </div>
        </div>

        <!-- Upload Section -->
        <div class="flex flex-col items-center space-y-1">
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleFileSelect"
          />
          <input
            ref="cameraInput"
            type="file"
            accept="image/*"
            capture="environment"
            class="hidden"
            @change="handleCameraCapture"
          />

          <!-- Paste Area -->
          <div
            ref="pasteArea"
            contenteditable="true"
            :placeholder="t('Paste image here')"
            class="w-full border focus:ring-indigo-500 text-black p-2 focus:border-indigo-500 shadow-sm sm:text-sm border-gray-300 rounded-md min-h-[40px] focus:outline-none bg-white hidden sm:inline-flex"
            @paste="handlePaste"
            @input="handleContentEditableInput"
          ></div>

          <div class="flex flex-wrap flex-row justify-center gap-2">
            <Button @click="triggerFileInput" color="gray" class="!text-sm">
              <Icon icon="fal fa-plus" class="mr-2" size="1rem" />
              {{ t('Browse Image') }}
            </Button>
            <Button @click="triggerCameraInput" color="gray" class="!text-sm">
              <Icon icon="fal fa-camera" class="mr-2" size="1rem" />
              {{ t('Take Photo') }}
            </Button>
            <Button
              v-if="localRecipe.image"
              @click="optimizeExistingImage"
              color="gray"
              class="!text-sm"
              :disabled="isOptimizingImage"
            >
              <Icon icon="fal fa-compress" class="mr-2" size="1rem" />
              {{ isOptimizingImage ? t('Optimizing...') : t('Optimize') }}
            </Button>
          </div>
        </div>

        <!-- Background Display Option -->
        <div class="border-t pt-4">
          <!-- Background area selector -->
          <div v-if="localRecipe.image" class="mt-4">
            <div class="text-sm text-gray-700 mb-2">{{ t('Select the area to show as background') }}</div>
            <div
              ref="imageContainer"
              class="relative w-full max-w-xs bg-gray-100 rounded-lg overflow-hidden select-none"
            >
              <img
                ref="imageEl"
                :src="localRecipe.image"
                alt="Background preview"
                class="block w-full h-auto"
                @load="onImageLoad"
              />
              <div
                class="absolute inset-0 cursor-crosshair"
                @mousedown="startSelect"
                @mousemove="updateSelect"
                @mouseup="endSelect"
                @mouseleave="endSelect"
                @touchstart.prevent="startSelect"
                @touchmove.prevent="updateSelect"
                @touchend.prevent="endSelect"
              ></div>
              <div
                v-if="selectionRect"
                class="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20"
                :style="selectionStyle"
                @mousedown.stop="startMove"
                @touchstart.stop.prevent="startMove"
              >
                <!-- Resize handles -->
                <div
                  class="absolute w-6 h-6 cursor-nwse-resize"
                  style="top: 0; left: 0; transform: translate(-50%, -50%);"
                  @mousedown.stop="(e) => startResize(e, 'nw')"
                  @touchstart.stop.prevent="(e) => startResize(e, 'nw')"
                >
                  <div class="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white border border-blue-500 rounded-full"></div>
                </div>
                <div
                  class="absolute w-6 h-6 cursor-nesw-resize"
                  style="top: 0; left: 50%; transform: translate(-50%, -50%);"
                  @mousedown.stop="(e) => startResize(e, 'n')"
                  @touchstart.stop.prevent="(e) => startResize(e, 'n')"
                >
                  <div class="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white border border-blue-500 rounded-full"></div>
                </div>
                <div
                  class="absolute w-6 h-6 cursor-nwse-resize"
                  style="top: 0; left: 100%; transform: translate(-50%, -50%);"
                  @mousedown.stop="(e) => startResize(e, 'ne')"
                  @touchstart.stop.prevent="(e) => startResize(e, 'ne')"
                >
                  <div class="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white border border-blue-500 rounded-full"></div>
                </div>
                <div
                  class="absolute w-6 h-6 cursor-nesw-resize"
                  style="top: 50%; left: 0; transform: translate(-50%, -50%);"
                  @mousedown.stop="(e) => startResize(e, 'w')"
                  @touchstart.stop.prevent="(e) => startResize(e, 'w')"
                >
                  <div class="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white border border-blue-500 rounded-full"></div>
                </div>
                <div
                  class="absolute w-6 h-6 cursor-nesw-resize"
                  style="top: 50%; left: 100%; transform: translate(-50%, -50%);"
                  @mousedown.stop="(e) => startResize(e, 'e')"
                  @touchstart.stop.prevent="(e) => startResize(e, 'e')"
                >
                  <div class="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white border border-blue-500 rounded-full"></div>
                </div>
                <div
                  class="absolute w-6 h-6 cursor-nwse-resize"
                  style="top: 100%; left: 0; transform: translate(-50%, -50%);"
                  @mousedown.stop="(e) => startResize(e, 'sw')"
                  @touchstart.stop.prevent="(e) => startResize(e, 'sw')"
                >
                  <div class="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white border border-blue-500 rounded-full"></div>
                </div>
                <div
                  class="absolute w-6 h-6 cursor-nesw-resize"
                  style="top: 100%; left: 50%; transform: translate(-50%, -50%);"
                  @mousedown.stop="(e) => startResize(e, 's')"
                  @touchstart.stop.prevent="(e) => startResize(e, 's')"
                >
                  <div class="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white border border-blue-500 rounded-full"></div>
                </div>
                <div
                  class="absolute w-6 h-6 cursor-nwse-resize"
                  style="top: 100%; left: 100%; transform: translate(-50%, -50%);"
                  @mousedown.stop="(e) => startResize(e, 'se')"
                  @touchstart.stop.prevent="(e) => startResize(e, 'se')"
                >
                  <div class="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white border border-blue-500 rounded-full"></div>
                </div>
              </div>
            </div>
            <div class="mt-2 flex items-center justify-between">
              <div class="text-xs text-gray-500">
                <span v-if="selectionRect">{{ Math.round(selectionRect.width) }} × {{ Math.round(selectionRect.height) }} px</span>
                <span v-else>{{ t('Drag to select an area') }}</span>
              </div>
              <Button v-if="backgroundArea" color="gray" class="!px-2 !py-1 !text-xs" @click="clearBackgroundArea">
                {{ t('Reset area') }}
              </Button>
            </div>
          </div>

          <div class="mt-4 flex items-center space-x-3">
            <input
              id="showAsBackground"
              type="checkbox"
              v-model="showAsBackground"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label for="showAsBackground" class="text-sm text-gray-700">
              {{ t('Show image as background in recipe list') }}
            </label>
          </div>
          <div class="text-xs text-gray-500 mt-1">
            {{ t('The image will be displayed as a subtle background behind the recipe entry') }}
          </div>
        </div>

      </div>
    </template>

    <template #footer>
      <div class="px-3 py-2 flex space-x-2">
        <Button @click="close" color="gray" class="flex-1">
          {{ t('Close') }}
        </Button>
        <Button @click="save" color="blue" class="flex-1">
          {{ t('Save') }}
        </Button>
      </div>
    </template>
  </BaseDialog>

  <!-- Separate Crop Modal Dialog -->
  <ModalCropImage
    v-model="showCropModal"
    :imageSrc="localRecipe.image || ''"
    @confirm="confirmCrop"
  />
  <ModalImageZoom
    v-if="localRecipe.image"
    v-model="showZoomModal"
    :imageSrc="localRecipe.image"
  />
</template>

<script lang="ts" setup>
import { ref, computed, watch, nextTick } from 'vue'
import BaseDialog from './BaseDialog.vue'
import Button from './Button.vue'
import Icon from './Icon.vue'
import ModalCropImage from './ModalCropImage.vue'
import ModalImageZoom from './ModalImageZoom.vue'
import { t } from '~src/i18n'
import { isValidImageFile, pasteImageFromClipboard } from '~src/services/indexeddb'
import { optimizeImageFile, optimizeImageBlob } from '~src/services/imageOptimization'

interface Props {
  modelValue: boolean
  recipe: any
}

interface BackgroundArea {
  xPct: number
  yPct: number
  wPct: number
  hPct: number
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', data: { image?: string; showAsBackground: boolean; backgroundArea?: BackgroundArea | null }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const showModal = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})


const fileInput = ref<HTMLInputElement | null>(null)
const cameraInput = ref<HTMLInputElement | null>(null)
const pasteArea = ref<HTMLDivElement | null>(null)
const showCropModal = ref(false)
const showZoomModal = ref(false)
const showAsBackground = ref(props.recipe?.showAsBackground || false)
const isOptimizingImage = ref(false)

// Image & selection for background area
const imageEl = ref<HTMLImageElement | null>(null)
const imageContainer = ref<HTMLDivElement | null>(null)
const naturalSize = ref<{ w: number; h: number } | null>(null)
const selectionRect = ref<{ x: number; y: number; width: number; height: number } | null>(null)
const isSelecting = ref(false)
const startPoint = ref<{ x: number; y: number } | null>(null)
const dragMode = ref<'draw' | 'move' | 'resize' | null>(null)
const activeHandle = ref<'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null>(null)
const dragStartRect = ref<{ x: number; y: number; width: number; height: number } | null>(null)
const moveOffset = ref<{ dx: number; dy: number } | null>(null)
const backgroundArea = ref<BackgroundArea | null>(props.recipe?.backgroundArea || null)

// Create a reactive local copy of the recipe
const localRecipe = ref(props.recipe ? { ...props.recipe } : {})

const imageSizeLabel = computed(() => {
  const image = localRecipe.value?.image
  if (!image) return null
  const base64 = image.split(',')[1] || ''
  if (!base64) return null
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  const bytes = base64.length * 0.75 - padding
  if (!Number.isFinite(bytes) || bytes <= 0) return null
  const kilobytes = bytes / 1024
  if (kilobytes < 1024) {
    const precision = kilobytes >= 100 ? 0 : 1
    return `${kilobytes.toFixed(precision)} KB`
  }
  const megabytes = kilobytes / 1024
  const precision = megabytes >= 10 ? 1 : 2
  return `${megabytes.toFixed(precision)} MB`
})

// Watch for changes to the recipe prop to update local copy
watch(() => props.recipe, (newRecipe) => {
  if (newRecipe) {
    localRecipe.value = { ...newRecipe }
    showAsBackground.value = newRecipe.showAsBackground || false
    backgroundArea.value = newRecipe.backgroundArea || null
    selectionRect.value = null
    showZoomModal.value = false
  }
}, { immediate: true, deep: true })

// Watch for changes to showAsBackground
watch(() => props.recipe?.showAsBackground, (newValue) => {
  showAsBackground.value = newValue || false
}, { immediate: true })

function triggerFileInput() {
  fileInput.value?.click()
}

function triggerCameraInput() {
  cameraInput.value?.click()
}

async function processSelectedFile(file?: File | null) {
  if (!file) return
  if (isValidImageFile(file)) {
    try {
      const base64 = await optimizeImageFile(file)
      // Update the recipe image temporarily for preview
      localRecipe.value.image = base64
    } catch (error) {
      console.error('Failed to process image file:', error)
      // Could show a notice here
    }
  } else {
    console.warn('Invalid image file selected')
  }
}

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  await processSelectedFile(file)
  if (target) target.value = ''
}

async function handleCameraCapture(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  await processSelectedFile(file)
  if (target) target.value = ''
}

async function openCropModal() {
  if (localRecipe.value?.image) {
    // Force reactivity update
    await nextTick()
    // Small delay to ensure image is properly set
    await new Promise(resolve => setTimeout(resolve, 10))
    showCropModal.value = true
  }
}

function openZoomModal() {
  if (!localRecipe.value?.image) return
  showZoomModal.value = true
}

function confirmCrop(croppedImage: string) {
  localRecipe.value.image = croppedImage
  showCropModal.value = false
}

function removeImage() {
  localRecipe.value.image = undefined
  showZoomModal.value = false
}

function save() {
  // If no background area is selected but showAsBackground is enabled,
  // save the default full-area object for consistency
  const finalBackgroundArea = showAsBackground.value && !backgroundArea.value
    ? { xPct: 0, yPct: 0, wPct: 100, hPct: 100 }
    : backgroundArea.value

  emit('save', {
    image: localRecipe.value?.image,
    showAsBackground: showAsBackground.value,
    backgroundArea: finalBackgroundArea
  })
  showModal.value = false
}

function handleContentEditableInput(event: Event) {
  // Handle input changes in contenteditable div
  const target = event.target as HTMLDivElement
  // If there's an image in the content, extract it
  const images = target.querySelectorAll('img')
  if (images.length > 0) {
    const img = images[0] as HTMLImageElement
    if (img.src && img.src.startsWith('data:')) {
      updateRecipeImage(img.src)
      // Clear the contenteditable area after extracting the image
      target.innerHTML = ''
    }
  }
}

function updateRecipeImage(base64: string) {
  localRecipe.value.image = base64
}

async function handlePaste(event: ClipboardEvent) {
  event.preventDefault()
  try {
    const base64 = await pasteImageFromClipboard(event.clipboardData || undefined)
    if (base64) {
      localRecipe.value.image = base64
      // Clear the contenteditable area after successful paste
      if (pasteArea.value) {
        pasteArea.value.innerHTML = ''
      }
    } else {
      console.warn('No valid image found in clipboard')
    }
  } catch (error) {
    console.error('Failed to paste image:', error)
  }
}

async function optimizeExistingImage() {
  if (!localRecipe.value?.image || isOptimizingImage.value) return
  try {
    isOptimizingImage.value = true
    const response = await fetch(localRecipe.value.image)
    const blob = await response.blob()
    const optimizedBase64 = await optimizeImageBlob(blob)
    localRecipe.value.image = optimizedBase64
  } catch (error) {
    console.error('Failed to optimize existing image:', error)
  } finally {
    isOptimizingImage.value = false
  }
}

function onImageLoad() {
  if (!imageEl.value) return
  naturalSize.value = { w: imageEl.value.naturalWidth, h: imageEl.value.naturalHeight }
  if (backgroundArea.value && imageEl.value) {
    const imgRect = imageEl.value.getBoundingClientRect()
    const x = (backgroundArea.value.xPct / 100) * imgRect.width
    const y = (backgroundArea.value.yPct / 100) * imgRect.height
    const w = (backgroundArea.value.wPct / 100) * imgRect.width
    const h = (backgroundArea.value.hPct / 100) * imgRect.height
    selectionRect.value = { x, y, width: w, height: h }
  }
}

function getClientPoint(event: MouseEvent | TouchEvent, bounds: DOMRect) {
  const clientX = 'touches' in event ? event.touches[0].clientX : (event as MouseEvent).clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : (event as MouseEvent).clientY
  const x = Math.max(0, Math.min(clientX - bounds.left, bounds.width))
  const y = Math.max(0, Math.min(clientY - bounds.top, bounds.height))
  return { x, y }
}

function pointInsideSelection(p: { x: number; y: number }, r: { x: number; y: number; width: number; height: number }) {
  return p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height
}

function startSelect(event: MouseEvent | TouchEvent) {
  if (!imageEl.value) return
  const rect = imageEl.value.getBoundingClientRect()
  const p = getClientPoint(event, rect)
  isSelecting.value = true
  startPoint.value = p

  if (selectionRect.value && pointInsideSelection(p, selectionRect.value)) {
    // fallback move when dragging inside selection on background layer
    dragMode.value = 'move'
    dragStartRect.value = { ...selectionRect.value }
    moveOffset.value = { dx: p.x - selectionRect.value.x, dy: p.y - selectionRect.value.y }
    addDragListeners()
    return
  }

  dragMode.value = 'draw'
  selectionRect.value = { x: p.x, y: p.y, width: 0, height: 0 }
  addDragListeners()
}

function startMove(event: MouseEvent | TouchEvent) {
  if (!imageEl.value || !selectionRect.value) return
  const rect = imageEl.value.getBoundingClientRect()
  const p = getClientPoint(event as MouseEvent, rect)
  isSelecting.value = true
  dragMode.value = 'move'
  dragStartRect.value = { ...selectionRect.value }
  moveOffset.value = { dx: p.x - selectionRect.value.x, dy: p.y - selectionRect.value.y }
  addDragListeners()
}

function startResize(event: MouseEvent | TouchEvent, handle: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw') {
  if (!imageEl.value || !selectionRect.value) return
  const rect = imageEl.value.getBoundingClientRect()
  const p = getClientPoint(event as MouseEvent, rect)
  isSelecting.value = true
  dragMode.value = 'resize'
  activeHandle.value = handle
  startPoint.value = p
  dragStartRect.value = { ...selectionRect.value }
  addDragListeners()
}

function updateSelect(event: MouseEvent | TouchEvent) {
  if (!isSelecting.value || !imageEl.value) return
  const rect = imageEl.value.getBoundingClientRect()
  const p = getClientPoint(event, rect)

  if (dragMode.value === 'draw') {
    if (!startPoint.value) return
    const x = Math.min(startPoint.value.x, p.x)
    const y = Math.min(startPoint.value.y, p.y)
    const w = Math.abs(p.x - startPoint.value.x)
    const h = Math.abs(p.y - startPoint.value.y)
    selectionRect.value = { x, y, width: w, height: h }
    return
  }

  if (!selectionRect.value || !dragStartRect.value) return

  if (dragMode.value === 'move') {
    if (!moveOffset.value) return
    let newX = p.x - moveOffset.value.dx
    let newY = p.y - moveOffset.value.dy
    newX = Math.max(0, Math.min(newX, rect.width - dragStartRect.value.width))
    newY = Math.max(0, Math.min(newY, rect.height - dragStartRect.value.height))
    selectionRect.value = { x: newX, y: newY, width: dragStartRect.value.width, height: dragStartRect.value.height }
    return
  }

  if (dragMode.value === 'resize' && activeHandle.value) {
    const minSize = 5
    let { x, y, width, height } = dragStartRect.value
    const endX = x + width
    const endY = y + height

    // Adjust based on handle
    if (activeHandle.value.includes('n')) {
      y = Math.max(0, Math.min(p.y, endY - minSize))
      height = endY - y
    }
    if (activeHandle.value.includes('s')) {
      const newBottom = Math.max(y + minSize, Math.min(p.y, rect.height))
      height = newBottom - y
    }
    if (activeHandle.value.includes('w')) {
      x = Math.max(0, Math.min(p.x, endX - minSize))
      width = endX - x
    }
    if (activeHandle.value.includes('e')) {
      const newRight = Math.max(x + minSize, Math.min(p.x, rect.width))
      width = newRight - x
    }

    selectionRect.value = { x, y, width, height }
  }
}

function endSelect() {
  if (!isSelecting.value || !imageEl.value || !selectionRect.value) {
    isSelecting.value = false
    dragMode.value = null
    activeHandle.value = null
    dragStartRect.value = null
    moveOffset.value = null
    removeDragListeners()
    return
  }
  const rect = imageEl.value.getBoundingClientRect()
  const xPct = (selectionRect.value.x / rect.width) * 100
  const yPct = (selectionRect.value.y / rect.height) * 100
  const wPct = (selectionRect.value.width / rect.width) * 100
  const hPct = (selectionRect.value.height / rect.height) * 100
  backgroundArea.value = { xPct, yPct, wPct, hPct }
  isSelecting.value = false
  dragMode.value = null
  activeHandle.value = null
  dragStartRect.value = null
  moveOffset.value = null
  removeDragListeners()
}

function addDragListeners() {
  window.addEventListener('mousemove', updateSelect as unknown as EventListener, { passive: false })
  window.addEventListener('mouseup', endSelect as unknown as EventListener, { passive: false })
  window.addEventListener('touchmove', updateSelect as unknown as EventListener, { passive: false })
  window.addEventListener('touchend', endSelect as unknown as EventListener, { passive: false })
}

function removeDragListeners() {
  window.removeEventListener('mousemove', updateSelect as unknown as EventListener)
  window.removeEventListener('mouseup', endSelect as unknown as EventListener)
  window.removeEventListener('touchmove', updateSelect as unknown as EventListener)
  window.removeEventListener('touchend', endSelect as unknown as EventListener)
}

function clearBackgroundArea() {
  backgroundArea.value = null
  selectionRect.value = null
}

const selectionStyle = computed(() => {
  if (!selectionRect.value) return {}
  return {
    left: `${selectionRect.value.x}px`,
    top: `${selectionRect.value.y}px`,
    width: `${selectionRect.value.width}px`,
    height: `${selectionRect.value.height}px`
  }
})


function close() {
  showModal.value = false
}
</script>

<style scoped>
/* Contenteditable styling */
[contenteditable]:empty:before {
  content: attr(placeholder);
  color: #9ca3af;
  pointer-events: none;
}

[contenteditable] {
  white-space: pre-wrap;
  word-wrap: break-word;
}

[contenteditable] img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 6px;
  margin: 4px 0;
}
</style>
