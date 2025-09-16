<template>
  <BaseDialog v-model="showModal" size="sm" @close="close">
    <template #header>
      <div class="px-4 py-3">
        <div class="flex items-start">
          <Icon icon="fal fa-check-circle" class="text-green-500 mr-3 mt-1" size="1.5rem" />
          <div class="flex-1">
            <div class="text-lg text-gray-700 font-bold">{{ t('Prompt Ready') }}</div>
          </div>
        </div>
      </div>
    </template>

    <template #content>
      <div class="px-5 pb-4">
        <div class="text-sm text-gray-700 whitespace-pre-line">{{ displayMessage }}</div>
      </div>
    </template>

    <template #footer>
      <div class="px-3 py-2">
        <button
          class="cursor-pointer py-3 w-full bg-green-600 text-white rounded-lg drop-shadow hover:bg-green-700 transition-colors"
          @click="goToAI"
        >
          <Icon icon="fal fa-external-link" size="0.9rem" class="mr-2" />
          {{ gotoButtonText }}
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
  message?: string
  aiService?: 'chatgpt' | 'gemini'
  gotoText?: string
  gotoUrl?: string
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'goToAI'): void
}>()

const showModal = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

function close() {
  vibrate()
  showModal.value = false
}

// Computed properties for flexible content
const displayMessage = computed(() => {
  return props.message || t('We copied the prompt to your clipboard. You can now paste it into ChatGPT.')
})

const shouldShowGotoButton = computed(() => {
  return props.aiService || props.gotoUrl || props.gotoText
})

const gotoButtonText = computed(() => {
  if (props.gotoText) return props.gotoText
  if (props.aiService === 'gemini') return t('Go to Gemini')
  return t('Go to ChatGPT')
})

function goToAI() {
  vibrate()
  emit('goToAI')
  showModal.value = false
}
</script>
