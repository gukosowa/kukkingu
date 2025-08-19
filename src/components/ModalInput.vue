<template>
  <div v-if="modelValue">
    <div class="fixed w-screen h-screen bg-black top-0 left-0 z-40 opacity-50" />
    <Transition
      appear
      enter-active-class="transition ease-out duration-150"
      enter-from-class="opacity-0 translate-y-3"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="modelValue"
        class="fixed w-screen w-full h-screen top-0 left-0 z-50 overflow-y-auto"
        style="backdrop-filter: blur(1px)"
        @click="close"
      >
        <div class="w-full min-h-full px-12 py-8 flex flex-col transform">
          <div class="bg-white p-5 rounded-xl drop-shadow" @click.stop>
            <div class="text-lg text-gray-600 font-bold">{{ title }}</div>
            <div class="my-5">
              <SInput
                v-if="!multiline"
                v-model="localValue"
                :placeholder="placeholder"
                :autofocus="true"
                ref="inputRef"
              />
              <textarea
                v-else
                v-model="localValue"
                :placeholder="placeholder"
                ref="textareaRef"
                class="w-full border focus:ring-indigo-500 text-black p-2 focus:border-indigo-500 shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            <div class="text-white text-center">
              <div
                class="cursor-pointer py-3 my-2 bg-green-500 rounded-lg drop-shadow"
                @click="confirm"
              >
                {{ confirmText }}
              </div>
              <div
                class="cursor-pointer py-3 bg-gray-500 rounded-lg drop-shadow"
                @click="close"
              >
                {{ cancelText }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import SInput from './Input.vue'
import { t } from '~src/i18n'
import { vibrate } from '~src/services/vibrate'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    placeholder?: string
    confirmText?: string
    cancelText?: string
    value?: string
    multiline?: boolean
  }>(),
  {
    placeholder: '',
    confirmText: t('OK'),
    cancelText: t('Cancel'),
    value: '',
    multiline: false,
  }
)
const emit = defineEmits<{
  (e: 'confirm', v: string): void
  (e: 'cancel'): void
  (e: 'update:modelValue', v: boolean): void
}>()

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
  emit('confirm', localValue.value)
}
function close() {
  vibrate()
  emit('cancel')
  emit('update:modelValue', false)
}
</script>

<style scoped>
  .drop-shadow {
    filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))
      drop-shadow(0 1px 1px rgb(0 0 0 / 0.06));
  }
</style>
