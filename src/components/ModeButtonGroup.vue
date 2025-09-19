<template>
  <div class="inline-flex relative bg-blue-100/20 rounded-lg p-1 h-10">
    <!-- Animated highlight -->
    <div
      class="absolute top-1 bottom-1 bg-blue-600/30 rounded-md shadow-sm transition-all duration-300 ease-in-out"
      :class="highlightClass"
    ></div>

    <!-- View Button -->
    <button
      @click="setMode('view')"
      class="relative z-10 flex items-center justify-center px-2 py-1.5 rounded-md transition-colors duration-200 whitespace-nowrap"
      :class="mode === 'view' ? 'text-white' : 'text-blue-300 hover:text-blue-500'"
      :title="t('View')"
    >
      <Icon icon="fas fa-eye" size="0.8rem" class="mt-1" />
    </button>

    <!-- Edit Button -->
    <button
      @click="setMode('edit')"
      class="relative z-10 flex items-center justify-center px-2 py-1.5 rounded-md transition-colors duration-200 whitespace-nowrap"
      :class="mode === 'edit' ? 'text-white' : 'text-blue-300 hover:text-blue-500'"
      :title="t('Edit')"
    >
      <Icon icon="fas fa-pen" size="0.8rem" class="mt-1" />
    </button>

    <!-- Checklist Button -->
    <button
      v-if="props.showChecklist"
      @click="setMode('checklist')"
      class="relative z-10 flex items-center justify-center px-2 py-1.5 rounded-md transition-colors duration-200 whitespace-nowrap"
      :class="mode === 'checklist' ? 'text-white' : 'text-blue-300 hover:text-blue-500'"
      :title="t('Checklist')"
    >
      <Icon icon="fas fa-shopping-cart" size="0.8rem" class="mt-1" />
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
  showChecklist?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showChecklist: true,
})
const emit = defineEmits<{
  (e: 'mode-change', mode: 'view' | 'edit' | 'checklist'): void
}>()

const highlightClass = computed(() => {
  if (!props.showChecklist) {
    // Two-position slider (view/edit)
    if (props.mode === 'edit') return 'left-[50%] right-1'
    return 'left-1 right-[50%]'
  }
  // Three-position slider (view/edit/checklist)
  switch (props.mode) {
    case 'view':
      return 'left-1 right-[66.5%]'
    case 'edit':
      return 'left-[33%] right-[33%]'
    case 'checklist':
      return 'left-[66.5%] right-1'
    default:
      return 'left-1 right-[66.5%]'
  }
})

function setMode(newMode: 'view' | 'edit' | 'checklist') {
  if (newMode !== props.mode) {
    vibrate()
    emit('mode-change', newMode)
  }
}
</script>
