<template>
  <BaseDialog v-model="showModal" size="sm" @close="close">
    <template #header>
      <div class="px-4 py-3">
        <div class="text-lg text-gray-600 font-bold">{{ title }}</div>
      </div>
    </template>

    <template #content>
      <div class="space-y-4">
        <div>
          <div class="text-sm text-gray-600 mb-1">{{ t('Recipe URL') }}</div>
          <SInput
            v-model="localUrl"
            :placeholder="placeholderUrl"
            :autofocus="true"
            ref="inputRef"
          />
        </div>
        <div>
          <div class="text-sm text-gray-600 mb-1">{{ t('Recipe text') }}</div>
          <textarea
            v-model="localText"
            :placeholder="placeholderText"
            ref="textareaRef"
            rows="1"
            class="w-full focus:ring-indigo-500 border text-black p-2 focus:border-indigo-500 shadow-sm sm:text-sm border-gray-300 rounded-md overflow-hidden resize-none"
            @input="autoResize"
          />
        </div>
        <div class="flex items-center">
          <Checkbox class="mr-2" v-model="localFromPicture" />
          <label
            class="text-sm text-gray-600 cursor-pointer"
            @click="localFromPicture = !localFromPicture"
          >
            {{ t('From pictures') }}
          </label>
        </div>
        <div>
          <div class="text-sm text-gray-600 mb-1">{{ t('Additional Instructions') }}</div>
          <textarea
            v-model="localAdditionalInstruction"
            :placeholder="t('Additional instructions for GPT (optional)')"
            rows="2"
            class="w-full focus:ring-indigo-500 border text-black p-2 focus:border-indigo-500 shadow-sm sm:text-sm border-gray-300 rounded-md overflow-hidden resize-none"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="px-3 py-2 flex gap-3">
        <button
          class="cursor-pointer py-3 flex-1 bg-gray-500 text-white rounded-lg drop-shadow hover:bg-gray-600 transition-colors"
          @click="close"
        >
          {{ computedCancelText }}
        </button>
        <button
          class="cursor-pointer py-3 flex-1 bg-green-500 text-white rounded-lg drop-shadow hover:bg-green-600 transition-colors"
          @click="confirm"
        >
          {{ computedConfirmText }}
        </button>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import SInput from './Input.vue'
import Checkbox from './Checkbox.vue'
import { t } from '~src/i18n'
import { vibrate } from '~src/services/vibrate'
import BaseDialog from './BaseDialog.vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    placeholderUrl?: string
    placeholderText?: string
    confirmText?: string
    cancelText?: string
    url?: string
    text?: string
    fromPicture?: boolean
    additionalInstruction?: string
  }>(),
  {
    placeholderUrl: t('https://example.com'),
    placeholderText: '',
    url: '',
    text: '',
    fromPicture: false,
    additionalInstruction: '',
  }
)
const emit = defineEmits<{
  (e: 'confirm', v: { url: string; text: string; fromPicture: boolean; additionalInstruction: string }): void
  (e: 'cancel'): void
  (e: 'update:modelValue', v: boolean): void
}>()

const showModal = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const computedConfirmText = computed(() => props.confirmText ?? t('OK'))
const computedCancelText = computed(() => props.cancelText ?? t('Cancel'))

const localUrl = ref(props.url)
const localText = ref(props.text)
const localFromPicture = ref(props.fromPicture)
const localAdditionalInstruction = ref(props.additionalInstruction)
const inputRef = ref<InstanceType<typeof SInput> | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

function autoResize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      localUrl.value = props.url || ''
      localText.value = props.text || ''
      localFromPicture.value = props.fromPicture || false
      localAdditionalInstruction.value = props.additionalInstruction || ''
      nextTick(() => {
        inputRef.value?.focus?.()
        autoResize()
      })
    }
  }
)

function confirm() {
  vibrate()
  emit('confirm', {
    url: (localUrl.value || '').trim(),
    text: (localText.value || '').trim(),
    fromPicture: localFromPicture.value,
    additionalInstruction: (localAdditionalInstruction.value || '').trim(),
  })
  showModal.value = false
}
function close() {
  vibrate()
  emit('cancel')
  showModal.value = false
}
</script>

