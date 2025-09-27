<template>
  <button
    type="button"
    :disabled="disabled"
    :class="[
      'inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium whitespace-nowrap',
      disabled
        ? 'opacity-50 cursor-not-allowed'
        : color === 'text-only'
          ? 'text-gray-500 bg-transparent border-transparent shadow-none hover:bg-gray-100 focus:ring-gray-500'
          : [
              'shadow-sm text-white',
              `bg-${color}-${tone + 100}`,
              `hover:bg-${color}-${tone + 200}`,
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              `focus:ring-${color}-${tone}`
            ],
      cls
    ]"
    @click="handleClick"
  >
    <slot>{{ text }}</slot>
  </button>
</template>

<script lang="ts" setup>
import { vibrate } from '~src/services/vibrate'
const props = withDefaults(
  defineProps<{
    text?: string
    color?: 'blue' | 'pink' | 'green' | 'red' | 'gray' | 'text-only'
    tone?: number
    class?: string
    disabled?: boolean
  }>(),
  { text: '', color: 'blue', tone: 500, class: '', disabled: false }
)
const cls = props.class || ''
const emit = defineEmits<{ (e: 'click', event?: Event): void }>()

function handleClick(event: Event) {
  if (props.disabled) return
  vibrate()
  emit('click', event)
}
</script>

