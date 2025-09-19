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
          class="fixed z-50 bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 transition-all pointer-events-auto"
          :style="safeTopRightStyle"
          aria-label="Close"
        >
          <i class="fal fa-times" />
        </button>

        <!-- Zoom controls -->
        <div class="fixed z-50 flex flex-col items-center space-y-2 pointer-events-auto" :style="safeBottomRightStyle">
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
        <div class="fixed z-50 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm pointer-events-none" :style="safeBottomLeftStyle">
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
import type { CSSProperties } from 'vue'
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

// Momentum tracking for inertial panning
type MovementSample = { t: number, dx: number, dy: number, dt: number }
const movementSamples = ref<MovementSample[]>([])
const lastMovementTime = ref(0)
const isInertiaAnimating = ref(false)
const inertiaRafId = ref<number | null>(null)
const sampleWindowMs = 120
const maxSamples = 10

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
  transition: isPanning.value || isZooming.value || isInertiaAnimating.value
    ? 'none'
    : animateNextTransform.value
      ? `transform ${animatedZoomDurationMs}ms ease-out`
      : 'transform 0.2s ease-out',
  transformOrigin: 'center center'
}))

// Safe-area aware fixed positions for UI controls so they never overflow
const controlOffsetPx = 16
const safeTopRightStyle = computed<CSSProperties>(() => ({
  top: `calc(env(safe-area-inset-top, 0px) + ${controlOffsetPx}px)`,
  right: `calc(env(safe-area-inset-right, 0px) + ${controlOffsetPx}px)`
}))
const safeBottomRightStyle = computed<CSSProperties>(() => ({
  bottom: `calc(env(safe-area-inset-bottom, 0px) + ${controlOffsetPx}px)`,
  right: `calc(env(safe-area-inset-right, 0px) + ${controlOffsetPx}px)`
}))
const safeBottomLeftStyle = computed<CSSProperties>(() => ({
  bottom: `calc(env(safe-area-inset-bottom, 0px) + ${controlOffsetPx}px)`,
  left: `calc(env(safe-area-inset-left, 0px) + ${controlOffsetPx}px)`
}))

function startZooming() {
  cancelInertia()
  isZooming.value = true
  if (zoomingTimeout.value) window.clearTimeout(zoomingTimeout.value)
  zoomingTimeout.value = window.setTimeout(() => {
    isZooming.value = false
  }, 80)
}

function zoomIn() {
  cancelInertia()
  const rect = imageContainer.value?.getBoundingClientRect()
  const centerX = rect ? rect.left + rect.width / 2 : 0
  const centerY = rect ? rect.top + rect.height / 2 : 0
  zoomToAnimated(zoomLevel.value + zoomStep, centerX, centerY)
}

function zoomOut() {
  cancelInertia()
  const rect = imageContainer.value?.getBoundingClientRect()
  const centerX = rect ? rect.left + rect.width / 2 : 0
  const centerY = rect ? rect.top + rect.height / 2 : 0
  zoomToAnimated(zoomLevel.value - zoomStep, centerX, centerY)
}

function resetZoom() {
  cancelInertia()
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
  cancelInertia()
  isPanning.value = true
  lastMouseX.value = event.clientX
  lastMouseY.value = event.clientY
  // reset momentum samples
  movementSamples.value = []
  lastMovementTime.value = performance.now()
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

  // record movement sample for inertia
  const now = performance.now()
  const dt = now - lastMovementTime.value
  if (dt > 0) {
    movementSamples.value.push({ t: now, dx: deltaX, dy: deltaY, dt })
    // prune old samples and cap length
    const cutoff = now - sampleWindowMs
    while (movementSamples.value.length && (movementSamples.value[0].t < cutoff || movementSamples.value.length > maxSamples)) {
      movementSamples.value.shift()
    }
  }
  lastMovementTime.value = now

  constrainPan()
}

function endPan() {
  if (!isPanning.value) return
  isPanning.value = false
  startInertiaFromSamples()
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

function centerOnPoint(clientX: number, clientY: number) {
  if (!imageContainer.value) return

  const rect = imageContainer.value.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2

  panX.value -= clientX - centerX
  panY.value -= clientY - centerY

  constrainPan()
}

function zoomToAnimatedCentered(targetZoom: number, originClientX: number, originClientY: number) {
  animateNextTransform.value = true
  // Keep the tap location stable during the zoom, then slide it to the center.
  zoomTo(targetZoom, originClientX, originClientY)
  centerOnPoint(originClientX, originClientY)
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
  cancelInertia()
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
    movementSamples.value = []
    lastMovementTime.value = performance.now()
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

    // record movement sample for inertia
    const now = performance.now()
    const dt = now - lastMovementTime.value
    if (dt > 0) {
      movementSamples.value.push({ t: now, dx: deltaX, dy: deltaY, dt })
      const cutoff = now - sampleWindowMs
      while (movementSamples.value.length && (movementSamples.value[0].t < cutoff || movementSamples.value.length > maxSamples)) {
        movementSamples.value.shift()
      }
    }
    lastMovementTime.value = now

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
  let didDoubleTap = false
  if (!isButton) {
    const changed = event.changedTouches && event.changedTouches[0]
    if (changed) {
      const nowTs = Date.now()
      const dtTap = nowTs - lastTapTime.value
      const dxTap = changed.clientX - lastTapX.value
      const dyTap = changed.clientY - lastTapY.value
      const distTap = Math.hypot(dxTap, dyTap)

      if (dtTap > 0 && dtTap <= DOUBLE_TAP_MAX_DELAY_MS && distTap <= DOUBLE_TAP_MAX_DISTANCE_PX) {
        const nextZoom = Math.max(minZoom, Math.min(maxZoom, zoomLevel.value * doubleTapZoomFactor))
        zoomToAnimatedCentered(nextZoom, changed.clientX, changed.clientY)
        didDoubleTap = true
        // Reset to avoid triple counting
        lastTapTime.value = 0
      } else {
        lastTapTime.value = nowTs
        lastTapX.value = changed.clientX
        lastTapY.value = changed.clientY
      }
    }
  }

  if (!isButton) {
    // Prevent default behavior for non-button interactions
    event.preventDefault()
  }

  // Start inertia if finger lifted and not a double-tap zoom
  if (event.touches.length === 0 && !didDoubleTap) {
    startInertiaFromSamples()
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
  cancelInertia()
})

// Helpers for inertia
function cancelInertia() {
  if (inertiaRafId.value != null) {
    cancelAnimationFrame(inertiaRafId.value)
    inertiaRafId.value = null
  }
  isInertiaAnimating.value = false
}

function computeVelocityFromSamples() {
  const samples = movementSamples.value
  if (!samples.length) return { vx: 0, vy: 0 }
  const now = performance.now()
  // Exponential weighting by recency, proportional to sample dt
  const tau = sampleWindowMs // ms
  let sumW = 0
  let vx = 0
  let vy = 0
  for (const s of samples) {
    if (s.dt <= 0) continue
    const instVx = s.dx / s.dt
    const instVy = s.dy / s.dt
    const age = Math.max(0, now - s.t)
    const w = s.dt * Math.exp(-age / tau)
    vx += instVx * w
    vy += instVy * w
    sumW += w
  }
  if (sumW <= 0) return { vx: 0, vy: 0 }
  return { vx: vx / sumW, vy: vy / sumW }
}

function startInertiaFromSamples() {
  const { vx, vy } = computeVelocityFromSamples()
  movementSamples.value = []
  startInertia(vx, vy)
}

function startInertia(initialVx: number, initialVy: number) {
  // minimum vector speed to start inertia (px/ms)
  const minSpeed = 0.02
  const speed0 = Math.hypot(initialVx, initialVy)
  if (speed0 < minSpeed) return

  cancelInertia()
  isInertiaAnimating.value = true

  let vx = initialVx
  let vy = initialVy
  let lastTs = 0
  // Fast-to-slow exponential decay (ease-out feel like Google Photos)
  // Start with short half-life then transition to a longer one.
  const HALF_LIFE_FAST_MS = 120
  const HALF_LIFE_SLOW_MS = 100
  const TRANSITION_MS = 180
  const lambdaFast = Math.log(2) / HALF_LIFE_FAST_MS
  const lambdaSlow = Math.log(2) / HALF_LIFE_SLOW_MS
  let startTs = 0

  const step = (ts: number) => {
    if (!isInertiaAnimating.value || showModal.value === false) {
      cancelInertia()
      return
    }
    if (!lastTs) lastTs = ts
    if (!startTs) startTs = ts
    const dt = ts - lastTs
    lastTs = ts

    // Stop when speed is negligible
    const speed = Math.hypot(vx, vy)
    if (speed < minSpeed) {
      cancelInertia()
      return
    }

    // Proposed movement before constraints
    const proposedX = panX.value + vx * dt
    const proposedY = panY.value + vy * dt
    const prevX = panX.value
    const prevY = panY.value
    panX.value = proposedX
    panY.value = proposedY
    constrainPan()

    // If clamped at boundary on an axis, zero velocity on that axis
    const clampedX = panX.value !== proposedX
    const clampedY = panY.value !== proposedY
    if (clampedX) vx = 0
    if (clampedY) vy = 0

    // Apply exponential decay to remaining velocity with time-varying lambda.
    const elapsed = ts - startTs
    const mix = Math.exp(-elapsed / TRANSITION_MS) // 1 -> 0 over time
    const lambda = lambdaSlow + (lambdaFast - lambdaSlow) * mix
    const decay = Math.exp(-lambda * dt)
    vx *= decay
    vy *= decay

    // If nothing changed (fully clamped and zeroed), stop
    if (panX.value === prevX && panY.value === prevY && Math.abs(vx) < minSpeed && Math.abs(vy) < minSpeed) {
      cancelInertia()
      return
    }

    inertiaRafId.value = requestAnimationFrame(step)
  }

  inertiaRafId.value = requestAnimationFrame(step)
}
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
