<template>
  <button
    type="button"
    :class="[
      cls,
      'inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white',
      `bg-${color}-${tone + 100}`,
      `hover:bg-${color}-${tone + 200}`,
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      `focus:ring-${color}-${tone}`,
    ]"
    @click="$emit('click')"
  >
    <slot>{{ text }}</slot>
  </button>
</template>

<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    text?: string
    color?: 'blue' | 'pink' | 'green' | 'red' | 'gray'
    tone?: number
    class?: string
  }>(),
  { text: '', color: 'blue', tone: 500, class: '' }
)
const cls = props.class || ''
defineEmits<{ (e: 'click'): void }>()
</script>

