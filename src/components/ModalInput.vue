<template>
  <BaseDialog v-model="showModal" size="sm" @close="close">
    <template #header>
      <div class="px-4 py-3">
        <div class="text-lg text-gray-600 font-bold">{{ title }}</div>
      </div>
    </template>

    <template #content>
      <div class="px-4 pb-4">
        <SInput
          v-if="!props.multiline"
          v-model="localValue"
          :placeholder="props.placeholder || ''"
          :autofocus="true"
          ref="inputRef"
        />
        <textarea
          v-else
          v-model="localValue"
          :placeholder="props.placeholder || ''"
          ref="textareaRef"
          class="w-full border focus:ring-indigo-500 text-black p-2 focus:border-indigo-500 shadow-sm sm:text-sm border-gray-300 rounded-md"
        />
      </div>
    </template>

    <template #footer>
      <div class="px-4 py-3 flex gap-3">
        <button
          class="cursor-pointer py-3 px-4 bg-gray-500 text-white rounded-lg drop-shadow flex-1 hover:bg-gray-600 transition-colors"
          @click="close"
        >
          {{ props.cancelText || t('Cancel') }}
        </button>
        <button
          class="cursor-pointer py-3 px-4 bg-green-500 text-white rounded-lg drop-shadow flex-1 hover:bg-green-600 transition-colors"
          @click="confirm"
        >
          {{ props.confirmText || t('OK') }}
        </button>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted, computed } from 'vue'
import SInput from './Input.vue'
import { t } from '~src/i18n'
import { vibrate } from '~src/services/vibrate'
import BaseDialog from './BaseDialog.vue'

const props = defineProps<{
  modelValue: boolean
  title: string
  placeholder?: string
  confirmText?: string
  cancelText?: string
  value?: string
  multiline?: boolean
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
const inputRef = ref<InstanceType<typeof SInput> | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
function refocusTextarea() {
  const el = textareaRef.value
  if (!el) return
  el.blur()
  window.setTimeout(() => {
    el.focus()
  }, 200)
}
function handleVisibility() {
  if (document.visibilityState === 'visible' && props.modelValue && props.multiline) {
    refocusTextarea()
  }
}
onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibility)
  window.addEventListener('focus', handleVisibility)
})
onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibility)
  window.removeEventListener('focus', handleVisibility)
})
watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      localValue.value = props.value
      nextTick(() => {
        if (props.multiline) {
          textareaRef.value?.focus()
        } else {
          inputRef.value?.focus?.()
        }
      })
    }
  }
)

function confirm() {
  vibrate()
  emit('confirm', localValue.value || '')
}
function close() {
  emit('cancel')
  showModal.value = false
}
</script>

