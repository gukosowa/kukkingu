<template>
  <BaseDialog v-model="showModal" size="sm" @close="close">
    <template #header>
      <div class="px-4 py-3">
        <div class="flex items-start">
          <Icon v-if="props.icon || 'fal fa-info-circle'" :icon="props.icon || 'fal fa-info-circle'" class="text-blue-500 mr-3 mt-1" size="1.5rem" />
          <div class="flex-1">
            <div class="text-lg text-gray-700 font-bold">{{ title }}</div>
          </div>
        </div>
      </div>
    </template>

    <template #content>
      <div class="px-5 pb-4">
        <div class="text-sm text-gray-700 whitespace-pre-line">{{ message }}</div>
        <slot />
      </div>
    </template>

    <template #footer>
      <div class="px-4 py-3">
        <button
          class="cursor-pointer py-3 w-full bg-blue-600 text-white rounded-lg drop-shadow hover:bg-blue-700 transition-colors"
          @click="acknowledge"
        >
          {{ props.okText || t('OK') }}
        </button>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Icon from './Icon.vue'
import { t } from '~src/i18n'
import { vibrate } from '~src/services/vibrate'
import BaseDialog from './BaseDialog.vue'

const props = defineProps<{
  modelValue: boolean
  title: string
  message: string
  icon?: string
  okText?: string
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'ok'): void
}>()

const showModal = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

function acknowledge() {
  vibrate()
  emit('ok')
  showModal.value = false
}
function close() {
  vibrate()
  showModal.value = false
}
</script>


