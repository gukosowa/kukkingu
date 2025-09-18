<template>
  <BaseDialog v-model:modelValue="show" size="sm" @close="close">
    <template #header>
      <div class="px-4 py-3 flex items-center justify-between">
        <div class="text-lg text-gray-700 font-bold">{{ t('Backup') }}</div>
        <button
          @click="close"
          class="text-gray-400 hover:text-gray-600 transition-colors p-1"
          title="Close"
        >
          <Icon icon="fal fa-times" size="1.2rem" />
        </button>
      </div>
    </template>

    <template #content>
      <div class="flex flex-col space-y-4 p-4">
        <Button @click="exportToFile" class="w-full">
          <Icon icon="fal fa-download" size="1rem" class="mr-2" />
          {{ t('Export to file') }}
        </Button>
        <Button @click="loadFromFile" class="w-full">
          <Icon icon="fal fa-upload" size="1rem" class="mr-2" />
          {{ t('Load from file') }}
        </Button>
      </div>
    </template>

    <template #footer>
      <div class="px-3 py-2 flex gap-3">
        <button
          class="cursor-pointer py-3 px-4 bg-gray-500 text-white rounded-lg drop-shadow flex-1 hover:bg-gray-600 transition-colors"
          @click="close"
        >
          {{ t('Close') }}
        </button>
      </div>
    </template>
  </BaseDialog>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import BaseDialog from './BaseDialog.vue'
import Button from './Button.vue'
import Icon from './Icon.vue'
import { t } from '~src/i18n'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'export'): void
  (e: 'load'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

function exportToFile() {
  emit('export')
  show.value = false
}

function loadFromFile() {
  emit('load')
  show.value = false
}

function close() {
  show.value = false
}
</script>
