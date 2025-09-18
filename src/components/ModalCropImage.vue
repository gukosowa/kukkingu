<template>
  <BaseDialog v-if="!nested" v-model="showModal" size="lg" @close="close">
    <template #header>
      <div class="px-4 py-3">
        <div class="flex items-start">
          <Icon icon="fal fa-crop" class="text-blue-500 mr-3 mt-1" size="1.5rem" />
          <div class="flex-1">
            <div class="text-lg text-gray-700 font-bold">{{ t('Crop Image') }}</div>
          </div>
        </div>
      </div>
    </template>

    <template #content>
      <div class="px-5 pb-4">
        <div class="flex flex-col items-center space-y-4">
          <div class="relative border border-gray-300 rounded-lg overflow-hidden">
            <canvas
              ref="canvas"
              :width="canvasWidth"
              :height="canvasHeight"
              class="block cursor-crosshair"
              @mousedown="startCrop"
              @mousemove="updateCrop"
              @mouseup="endCrop"
              @touchstart="startCrop"
              @touchmove="updateCrop"
              @touchend="endCrop"
            />
            <!-- Crop overlay -->
            <div
              v-if="cropRect"
              class="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20"
              :style="cropStyle"
              @mousedown.stop="startMoveCrop"
              @touchstart.stop.prevent="startMoveCrop"
            >
              <div
                class="absolute w-3 h-3 bg-white border border-blue-500 rounded-sm cursor-nwse-resize"
                style="top: 0; left: 0; transform: translate(-50%, -50%);"
                @mousedown.stop="(e) => startResizeCrop(e, 'nw')"
                @touchstart.stop.prevent="(e) => startResizeCrop(e, 'nw')"
              ></div>
              <div
                class="absolute w-3 h-3 bg-white border border-blue-500 rounded-sm cursor-nesw-resize"
                style="top: 0; left: 50%; transform: translate(-50%, -50%);"
                @mousedown.stop="(e) => startResizeCrop(e, 'n')"
                @touchstart.stop.prevent="(e) => startResizeCrop(e, 'n')"
              ></div>
              <div
                class="absolute w-3 h-3 bg-white border border-blue-500 rounded-sm cursor-nwse-resize"
                style="top: 0; left: 100%; transform: translate(-50%, -50%);"
                @mousedown.stop="(e) => startResizeCrop(e, 'ne')"
                @touchstart.stop.prevent="(e) => startResizeCrop(e, 'ne')"
              ></div>
              <div
                class="absolute w-3 h-3 bg-white border border-blue-500 rounded-sm cursor-nesw-resize"
                style="top: 50%; left: 0; transform: translate(-50%, -50%);"
                @mousedown.stop="(e) => startResizeCrop(e, 'w')"
                @touchstart.stop.prevent="(e) => startResizeCrop(e, 'w')"
              ></div>
              <div
                class="absolute w-3 h-3 bg-white border border-blue-500 rounded-sm cursor-nesw-resize"
                style="top: 50%; left: 100%; transform: translate(-50%, -50%);"
                @mousedown.stop="(e) => startResizeCrop(e, 'e')"
                @touchstart.stop.prevent="(e) => startResizeCrop(e, 'e')"
              ></div>
              <div
                class="absolute w-3 h-3 bg-white border border-blue-500 rounded-sm cursor-nwse-resize"
                style="top: 100%; left: 0; transform: translate(-50%, -50%);"
                @mousedown.stop="(e) => startResizeCrop(e, 'sw')"
                @touchstart.stop.prevent="(e) => startResizeCrop(e, 'sw')"
              ></div>
              <div
                class="absolute w-3 h-3 bg-white border border-blue-500 rounded-sm cursor-nesw-resize"
                style="top: 100%; left: 50%; transform: translate(-50%, -50%);"
                @mousedown.stop="(e) => startResizeCrop(e, 's')"
                @touchstart.stop.prevent="(e) => startResizeCrop(e, 's')"
              ></div>
              <div
                class="absolute w-3 h-3 bg-white border border-blue-500 rounded-sm cursor-nwse-resize"
                style="top: 100%; left: 100%; transform: translate(-50%, -50%);"
                @mousedown.stop="(e) => startResizeCrop(e, 'se')"
                @touchstart.stop.prevent="(e) => startResizeCrop(e, 'se')"
              ></div>
            </div>
          </div>

          <div class="text-sm text-gray-600 text-center">
            {{ t('Drag to select crop area') }}
          </div>

          <div v-if="cropRect" class="text-xs text-gray-500 text-center">
            {{ Math.round(cropRect.width) }} × {{ Math.round(cropRect.height) }} px
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="px-3 py-2 flex space-x-2">
        <button
          class="cursor-pointer py-3 flex-1 bg-gray-600 text-white rounded-lg drop-shadow hover:bg-gray-700 transition-colors"
          @click="close"
        >
          {{ t('Cancel') }}
        </button>
        <button
          class="cursor-pointer py-3 flex-1 bg-blue-600 text-white rounded-lg drop-shadow hover:bg-blue-700 transition-colors"
          :disabled="!cropRect"
          @click="confirmCrop"
        >
          {{ t('Crop & Save') }}
        </button>
      </div>
    </template>
  </BaseDialog>

  <!-- Nested content when used inside another modal -->
  <div v-else class="flex flex-col h-full">
    <div class="px-4 py-3 border-b border-gray-200">
      <div class="flex items-start">
        <Icon icon="fal fa-crop" class="text-blue-500 mr-3 mt-1" size="1.5rem" />
        <div class="flex-1">
          <div class="text-lg text-gray-700 font-bold">{{ t('Crop Image') }}</div>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-auto px-5 py-4">
      <div class="flex flex-col items-center space-y-4">
        <div class="relative border border-gray-300 rounded-lg overflow-hidden">
          <canvas
            ref="canvas"
            :width="canvasWidth"
            :height="canvasHeight"
            class="block cursor-crosshair"
            @mousedown="startCrop"
            @mousemove="updateCrop"
            @mouseup="endCrop"
            @touchstart="startCrop"
            @touchmove="updateCrop"
            @touchend="endCrop"
          />
          <!-- Crop overlay -->
          <div
            v-if="cropRect"
            class="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20"
            :style="cropStyle"
            @mousedown.stop="startMoveCrop"
            @touchstart.stop.prevent="startMoveCrop"
          >
            <div
              class="absolute w-3 h-3 bg-white border border-blue-500 rounded-sm cursor-nwse-resize"
              style="top: 0; left: 0; transform: translate(-50%, -50%);"
              @mousedown.stop="(e) => startResizeCrop(e, 'nw')"
              @touchstart.stop.prevent="(e) => startResizeCrop(e, 'nw')"
            ></div>
            <div
              class="absolute w-3 h-3 bg-white border border-blue-500 rounded-sm cursor-nesw-resize"
              style="top: 0; left: 50%; transform: translate(-50%, -50%);"
              @mousedown.stop="(e) => startResizeCrop(e, 'n')"
              @touchstart.stop.prevent="(e) => startResizeCrop(e, 'n')"
            ></div>
            <div
              class="absolute w-3 h-3 bg-white border border-blue-500 rounded-sm cursor-nwse-resize"
              style="top: 0; left: 100%; transform: translate(-50%, -50%);"
              @mousedown.stop="(e) => startResizeCrop(e, 'ne')"
              @touchstart.stop.prevent="(e) => startResizeCrop(e, 'ne')"
            ></div>
            <div
              class="absolute w-3 h-3 bg-white border border-blue-500 rounded-sm cursor-nesw-resize"
              style="top: 50%; left: 0; transform: translate(-50%, -50%);"
              @mousedown.stop="(e) => startResizeCrop(e, 'w')"
              @touchstart.stop.prevent="(e) => startResizeCrop(e, 'w')"
            ></div>
            <div
              class="absolute w-3 h-3 bg-white border border-blue-500 rounded-sm cursor-nesw-resize"
              style="top: 50%; left: 100%; transform: translate(-50%, -50%);"
              @mousedown.stop="(e) => startResizeCrop(e, 'e')"
              @touchstart.stop.prevent="(e) => startResizeCrop(e, 'e')"
            ></div>
            <div
              class="absolute w-3 h-3 bg-white border border-blue-500 rounded-sm cursor-nwse-resize"
              style="top: 100%; left: 0; transform: translate(-50%, -50%);"
              @mousedown.stop="(e) => startResizeCrop(e, 'sw')"
              @touchstart.stop.prevent="(e) => startResizeCrop(e, 'sw')"
            ></div>
            <div
              class="absolute w-3 h-3 bg-white border border-blue-500 rounded-sm cursor-nesw-resize"
              style="top: 100%; left: 50%; transform: translate(-50%, -50%);"
              @mousedown.stop="(e) => startResizeCrop(e, 's')"
              @touchstart.stop.prevent="(e) => startResizeCrop(e, 's')"
            ></div>
            <div
              class="absolute w-3 h-3 bg-white border border-blue-500 rounded-sm cursor-nwse-resize"
              style="top: 100%; left: 100%; transform: translate(-50%, -50%);"
              @mousedown.stop="(e) => startResizeCrop(e, 'se')"
              @touchstart.stop.prevent="(e) => startResizeCrop(e, 'se')"
            ></div>
          </div>
        </div>

        <div class="text-sm text-gray-600 text-center">
          {{ t('Drag to select crop area') }}
        </div>

        <div v-if="cropRect" class="text-xs text-gray-500 text-center">
          {{ Math.round(cropRect.width) }} × {{ Math.round(cropRect.height) }} px
        </div>
      </div>
    </div>

    <div class="px-3 py-2 border-t border-gray-200 flex space-x-2">
      <button
        class="cursor-pointer py-3 flex-1 bg-gray-600 text-white rounded-lg drop-shadow hover:bg-gray-700 transition-colors"
        @click="close"
      >
        {{ t('Cancel') }}
      </button>
      <button
        class="cursor-pointer py-3 flex-1 bg-blue-600 text-white rounded-lg drop-shadow hover:bg-blue-700 transition-colors"
        :disabled="!cropRect"
        @click="confirmCrop"
      >
        {{ t('Crop & Save') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import Icon from './Icon.vue'
import { t } from '~src/i18n'
import { vibrate } from '~src/services/vibrate'
import BaseDialog from './BaseDialog.vue'

const props = defineProps<{
  modelValue: boolean
  imageSrc: string
  nested?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'confirm', croppedImage: string): void
}>()

const showModal = computed({
  get: () => props.modelValue,
  set: (value) => {
    if (!props.nested) {
      emit('update:modelValue', value)
    }
  }
})

const canvas = ref<HTMLCanvasElement | null>(null)
const canvasWidth = ref(400)
const canvasHeight = ref(300)

interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

const cropRect = ref<CropRect | null>(null)
const isCropping = ref(false)
const startPoint = ref<{ x: number; y: number } | null>(null)
const cropDragMode = ref<'draw' | 'move' | 'resize' | null>(null)
const cropActiveHandle = ref<'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null>(null)
const cropDragStartRect = ref<CropRect | null>(null)
const cropMoveOffset = ref<{ dx: number; dy: number } | null>(null)

const cropStyle = computed(() => {
  if (!cropRect.value) return {}
  return {
    left: `${cropRect.value.x}px`,
    top: `${cropRect.value.y}px`,
    width: `${cropRect.value.width}px`,
    height: `${cropRect.value.height}px`
  }
})

// Clear canvas completely
function clearCanvas() {
  if (!canvas.value) return

  const ctx = canvas.value.getContext('2d')
  if (!ctx) return

  // Clear the entire canvas area
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
}

// Draw image on canvas
function drawImage() {
  if (!canvas.value || !props.imageSrc) {
    clearCanvas()
    return
  }

  const ctx = canvas.value.getContext('2d')
  if (!ctx) return

  // Clear canvas first
  clearCanvas()

  const img = new Image()
  img.onload = () => {
    // Calculate canvas dimensions to fit image while maintaining aspect ratio
    const maxWidth = 400
    const maxHeight = 300
    const aspectRatio = img.width / img.height

    if (img.width > img.height) {
      canvasWidth.value = maxWidth
      canvasHeight.value = maxWidth / aspectRatio
    } else {
      canvasHeight.value = maxHeight
      canvasWidth.value = maxHeight * aspectRatio
    }

    // Clear canvas again with new dimensions
    ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)

    // Draw image
    ctx.drawImage(img, 0, 0, canvasWidth.value, canvasHeight.value)
  }
  img.src = props.imageSrc
}

function startCrop(event: MouseEvent | TouchEvent) {
  event.preventDefault()
  if (!canvas.value) return

  isCropping.value = true
  cropActiveHandle.value = null
  cropDragMode.value = 'draw'

  const rect = canvas.value.getBoundingClientRect()
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY

  startPoint.value = {
    x: clientX - rect.left,
    y: clientY - rect.top
  }

  cropRect.value = { x: startPoint.value.x, y: startPoint.value.y, width: 0, height: 0 }
  addCropDragListeners()
}

function updateCrop(event: MouseEvent | TouchEvent) {
  if (!isCropping.value || !startPoint.value || !canvas.value) return

  event.preventDefault()

  const rect = canvas.value.getBoundingClientRect()
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY

  const currentX = clientX - rect.left
  const currentY = clientY - rect.top

  if (cropDragMode.value === 'draw') {
    cropRect.value = {
      x: Math.min(startPoint.value.x, currentX),
      y: Math.min(startPoint.value.y, currentY),
      width: Math.abs(currentX - startPoint.value.x),
      height: Math.abs(currentY - startPoint.value.y)
    }
    return
  }

  if (!cropRect.value || !cropDragStartRect.value) return

  if (cropDragMode.value === 'move') {
    if (!cropMoveOffset.value) return
    let newX = currentX - cropMoveOffset.value.dx
    let newY = currentY - cropMoveOffset.value.dy
    newX = Math.max(0, Math.min(newX, rect.width - cropDragStartRect.value.width))
    newY = Math.max(0, Math.min(newY, rect.height - cropDragStartRect.value.height))
    cropRect.value = { x: newX, y: newY, width: cropDragStartRect.value.width, height: cropDragStartRect.value.height }
    return
  }

  if (cropDragMode.value === 'resize' && cropActiveHandle.value) {
    const minSize = 5
    let { x, y, width, height } = cropDragStartRect.value
    const endX = x + width
    const endY = y + height

    if (cropActiveHandle.value.includes('n')) {
      y = Math.max(0, Math.min(currentY, endY - minSize))
      height = endY - y
    }
    if (cropActiveHandle.value.includes('s')) {
      const newBottom = Math.max(y + minSize, Math.min(currentY, rect.height))
      height = newBottom - y
    }
    if (cropActiveHandle.value.includes('w')) {
      x = Math.max(0, Math.min(currentX, endX - minSize))
      width = endX - x
    }
    if (cropActiveHandle.value.includes('e')) {
      const newRight = Math.max(x + minSize, Math.min(currentX, rect.width))
      width = newRight - x
    }

    cropRect.value = { x, y, width, height }
  }
}

function endCrop() {
  isCropping.value = false
  cropDragMode.value = null
  cropActiveHandle.value = null
  cropDragStartRect.value = null
  cropMoveOffset.value = null
  removeCropDragListeners()
}

function startMoveCrop(event: MouseEvent | TouchEvent) {
  if (!canvas.value || !cropRect.value) return
  const rect = canvas.value.getBoundingClientRect()
  const clientX = 'touches' in event ? event.touches[0].clientX : (event as MouseEvent).clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : (event as MouseEvent).clientY
  const p = { x: clientX - rect.left, y: clientY - rect.top }
  isCropping.value = true
  cropDragMode.value = 'move'
  cropDragStartRect.value = { ...cropRect.value }
  cropMoveOffset.value = { dx: p.x - cropRect.value.x, dy: p.y - cropRect.value.y }
  addCropDragListeners()
}

function startResizeCrop(event: MouseEvent | TouchEvent, handle: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw') {
  if (!canvas.value || !cropRect.value) return
  const rect = canvas.value.getBoundingClientRect()
  const clientX = 'touches' in event ? event.touches[0].clientX : (event as MouseEvent).clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : (event as MouseEvent).clientY
  const p = { x: clientX - rect.left, y: clientY - rect.top }
  isCropping.value = true
  cropDragMode.value = 'resize'
  cropActiveHandle.value = handle
  startPoint.value = p
  cropDragStartRect.value = { ...cropRect.value }
  addCropDragListeners()
}

function addCropDragListeners() {
  window.addEventListener('mousemove', updateCrop as unknown as EventListener, { passive: false })
  window.addEventListener('mouseup', endCrop as unknown as EventListener, { passive: false })
  window.addEventListener('touchmove', updateCrop as unknown as EventListener, { passive: false })
  window.addEventListener('touchend', endCrop as unknown as EventListener, { passive: false })
}

function removeCropDragListeners() {
  window.removeEventListener('mousemove', updateCrop as unknown as EventListener)
  window.removeEventListener('mouseup', endCrop as unknown as EventListener)
  window.removeEventListener('touchmove', updateCrop as unknown as EventListener)
  window.removeEventListener('touchend', endCrop as unknown as EventListener)
}

function confirmCrop() {
  if (!cropRect.value || !canvas.value) return

  const ctx = canvas.value.getContext('2d')
  if (!ctx) return

  // Create a new canvas for the cropped image
  const croppedCanvas = document.createElement('canvas')
  const croppedCtx = croppedCanvas.getContext('2d')
  if (!croppedCtx) return

  croppedCanvas.width = cropRect.value.width
  croppedCanvas.height = cropRect.value.height

  // Get image data from the original canvas
  const imageData = ctx.getImageData(
    cropRect.value.x,
    cropRect.value.y,
    cropRect.value.width,
    cropRect.value.height
  )

  croppedCtx.putImageData(imageData, 0, 0)

  // Convert to base64
  const croppedImage = croppedCanvas.toDataURL('image/jpeg', 0.9)

  vibrate()
  emit('confirm', croppedImage)
  // Always close via v-model
  emit('update:modelValue', false)
}

function close() {
  vibrate()
  cropRect.value = null
  isCropping.value = false
  startPoint.value = null

  // Clear canvas and reset dimensions
  clearCanvas()
  canvasWidth.value = 400
  canvasHeight.value = 300

  // Always close via v-model
  emit('update:modelValue', false)
}

// Watch for modal opening and image changes
watch([() => props.modelValue, () => props.imageSrc], async ([newValue, newImageSrc], [oldValue, oldImageSrc]) => {
  // Clear canvas when modal closes or image source is removed
  if (!newValue || !newImageSrc) {
    clearCanvas()
    return
  }

  // Draw image when modal opens with image source or when image source changes while modal is open
  if (newValue && newImageSrc && (newValue !== oldValue || newImageSrc !== oldImageSrc)) {
    await nextTick()
    drawImage()
  }
})

// Initialize canvas when component is mounted
onMounted(() => {
  clearCanvas()
})

// Additional watcher to handle case where modal opens and we already have an image
watch(() => props.modelValue, async (newValue, oldValue) => {
  if (newValue && !oldValue) {
    if (props.imageSrc) {
      await nextTick()
      drawImage()
    } else {
      clearCanvas()
    }
  }
})
</script>
