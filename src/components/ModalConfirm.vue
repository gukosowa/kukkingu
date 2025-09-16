<template>
  <BaseDialog v-model="showModal" size="sm" @close="clickNo">
    <template #header>
      <div class="px-4 py-3">
        <div class="text-lg text-gray-600 font-bold">
          {{ t('Really delete') }}?
        </div>
      </div>
    </template>

    <template #content>
      <div class="px-5 py-3">
        <div class="text-sm text-gray-500">
          > {{ props.removeName || '' }}
        </div>
      </div>
    </template>

    <template #footer>
      <div class="px-4 py-3 flex gap-4">
        <button
          class="cursor-pointer py-2 px-4 bg-gray-500 text-white rounded-lg drop-shadow flex-1 hover:bg-gray-600 transition-colors"
          @click.stop="clickNo"
        >
          {{ t('Cancel') }}
        </button>
        <button
          class="cursor-pointer py-2 px-4 bg-red-500 text-white rounded-lg drop-shadow flex-1 hover:bg-red-600 transition-colors"
          @click.stop="clickYes"
        >
          {{ t('Yes') }}
        </button>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { t } from '~src/i18n'
import { vibrate } from '~src/services/vibrate'
import BaseDialog from './BaseDialog.vue'

const props = defineProps<{
  modelValue: boolean
  removeName?: string
}>()
const emit = defineEmits<{ (e: 'confirm'): void; (e: 'cancel'): void; (e: 'update:modelValue', v: boolean): void }>()

const showModal = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

function clickYes() {
  vibrate()
  emit('confirm')
  showModal.value = false
}
function clickNo() {
  vibrate()
  emit('cancel')
  showModal.value = false
}
</script>

