<template>
  <BaseDialog v-model="showModal" size="full" @close="close" contentClass="p-0" class="!p-2">
    <template #content>
      <div
        class="relative w-full h-full min-h-[80vh] bg-black flex items-center justify-center overflow-hidden"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <!-- Close button -->
        <button
          @click="close"
          class="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 transition-all"
          aria-label="Close"
        >
          <i class="fal fa-times" />
        </button>

        <!-- Zoom controls -->
        <div class="absolute top-4 left-4 z-10 flex space-x-2">
          <button
            @click="zoomIn"
            class="bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 transition-all"
            aria-label="Zoom in"
          >
            <i class="fal fa-plus" />
          </button>
          <button
            @click="zoomOut"
            class="bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 transition-all"
            aria-label="Zoom out"
          >
            <i class="fal fa-minus" />
          </button>
          <button
            @click="resetZoom"
            class="bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 transition-all"
            aria-label="Reset zoom"
          >
            <i class="fal fa-expand" />
          </button>
        </div>

        <!-- Zoom level indicator -->
        <div class="absolute bottom-4 left-4 z-10 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
          {{ Math.round(zoomLevel * 100) }}%
        </div>

        <!-- Image container -->
        <div
          ref="imageContainer"
          class="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
          @wheel="handleWheel"
          @mousedown="startPan"
          @mousemove="updatePan"
          @mouseup="endPan"
          @mouseleave="endPan"
        >
          <img
            ref="imageElement"
            :src="imageSrc"
            :style="imageStyle"
            class="max-w-none select-none"
            alt="Recipe image"
            draggable="false"
          />
        </div>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import BaseDialog from './BaseDialog.vue'
import { vibrate } from '~src/services/vibrate'

const props = defineProps<{
  modelValue: boolean
  imageSrc: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const showModal = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const imageContainer = ref<HTMLDivElement | null>(null)
const imageElement = ref<HTMLImageElement | null>(null)

// Zoom and pan state
const zoomLevel = ref(1)
const panX = ref(0)
const panY = ref(0)
const isPanning = ref(false)
const lastMouseX = ref(0)
const lastMouseY = ref(0)

// Touch gesture state for pinch zoom
const initialDistance = ref(0)
const initialZoom = ref(1)
const touches = ref<Touch[]>([])

const minZoom = 0.5
const maxZoom = 5
const zoomStep = 0.25

const imageStyle = computed(() => ({
  transform: `scale(${zoomLevel.value}) translate(${panX.value}px, ${panY.value}px)`,
  transition: isPanning.value ? 'none' : 'transform 0.2s ease-out'
}))

function zoomIn() {
  zoomLevel.value = Math.min(maxZoom, zoomLevel.value + zoomStep)
  constrainPan()
}

function zoomOut() {
  zoomLevel.value = Math.max(minZoom, zoomLevel.value - zoomStep)
  constrainPan()
}

function resetZoom() {
  zoomLevel.value = 1
  panX.value = 0
  panY.value = 0
}

function handleWheel(event: WheelEvent) {
  event.preventDefault()
  const delta = event.deltaY > 0 ? -zoomStep : zoomStep
  zoomLevel.value = Math.max(minZoom, Math.min(maxZoom, zoomLevel.value + delta))
  constrainPan()
}

function startPan(event: MouseEvent) {
  if (zoomLevel.value <= 1) return
  isPanning.value = true
  lastMouseX.value = event.clientX
  lastMouseY.value = event.clientY
  event.preventDefault()
}

function updatePan(event: MouseEvent) {
  if (!isPanning.value || zoomLevel.value <= 1) return

  const deltaX = event.clientX - lastMouseX.value
  const deltaY = event.clientY - lastMouseY.value

  // Scale pan movement by zoom level for more natural feel
  // When zoomed in, movement should be slower relative to zoom
  const panSpeed = 1 / zoomLevel.value
  panX.value += deltaX * panSpeed
  panY.value += deltaY * panSpeed

  lastMouseX.value = event.clientX
  lastMouseY.value = event.clientY

  constrainPan()
}

function endPan() {
  isPanning.value = false
}

function constrainPan() {
  if (!imageElement.value || !imageContainer.value || zoomLevel.value <= 1) {
    panX.value = 0
    panY.value = 0
    return
  }

  const containerRect = imageContainer.value.getBoundingClientRect()
  const imageRect = imageElement.value.getBoundingClientRect()

  // Calculate maximum pan distances
  const maxPanX = Math.max(0, (imageRect.width - containerRect.width) / 2)
  const maxPanY = Math.max(0, (imageRect.height - containerRect.height) / 2)

  panX.value = Math.max(-maxPanX, Math.min(maxPanX, panX.value))
  panY.value = Math.max(-maxPanY, Math.min(maxPanY, panY.value))
}

// Touch gesture handlers for pinch zoom and single-touch drag
function getDistance(touch1: Touch, touch2: Touch): number {
  const dx = touch1.clientX - touch2.clientX
  const dy = touch1.clientY - touch2.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

function handleTouchStart(event: TouchEvent) {
  touches.value = Array.from(event.touches)

  // Check if touch is on a button - if so, don't prevent default
  const target = event.target as HTMLElement
  const isButton = target.tagName === 'BUTTON' || target.closest('button')

  if (!isButton) {
    // Prevent default scrolling for non-button touch interactions within the modal
    event.preventDefault()
  }

  if (event.touches.length === 2 && !isButton) {
    // Start pinch gesture (only if not on button)
    initialDistance.value = getDistance(event.touches[0], event.touches[1])
    initialZoom.value = zoomLevel.value
  } else if (event.touches.length === 1 && zoomLevel.value > 1 && !isButton) {
    // Start single-touch drag (only when zoomed in and not on button)
    isPanning.value = true
    lastMouseX.value = event.touches[0].clientX
    lastMouseY.value = event.touches[0].clientY
  }
}

function handleTouchMove(event: TouchEvent) {
  // Check if touch is on a button - if so, don't prevent default
  const target = event.target as HTMLElement
  const isButton = target.tagName === 'BUTTON' || target.closest('button')

  if (!isButton) {
    // Prevent default scrolling for non-button touch interactions within the modal
    event.preventDefault()
  }

  if (event.touches.length === 2 && !isButton) {
    // Handle pinch zoom (only if not on button)
    const currentDistance = getDistance(event.touches[0], event.touches[1])
    const scale = currentDistance / initialDistance.value
    zoomLevel.value = Math.max(minZoom, Math.min(maxZoom, initialZoom.value * scale))
    constrainPan()
  } else if (event.touches.length === 1 && isPanning.value && zoomLevel.value > 1 && !isButton) {
    // Handle single-touch drag (only when zoomed in and not on button)
    const touch = event.touches[0]
    const deltaX = touch.clientX - lastMouseX.value
    const deltaY = touch.clientY - lastMouseY.value

    // Scale pan movement by zoom level for more natural feel
    const panSpeed = 1 / zoomLevel.value
    panX.value += deltaX * panSpeed
    panY.value += deltaY * panSpeed

    lastMouseX.value = touch.clientX
    lastMouseY.value = touch.clientY

    constrainPan()
  }
}

function handleTouchEnd(event: TouchEvent) {
  touches.value = Array.from(event.touches)

  // End single-touch drag
  if (event.touches.length === 0) {
    isPanning.value = false
  }

  // Check if touch is on a button - if so, don't prevent default
  const target = event.target as HTMLElement
  const isButton = target.tagName === 'BUTTON' || target.closest('button')

  if (!isButton) {
    // Prevent default behavior for non-button interactions
    event.preventDefault()
  }
}

function close() {
  vibrate()
  resetZoom()
  showModal.value = false
}

// Reset zoom when modal opens
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    resetZoom()
  }
})

// Handle keyboard shortcuts
function handleKeydown(event: KeyboardEvent) {
  if (!props.modelValue) return

  switch (event.key) {
    case '+':
    case '=':
      event.preventDefault()
      zoomIn()
      break
    case '-':
    case '_':
      event.preventDefault()
      zoomOut()
      break
    case '0':
      event.preventDefault()
      resetZoom()
      break
    case 'Escape':
      event.preventDefault()
      showModal.value = false
      break
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
/* Prevent text selection while panning */
.cursor-grab {
  cursor: grab;
}

.cursor-grabbing {
  cursor: grabbing;
}
</style>
