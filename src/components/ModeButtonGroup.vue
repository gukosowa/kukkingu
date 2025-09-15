<template>
  <div class="inline-flex relative bg-gray-100 rounded-lg p-1 h-11">
    <!-- Animated highlight -->
    <div
      class="absolute top-1 bottom-1 bg-gray-600 rounded-md shadow-sm transition-all duration-300 ease-in-out"
      :class="highlightClass"
    ></div>

    <!-- View Button -->
    <button
      @click="setMode('view')"
      class="relative z-10 flex items-center justify-center px-3 py-2 rounded-md transition-colors duration-200"
      :class="mode === 'view' ? 'text-white' : 'text-gray-600 hover:text-gray-900'"
      :title="t('View')"
    >
      <Icon icon="fal fa-eye" size="0.8rem" class="mr-0.5" />
    </button>

    <!-- Edit Button -->
    <button
      @click="setMode('edit')"
      class="relative z-10 flex items-center justify-center px-3 py-2 rounded-md transition-colors duration-200"
      :class="mode === 'edit' ? 'text-white' : 'text-gray-600 hover:text-gray-900'"
      :title="t('Edit')"
    >
      <Icon icon="fal fa-pen" size="0.8rem" class="mr-0.5" />
    </button>

    <!-- Checklist Button -->
    <button
      @click="setMode('checklist')"
      class="relative z-10 flex items-center justify-center px-3 py-2 rounded-md transition-colors duration-200"
      :class="mode === 'checklist' ? 'text-white' : 'text-gray-600 hover:text-gray-900'"
      :title="t('Checklist')"
    >
      <Icon icon="fal fa-shopping-cart" size="0.8rem" class="mr-0.5" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Icon from './Icon.vue'
import { t } from '~src/i18n'
import { vibrate } from '~src/services/vibrate'

interface Props {
  mode: 'view' | 'edit' | 'checklist'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'mode-change', mode: 'view' | 'edit' | 'checklist'): void
}>()

const highlightClass = computed(() => {
  switch (props.mode) {
    case 'view':
      return 'left-1 right-[66.67%]'
    case 'edit':
      return 'left-[33.33%] right-[33.33%]'
    case 'checklist':
      return 'left-[66.67%] right-1'
    default:
      return 'left-1 right-[66.67%]'
  }
})

function setMode(newMode: 'view' | 'edit' | 'checklist') {
  if (newMode !== props.mode) {
    vibrate()
    emit('mode-change', newMode)
  }
}
</script>
