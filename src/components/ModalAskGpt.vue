<template>
  <BaseDialog v-model="showModal" size="lg" @close="close">
    <template #header>
      <div class="px-4 py-3">
        <div class="text-lg text-gray-600 font-bold">{{ props.title || t('Ask GPT') }}</div>
      </div>
    </template>

    <template #content>
      <div class="space-y-4">
        <!-- Predefined Questions -->
        <div>
          <div class="text-sm text-gray-500 mb-2">{{ t('Quick questions') }}:</div>
          <div class="space-y-2">
            <button
              @click="addQuestion(t('gpt_add_tags'))"
              class="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
            >
              <div class="font-medium text-blue-800 break-words">{{ t('Add Tags') }}</div>
              <div class="text-sm text-blue-600 break-words">{{ t('Add tags to this recipe') }}</div>
            </button>

            <button
              @click="addQuestion(t('gpt_add_procedure'))"
              class="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
            >
              <div class="font-medium text-green-800 break-words">{{ t('Add Cooking Procedure') }}</div>
              <div class="text-sm text-green-600 break-words">{{ t('Add cooking procedure to this recipe') }}</div>
            </button>

            <button
              @click="addQuestion(t('gpt_find_similar'))"
              class="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
            >
              <div class="font-medium text-purple-800 break-words">{{ t('Find Similar Recipes') }}</div>
              <div class="text-sm text-purple-600 break-words">{{ t('List me 10 URLs of similar recipes or cooking sites') }}</div>
            </button>
          </div>
        </div>

        <!-- Custom Question -->
        <div>
          <div class="text-sm text-gray-500 mb-2">{{ t('Or ask your own question') }}:</div>
          <textarea
            v-model="localValue"
            :placeholder="props.placeholder || t('Type your question here...')"
            ref="textareaRef"
            class="w-full border focus:ring-indigo-500 text-black p-3 focus:border-indigo-500 shadow-sm sm:text-sm border-gray-300 rounded-md min-h-[80px] resize-none"
            rows="3"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="px-4 py-3 flex gap-3">
        <button
          class="cursor-pointer py-3 flex-1 bg-gray-500 text-white rounded-lg drop-shadow hover:bg-gray-600 transition-colors"
          @click="close"
        >
          {{ props.cancelText || t('Cancel') }}
        </button>
        <button
          class="cursor-pointer py-3 flex-1 bg-green-500 text-white rounded-lg drop-shadow hover:bg-green-600 transition-colors"
          @click="confirm"
        >
          {{ props.confirmText || t('Ask GPT') }}
        </button>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { t } from '~src/i18n'
import { vibrate } from '~src/services/vibrate'
import BaseDialog from './BaseDialog.vue'

const props = defineProps<{
  modelValue: boolean
  title?: string
  placeholder?: string
  confirmText?: string
  cancelText?: string
  value?: string
}>()

const emit = defineEmits<{
  (e: 'confirm', v: string): void
  (e: 'cancel'): void
  (e: 'update:modelValue', v: boolean): void
}>()

const showModal = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const localValue = ref(props.value)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

function addQuestion(question: string) {
  if (localValue.value?.trim()) {
    localValue.value += '\n\n' + question
  } else {
    localValue.value = question
  }

  // Focus the textarea after adding the question
  nextTick(() => {
    textareaRef.value?.focus()
    // Move cursor to the end
    if (textareaRef.value) {
      textareaRef.value.selectionStart = textareaRef.value.value.length
      textareaRef.value.selectionEnd = textareaRef.value.value.length
    }
  })
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      localValue.value = props.value
      nextTick(() => {
        textareaRef.value?.focus()
      })
    }
  }
)

function confirm() {
  vibrate()
  emit('confirm', localValue.value || '')
}

function close() {
  vibrate()
  emit('cancel')
  showModal.value = false
}
</script>

