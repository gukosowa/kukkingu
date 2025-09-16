<template>
  <div v-if="modelValue">
    <!-- Backdrop -->
    <div
      class="fixed w-screen h-screen bg-black top-0 left-0 z-40 opacity-50"
    />

    <!-- Modal -->
    <Transition
      appear
      enter-active-class="transition ease-out duration-150"
      enter-from-class="opacity-0 translate-y-3"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="modelValue"
        class="fixed w-screen h-screen top-0 left-0 z-50"
        style="backdrop-filter: blur(1px)"
        @click="handleBackdropClick"
      >
        <div class="w-full min-h-full px-6 sm:px-12 md:px-8 py-8 flex flex-col justify-start items-center transform">
          <div
            class="bg-white rounded-xl drop-shadow w-full  md:w-[600px] flex flex-col overflow-hidden max-h-[90vh]"
            :class="size"
            @click.stop
          >
            <!-- Header Slot -->
            <div v-if="$slots.header" class="flex-shrink-0 border-b border-gray-200">
              <slot name="header" />
            </div>

            <!-- Content Slot -->
            <div
              v-if="$slots.content || $slots.default"
              class="flex-1 overflow-y-auto"
              :class="contentClassComputed"
            >
              <slot name="content">
                <slot />
              </slot>
            </div>

            <!-- Footer Slot -->
            <div v-if="$slots.footer" class="flex-shrink-0 border-t border-gray-200 bg-gray-50">
              <slot name="footer" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { vibrate } from '~src/services/vibrate'

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}

const props = defineProps<{
  modelValue: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  contentClass?: string
  closeOnBackdropClick?: boolean
  dense?: boolean
}>()

const emit = defineEmits<Emits>()

function handleBackdropClick() {
  if (props.closeOnBackdropClick ?? true) {
    vibrate()
    emit('close')
    emit('update:modelValue', false)
  }
}

// Size classes mapping
const sizeClasses = {
  sm: 'max-w-lg',
  md: 'max-w-3xl',
  lg: 'max-w-5xl',
  xl: 'max-w-7xl',
  full: 'max-w-full'
}

const size = computed(() => sizeClasses[props.size || 'lg'])
const contentClassComputed = computed(() => {
  if (props.dense) {
    return props.contentClass || ''
  }
  return props.contentClass || 'p-6'
})
</script>

<style scoped>
.drop-shadow {
  filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.1)) drop-shadow(0 1px 1px rgb(0 0 0 / 0.06));
}
</style>
