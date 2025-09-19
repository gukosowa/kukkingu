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
        <div class="absolute bottom-4 right-4 z-10 flex flex-col items-center space-y-2">
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
            class="w-full h-auto max-w-none select-none block"
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
const isZooming = ref(false)
const zoomingTimeout = ref<number | null>(null)
const lastMouseX = ref(0)
const lastMouseY = ref(0)

// Double-tap detection state
const lastTapTime = ref(0)
const lastTapX = ref(0)
const lastTapY = ref(0)
const DOUBLE_TAP_MAX_DELAY_MS = 300
const DOUBLE_TAP_MAX_DISTANCE_PX = 24
const doubleTapZoomFactor = 3

// Animation toggle for smooth zoom/pan on double-tap
const animateNextTransform = ref(false)
const animatedZoomDurationMs = 220

// Touch gesture state for pinch zoom
const initialDistance = ref(0)
const initialZoom = ref(1)
const touches = ref<Touch[]>([])

const minZoom = 0.7
const maxZoom = 5
const zoomStep = 1

const imageStyle = computed(() => ({
  transform: `translate(${panX.value}px, ${panY.value}px) scale(${zoomLevel.value})`,
  transition: isPanning.value || isZooming.value
    ? 'none'
    : animateNextTransform.value
      ? `transform ${animatedZoomDurationMs}ms ease-out`
      : 'transform 0.2s ease-out',
  transformOrigin: 'center center'
}))

function startZooming() {
  isZooming.value = true
  if (zoomingTimeout.value) window.clearTimeout(zoomingTimeout.value)
  zoomingTimeout.value = window.setTimeout(() => {
    isZooming.value = false
  }, 80)
}

function zoomIn() {
  const rect = imageContainer.value?.getBoundingClientRect()
  const centerX = rect ? rect.left + rect.width / 2 : 0
  const centerY = rect ? rect.top + rect.height / 2 : 0
  zoomToAnimated(zoomLevel.value + zoomStep, centerX, centerY)
}

function zoomOut() {
  const rect = imageContainer.value?.getBoundingClientRect()
  const centerX = rect ? rect.left + rect.width / 2 : 0
  const centerY = rect ? rect.top + rect.height / 2 : 0
  zoomToAnimated(zoomLevel.value - zoomStep, centerX, centerY)
}

function resetZoom() {
  zoomLevel.value = 1
  panX.value = 0
  panY.value = 0
}

function handleWheel(event: WheelEvent) {
  event.preventDefault()
  const delta = event.deltaY > 0 ? -zoomStep : zoomStep
  startZooming()
  zoomTo(zoomLevel.value + delta, event.clientX, event.clientY)
}

function startPan(event: MouseEvent) {
  isPanning.value = true
  lastMouseX.value = event.clientX
  lastMouseY.value = event.clientY
  event.preventDefault()
}

function updatePan(event: MouseEvent) {
  if (!isPanning.value) return

  const deltaX = event.clientX - lastMouseX.value
  const deltaY = event.clientY - lastMouseY.value

  panX.value += deltaX
  panY.value += deltaY

  lastMouseX.value = event.clientX
  lastMouseY.value = event.clientY

  constrainPan()
}

function endPan() {
  isPanning.value = false
}

function constrainPan() {
  if (!imageElement.value || !imageContainer.value) {
    panX.value = 0
    panY.value = 0
    return
  }

  const containerRect = imageContainer.value.getBoundingClientRect()
  const naturalWidth = imageElement.value.naturalWidth
  const naturalHeight = imageElement.value.naturalHeight

  // Image is rendered to fit container width
  const renderedWidth = containerRect.width * zoomLevel.value
  const renderedHeight = (naturalHeight / naturalWidth) * containerRect.width * zoomLevel.value

  // Clamp so the image edge can move to the container center
  const maxPanX = renderedWidth / 2
  const maxPanY = renderedHeight / 2

  panX.value = Math.max(-maxPanX, Math.min(maxPanX, panX.value))
  panY.value = Math.max(-maxPanY, Math.min(maxPanY, panY.value))
}

function zoomTo(targetZoom: number, originClientX: number, originClientY: number) {
  const clampedZoom = Math.max(minZoom, Math.min(maxZoom, targetZoom))
  const currentZoom = zoomLevel.value

  if (!imageContainer.value || clampedZoom === currentZoom) {
    zoomLevel.value = clampedZoom
    constrainPan()
    return
  }

  const rect = imageContainer.value.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2

  const dx = originClientX - centerX
  const dy = originClientY - centerY

  const scaleRatio = clampedZoom / currentZoom
  // Keep focal point under cursor: pan' = r*pan + (1 - r)*c
  panX.value = scaleRatio * panX.value + (1 - scaleRatio) * dx
  panY.value = scaleRatio * panY.value + (1 - scaleRatio) * dy

  zoomLevel.value = clampedZoom
  constrainPan()
}

function zoomToAnimated(targetZoom: number, originClientX: number, originClientY: number) {
  animateNextTransform.value = true
  // Do not call startZooming() here to allow transitions
  zoomTo(targetZoom, originClientX, originClientY)
  window.setTimeout(() => {
    animateNextTransform.value = false
  }, animatedZoomDurationMs + 30)
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
    // Transition into pinch mode: disable any active panning so we don't mix gestures
    isPanning.value = false
    // Start pinch gesture (only if not on button)
    initialDistance.value = getDistance(event.touches[0], event.touches[1])
    initialZoom.value = zoomLevel.value
  } else if (event.touches.length === 1 && !isButton) {
    // Start single-touch drag (not on button)
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

    // Midpoint between the two touches in viewport coordinates
    const midX = (event.touches[0].clientX + event.touches[1].clientX) / 2
    const midY = (event.touches[0].clientY + event.touches[1].clientY) / 2

    startZooming()
    zoomTo(initialZoom.value * scale, midX, midY)
  } else if (event.touches.length === 1 && isPanning.value && !isButton) {
    // Handle single-touch drag (not on button)
    const touch = event.touches[0]
    const deltaX = touch.clientX - lastMouseX.value
    const deltaY = touch.clientY - lastMouseY.value

    panX.value += deltaX
    panY.value += deltaY

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
  } else if (event.touches.length === 1) {
    // Seamlessly transition from pinch to pan without jumping by
    // seeding the pan start position with the remaining finger.
    const remaining = event.touches[0]
    if (remaining) {
      isPanning.value = true
      lastMouseX.value = remaining.clientX
      lastMouseY.value = remaining.clientY
    }
  }

  // Check if touch is on a button - if so, don't prevent default
  const target = event.target as HTMLElement
  const isButton = target.tagName === 'BUTTON' || target.closest('button')

  // Detect double-tap to zoom towards tap location
  if (!isButton) {
    const changed = event.changedTouches && event.changedTouches[0]
    if (changed) {
      const now = Date.now()
      const dt = now - lastTapTime.value
      const dx = changed.clientX - lastTapX.value
      const dy = changed.clientY - lastTapY.value
      const dist = Math.hypot(dx, dy)

      if (dt > 0 && dt <= DOUBLE_TAP_MAX_DELAY_MS && dist <= DOUBLE_TAP_MAX_DISTANCE_PX) {
        const nextZoom = Math.max(minZoom, Math.min(maxZoom, zoomLevel.value * doubleTapZoomFactor))
        zoomToAnimated(nextZoom, changed.clientX, changed.clientY)
        // Reset to avoid triple counting
        lastTapTime.value = 0
      } else {
        lastTapTime.value = now
        lastTapX.value = changed.clientX
        lastTapY.value = changed.clientY
      }
    }
  }

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
